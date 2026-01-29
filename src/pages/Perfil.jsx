import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Phone, Home, CreditCard, Lock, Save, AlertCircle, CheckCircle, Edit2, X
} from 'lucide-react';

export default function Perfil() {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    unit: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isSupabaseEnabled() || !user?.id) return;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setFormData({
            name: data.nome_completo || '',
            email: user.email || '',
            phone: data.telefone || '',
            cpf: data.cpf || '',
            unit: data.unidade_numero || ''
          });
        }
      } catch (err) {
        console.error("Erro ao buscar dados do perfil:", err);
      }
    };

    fetchUser();
  }, [user?.id, user?.email]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Carregando seu perfil...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    try {
      if (isSupabaseEnabled()) {
        const { error } = await supabase
          .from('perfis')
          .update({
            nome_completo: formData.name,
            telefone: formData.phone,
            cpf: formData.cpf,
            unidade: formData.unit
          })
          .eq('id', user.id);
        
        if (error) throw error;
      }

      updateUser({
        ...user,
        nome_completo: formData.name,
        phone: formData.phone,
        unit: formData.unit
      });
      
      setIsEditing(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Erro ao atualizar perfil no banco de dados');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('As senhas não coincidem');
      return;
    }

    const { error } = await supabase.auth.updateUser({ 
      password: passwordData.newPassword 
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowPasswordForm(false);
    setSuccessMessage('Senha alterada com sucesso!');
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight text-primary-600">Meu Perfil</h1>
          <p className="text-gray-500 font-medium">Gerencie suas informações e segurança.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
          >
            <Edit2 size={18} /> Editar Perfil
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <CheckCircle size={20} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-primary-600">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-primary-600">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 outline-none transition-all font-medium text-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 outline-none transition-all font-medium text-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Unidade/Apto</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 outline-none transition-all font-medium text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition-all"
                >
                  <Save size={18} /> Salvar Alterações
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Lock className="text-orange-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Segurança</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sua senha deve ter pelo menos 6 caracteres.</p>
            {!showPasswordForm ? (
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-2.5 border-2 border-primary-600 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all"
              >
                Trocar Minha Senha
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Nova senha"
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500 text-gray-600"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirme a senha"
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500 text-gray-600"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-xl font-bold hover:bg-primary-700">
                    OK
                  </button>
                  <button onClick={() => setShowPasswordForm(false)} className="p-2 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}