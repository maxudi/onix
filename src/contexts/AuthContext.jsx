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
          setUser(response.user);
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
            
            setUser({ ...session.user, role: profile?.tipo_usuario });
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

    // Lógica de senha padrão
    const senhasPadrao = ['Onix2026', 'admin123', '123456'];
    const precisaTrocarSenha = senhasPadrao.includes(password);
    
    setForcePasswordChange(precisaTrocarSenha);
    
    const userWithRole = { ...user, precisaTrocarSenha };
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

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
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