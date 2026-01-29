import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAdapter } from '../services/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Tenta buscar via adapter primeiro
        const response = await supabaseAdapter.getCurrentUser();
        
        if (response?.user) {
          // Garante que role seja 'admin' se tipo_usuario for 'sindico'
          let role = response.user.role;
          if (role === 'sindico') role = 'admin';
          setUser({ ...response.user, role });
        } else {
          // Fallback: Se o adapter falhar, pergunta direto ao Supabase Auth
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Busca o perfil para ter o role de sindico/morador
            const { data: profile } = await supabase
              .from('perfis')
              .select('*')
              .eq('id', session.user.id)
              .single();
            let role = profile?.tipo_usuario;
            if (role === 'sindico') role = 'admin';
            setUser({ ...session.user, role: role || 'morador' });
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão inicial:", err);
      } finally {
        // Isso garante que a tela branca saia sempre
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    const { user, error } = await supabaseAdapter.login(email, password);
    if (error) throw new Error(error.message);

    // Força role para 'admin' se tipo_usuario for 'sindico'
    let role = user?.role;
    if (role === 'sindico') role = 'admin';

    // Lógica de senha padrão
    const senhasPadrao = ['Onix2026', 'admin123', '123456'];
    const precisaTrocarSenha = senhasPadrao.includes(password);
    setForcePasswordChange(precisaTrocarSenha);

    const userWithRole = { ...user, role, precisaTrocarSenha };
    setUser(userWithRole);
    return userWithRole;
  };

  const logout = async () => {
    try {
      await supabaseAdapter.logout();
    } finally {
      setUser(null);
      setForcePasswordChange(false);
    }
  };

  const updateUser = (updatedData) => {
    if (!user) return;
    setUser(prev => ({ ...prev, ...updatedData }));
  };


  // Função de registro robusta
  // Novo fluxo: senha padrão = CPF (apenas números), não pede senha no formulário
  const register = async ({ name, email, phone, cpf, unit, tipo_usuario = 'morador' }) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    // 1. Cria usuário no Supabase Auth com senha = CPF
    const { data, error } = await supabase.auth.signUp({
      email,
      password: cpfLimpo
    });
    if (error) throw new Error(error.message);
    const userId = data.user?.id;
    if (!userId) throw new Error('Erro ao obter ID do usuário');

    // 2. Cria perfil na tabela perfis
    const { error: profileError } = await supabase.from('perfis').insert({
      id: userId,
      nome_completo: name,
      email,
      telefone: phone,
      cpf: cpfLimpo,
      unidade: unit,
      tipo_usuario
    });
    if (profileError) throw new Error(profileError.message);

    // 3. Login automático após registro
    await login(email, cpfLimpo);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    register,
    // AJUSTADO: Agora reconhece 'sindico' como administrador
    isAdmin: user?.role === 'sindico' || user?.role === 'admin',
    forcePasswordChange,
    setForcePasswordChange
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium italic">ONIX: Autenticando...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};