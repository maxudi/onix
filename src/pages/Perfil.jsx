import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
import { 
  User, Mail, Phone, Home, CreditCard, Lock, Save, AlertCircle, CheckCircle 
} from 'lucide-react';

export default function Perfil() {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Inicializamos o formulário com valores vazios ou dados do usuário se já existirem
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    unit: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Efeito para sincronizar os dados do usuário com o formulário quando o Auth terminar de carregar
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        unit: user.unit || ''
      });
    }
  }, [user]);

  // Realtime Supabase movido para DENTRO do componente para ter acesso ao 'user'
  useEffect(() => {
    if (!isSupabaseEnabled() || !user?.id) return;

    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpf: data.cpf,
          unit: data.unit
        });
      }
    };

    fetchUser();

    const channel = supabase
      .channel('public:users-perfil')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users', 
          filter: `id=eq.${user.id}` 
        }, 
        payload => {
          if (payload) fetchUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // --- PROTEÇÃO DE CARREGAMENTO ---
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    try {
      updateUser(formData);
      setIsEditing(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Erro ao atualizar perfil');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setShowPasswordForm(false);
    setSuccessMessage('Senha alterada com sucesso!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      cpf: user?.cpf || '',
      unit: user?.unit || ''
    });
    setErrorMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Informações Pessoais</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              Editar Perfil
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full">
              <span className="text-3xl font-bold text-primary-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-gray-600">
                {user?.role === 'admin' ? 'Administrador' : `Unidade ${user?.unit}`}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ProfileInput label="Nome Completo" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} Icon={User} />
            <ProfileInput label="Email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} Icon={Mail} />
            <ProfileInput label="Telefone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} Icon={Phone} />
            <ProfileInput label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} disabled={!isEditing} Icon={CreditCard} />
            {user?.role !== 'admin' && (
               <ProfileInput label="Unidade/Apartamento" name="unit" value={formData.unit} onChange={handleChange} disabled={!isEditing} Icon={Home} />
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleCancel} className="flex-1 btn-secondary">Cancelar</button>
              <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Salvar Alterações
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Security Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Segurança</h2>
            <p className="text-sm text-gray-600 mt-1">Altere sua senha de acesso</p>
          </div>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)} className="btn-secondary flex items-center gap-2">
              <Lock className="w-5 h-5" /> Alterar Senha
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordInput label="Senha Atual" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
            <PasswordInput label="Nova Senha" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
            <PasswordInput label="Confirmar Nova Senha" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 btn-secondary">Cancelar</button>
              <button type="submit" className="flex-1 btn-primary">Alterar Senha</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Subcomponentes para limpeza do código
function ProfileInput({ label, name, value, onChange, disabled, Icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" name={name} value={value} onChange={onChange} disabled={disabled} className="input-field pl-11 disabled:bg-gray-50 disabled:text-gray-600" required />
      </div>
    </div>
  );
}

function PasswordInput({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="password" name={name} value={value} onChange={onChange} className="input-field pl-11" placeholder="••••••••" required />
      </div>
    </div>
  );
}