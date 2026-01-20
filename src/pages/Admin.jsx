import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
// storage removed: all data now from Supabase only
import { useAuth } from '../contexts/AuthContext';
import { Users, Home, Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';

export default function Admin() {
  const { user, loading } = useAuth(); 
  
  // Inicializamos com dados do storage ou array vazio
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [activeTab, setActiveTab] = useState('residents');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // --- BUSCA ESTÁTICA VIA HTTP (SEM REALTIME/WEBSOCKET) ---
  useEffect(() => {
    if (!isSupabaseEnabled()) return;

    const fetchData = async () => {
      try {
        // Busca Usuários
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*');
        if (!userError && userData) setUsers(userData);

        // Busca Unidades
        const { data: unitData, error: unitError } = await supabase
          .from('units')
          .select('*');
        if (!unitError && unitData) setUnits(unitData);
      } catch (err) {
        console.error("Erro ao buscar dados do Admin:", err);
      }
    };

    fetchData();
    // Removemos o código do .channel() e .subscribe() para eliminar o erro de WebSocket
  }, []);

  const [residentForm, setResidentForm] = useState({
    name: '', email: '', password: '', phone: '', cpf: '', unit: ''
  });

  const [unitForm, setUnitForm] = useState({
    number: '', block: '', floor: '', ownerId: '', ownerName: ''
  });

  // --- GUARDA DE SEGURANÇA ---
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Verificando permissões de administrador...</p>
      </div>
    );
  }

  // Filtros seguros (usando optional chaining)
  const residents = (users || []).filter(u => u.role === 'resident');

  const filteredResidents = residents.filter(resident =>
    resident.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.unit?.toString().includes(searchTerm)
  );

  const filteredUnits = (units || []).filter(unit =>
    unit.number?.toString().includes(searchTerm) ||
    unit.block?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'resident') {
      setResidentForm(item ? { ...item, password: '' } : { name: '', email: '', password: '', phone: '', cpf: '', unit: '' });
    } else {
      setUnitForm(item ? { ...item } : { number: '', block: '', floor: '', ownerId: '', ownerName: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleResidentSubmit = async (e) => {
    e.preventDefault();
    const updatedData = editingItem 
      ? users.map(u => u.id === editingItem.id ? { ...u, ...residentForm } : u)
      : [...users, { id: Date.now().toString(), ...residentForm, role: 'resident', createdAt: new Date().toISOString() }];
    
    setUsers(updatedData);
    handleCloseModal();
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    const updatedData = editingItem 
      ? units.map(u => u.id === editingItem.id ? { ...u, ...unitForm } : u)
      : [...units, { id: Date.now().toString(), ...unitForm }];
    
    setUnits(updatedData);
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
        <button onClick={() => handleOpenModal(activeTab === 'residents' ? 'resident' : 'unit')} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo {activeTab === 'residents' ? 'Morador' : 'Unidade'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card bg-blue-50 border-blue-200 flex items-center justify-between">
          <div><p className="text-sm text-blue-800">Moradores</p><p className="text-2xl font-bold">{residents.length}</p></div>
          <Users className="w-10 h-10 text-blue-600 opacity-20" />
        </div>
        <div className="card bg-green-50 border-green-200 flex items-center justify-between">
          <div><p className="text-sm text-green-800">Unidades</p><p className="text-2xl font-bold">{units.length}</p></div>
          <Building2 className="w-10 h-10 text-green-600 opacity-20" />
        </div>
      </div>

      <div className="card p-0">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('residents')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'residents' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>MORADORES</button>
          <button onClick={() => setActiveTab('units')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'units' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>UNIDADES</button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" />
          </div>

          {activeTab === 'residents' ? (
            <div className="space-y-3">
              {filteredResidents.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div><p className="font-bold">{r.name}</p><p className="text-xs text-gray-500">{r.email} • Unidade {r.unit}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal('resident', r)} className="p-2 text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('Excluir?')) setUsers(users.filter(u => u.id !== r.id)) }} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUnits.map(u => (
                <div key={u.id} className="p-4 border rounded-lg">
                  <h3 className="font-bold">Apt {u.number} - Bloco {u.block}</h3>
                  <p className="text-sm text-gray-600">Proprietário: {u.ownerName || 'Vazio'}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleOpenModal('unit', u)} className="flex-1 text-xs btn-secondary">Editar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Editar' : 'Novo'} {modalType}</h2>
            <form onSubmit={modalType === 'resident' ? handleResidentSubmit : handleUnitSubmit} className="space-y-4">
              {modalType === 'resident' ? (
                <>
                  <input className="input-field" placeholder="Nome" value={residentForm.name} onChange={e => setResidentForm({...residentForm, name: e.target.value})} required />
                  <input className="input-field" placeholder="Email" value={residentForm.email} onChange={e => setResidentForm({...residentForm, email: e.target.value})} required />
                  <input className="input-field" placeholder="Unidade" value={residentForm.unit} onChange={e => setResidentForm({...residentForm, unit: e.target.value})} required />
                </>
              ) : (
                <>
                  <input className="input-field" placeholder="Número" value={unitForm.number} onChange={e => setUnitForm({...unitForm, number: e.target.value})} required />
                  <input className="input-field" placeholder="Bloco" value={unitForm.block} onChange={e => setUnitForm({...unitForm, block: e.target.value})} required />
                </>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}