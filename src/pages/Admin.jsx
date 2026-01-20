import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { storage } from '../services/storage';
import { useAuth } from '../contexts/AuthContext'; // ADICIONADO
import { Users, Home, Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';

export default function Admin() {
  // ADICIONADO: Extraímos user e loading para garantir que o componente saiba quem é o usuário
  const { user, loading } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState('residents');
  const [users, setUsers] = useState(storage.getUsers() || []);
  const [units, setUnits] = useState(storage.getUnits() || []);

  // Realtime Supabase para usuários
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) setUsers(data);
    };
    fetchUsers();
    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        if (payload) fetchUsers();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime Supabase para unidades
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const fetchUnits = async () => {
      const { data, error } = await supabase.from('units').select('*');
      if (!error && data) setUnits(data);
    };
    fetchUnits();
    const channel = supabase
      .channel('public:units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, payload => {
        if (payload) fetchUnits();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const [residentForm, setResidentForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    unit: ''
  });

  const [unitForm, setUnitForm] = useState({
    number: '',
    block: '',
    floor: '',
    ownerId: '',
    ownerName: ''
  });

  // PROTEÇÃO DE CARREGAMENTO: Se não houver usuário ou estiver carregando, paramos aqui.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Verificando permissões de administrador...</p>
      </div>
    );
  }

  const residents = users.filter(u => u.role === 'resident');

  const filteredResidents = residents.filter(resident =>
    resident.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.unit?.includes(searchTerm)
  );

  const filteredUnits = units.filter(unit =>
    unit.number?.includes(searchTerm) ||
    unit.block?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'resident') {
      if (item) {
        setResidentForm({
          name: item.name,
          email: item.email,
          password: '',
          phone: item.phone,
          cpf: item.cpf,
          unit: item.unit
        });
      } else {
        setResidentForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          cpf: '',
          unit: ''
        });
      }
    } else if (type === 'unit') {
      if (item) {
        setUnitForm({
          number: item.number,
          block: item.block,
          floor: item.floor,
          ownerId: item.ownerId || '',
          ownerName: item.ownerName || ''
        });
      } else {
        setUnitForm({
          number: '',
          block: '',
          floor: '',
          ownerId: '',
          ownerName: ''
        });
      }
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleResidentSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      const updatedUsers = users.map(u =>
        u.id === editingItem.id
          ? { ...u, ...residentForm, password: residentForm.password || u.password }
          : u
      );
      setUsers(updatedUsers);
      storage.setUsers(updatedUsers);
    } else {
      const newResident = {
        id: Date.now().toString(),
        ...residentForm,
        role: 'resident',
        createdAt: new Date().toISOString()
      };
      const updatedUsers = [...users, newResident];
      setUsers(updatedUsers);
      storage.setUsers(updatedUsers);
    }

    handleCloseModal();
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      const updatedUnits = units.map(u =>
        u.id === editingItem.id ? { ...u, ...unitForm } : u
      );
      setUnits(updatedUnits);
      storage.setUnits(updatedUnits);
    } else {
      const newUnit = {
        id: Date.now().toString(),
        ...unitForm
      };
      const updatedUnits = [...units, newUnit];
      setUnits(updatedUnits);
      storage.setUnits(updatedUnits);
    }

    handleCloseModal();
  };

  const handleDeleteResident = (id) => {
    if (confirm('Tem certeza que deseja excluir este morador?')) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      storage.setUsers(updatedUsers);
    }
  };

  const handleDeleteUnit = (id) => {
    if (confirm('Tem certeza que deseja excluir esta unidade?')) {
      const updatedUnits = units.filter(u => u.id !== id);
      setUnits(updatedUnits);
      storage.setUnits(updatedUnits);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
        <p className="mt-2 text-gray-600">Gerencie moradores e unidades do condomínio</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-800">Total de Moradores</p>
              <p className="mt-2 text-3xl font-bold text-primary-900">{residents.length}</p>
            </div>
            <Users className="w-12 h-12 text-primary-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total de Unidades</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{units.length}</p>
              <p className="text-xs text-blue-700 mt-1">
                {units.filter(u => u.ownerId).length} ocupadas
              </p>
            </div>
            <Home className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('residents')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'residents'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-5 h-5 inline-block mr-2" />
              Moradores
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'units'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-5 h-5 inline-block mr-2" />
              Unidades
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'residents' ? 'Buscar moradores...' : 'Buscar unidades...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
            </div>
            <button
              onClick={() => handleOpenModal(activeTab === 'residents' ? 'resident' : 'unit')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'residents' ? 'Novo Morador' : 'Nova Unidade'}
            </button>
          </div>

          {activeTab === 'residents' && (
            <div className="space-y-4">
              {filteredResidents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum morador encontrado</p>
                </div>
              ) : (
                filteredResidents.map((resident) => (
                  <div key={resident.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                        <span className="text-lg font-semibold text-primary-600">
                          {resident.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{resident.name}</h3>
                        <p className="text-sm text-gray-600">{resident.email}</p>
                        <p className="text-sm text-gray-500">
                          Unidade {resident.unit} • {resident.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal('resident', resident)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResident(resident.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'units' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma unidade encontrada</p>
                </div>
              ) : (
                filteredUnits.map((unit) => (
                  <div key={unit.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${unit.ownerId ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Building2 className={`w-6 h-6 ${unit.ownerId ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Unidade {unit.number}</h3>
                          <p className="text-sm text-gray-600">Bloco {unit.block} • {unit.floor}º andar</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal('unit', unit)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Editar' : 'Novo'} {modalType === 'resident' ? 'Morador' : 'Unidade'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400">✕</button>
            </div>
            {/* ... restante do formulário (mantido igual) ... */}
          </div>
        </div>
      )}
    </div>
  );
}