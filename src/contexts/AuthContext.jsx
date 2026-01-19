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

  useEffect(() => {
    // Verificar se há um usuário logado
    const checkUser = async () => {
      const { user } = await supabaseAdapter.getCurrentUser();
      setUser(user);
      setLoading(false);
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
    await supabaseAdapter.logout();
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    storage.setCurrentUser(updatedUser);

    // Atualizar também na lista de usuários
    const users = storage.getUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedData };
      storage.setUsers(users);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
