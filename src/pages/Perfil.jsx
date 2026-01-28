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

  useEffect(() => {
    if (!isSupabaseEnabled() || !user?.id) return;

    const fetchUser = async () => {
      try {
        // CORREÇÃO: Tabela 'perfis' em vez de 'users'
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setFormData({
            name: data.nome_completo || '',
            email: user.email || '', // Email vem do Auth
            phone: data.telefone || '',
            cpf: data.cpf || '',
            unit: data.unidade || ''
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
        // CORREÇÃO: Update na tabela 'perfis' com nomes de colunas corretos
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

    // CORREÇÃO: Alteração de senha REAL no Supabase Auth
    const { error } = await supabase.auth.updateUser({ 
      password: passwordData.newPassword 
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowPasswordForm(false);
    setSuccessMessage('Senha alterada com sucesso!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* O resto do seu código de interface (JSX) permanece igual */}
      {/* ... (mantenha o seu retorno HTML/JSX atual) ... */}
      <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
      {/* ... conteúdo ... */}
    </div>
  );
}