import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseAdapter, storage } from '../services/storage';

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

  // LOGS DE DEPURAÇÃO PARA O EASYPANEL
  useEffect(() => {
    console.log('--- ONIX DEBUG ---');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ NÃO ENCONTRADA');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ DEFINIDA' : '❌ NÃO ENCONTRADA');
    console.log('------------------');
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Tenta buscar o usuário, mas previne falha se o adapter estiver quebrado
        const response = await supabaseAdapter.getCurrentUser();
        if (response && response.user) {
          setUser(response.user);
        }
      } catch (err) {
        console.error("Erro ao verificar sessão inicial:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    const { user, error } = await supabaseAdapter.login(email, password);
    
    if (error) {
      throw new Error(error.message);
    }

    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const { user, error } = await supabaseAdapter.register(userData);
    
    if (error) {
      throw new Error(error.message);
    }

    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await supabaseAdapter.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    // PROTEÇÃO: Impede o erro de tela branca se 'user' for null
    if (!user) {
    
      storage.setCurrentUser(updatedUser);
  const updateUser = (updatedData) => {
    // PROTEÇÃO: Impede o erro de tela branca se 'user' for null
    if (!user) {
      console.warn("Tentativa de atualizar usuário nulo abortada.");
      return;
    }
    loading,
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
        
    // Sincroniza com o localStorage/storage local se existir
    if (storage) {
      storage.setCurrentUser(updatedUser);
      const users = storage.getUsers();
      if (Array.isArray(users)) {
        const userIndex = users.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...updatedData };
          storage.setUsers(users);
        }
      }
    }
  };
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin'
  };

  // Enquanto estiver carregando a sessão inicial, mostramos um loading simples
  // Isso evita que componentes filhos tentem ler o estado 'user' antes de ser definido.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando sistema Onix...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};