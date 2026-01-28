import { supabase } from '../lib/supabase';

// 1. Objeto StorageService (Necessário para evitar o erro no Perfil.jsx)
class StorageService {
  constructor() {
    this.prefix = 'onix_';
  }

  get(key) {
    const data = localStorage.getItem(this.prefix + key);
    return data ? JSON.parse(data) : null;
  }

  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  // Atalhos usados pelos componentes
  getCurrentUser() { return this.get('currentUser'); }
  setCurrentUser(user) { this.set('currentUser', user); }
  clearCurrentUser() { this.remove('currentUser'); }
}

export const storage = new StorageService();

// 2. Adapter para Supabase Auth + Perfis
export const supabaseAdapter = {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, error };

      const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const userFinal = {
        ...data.user,
        role: profile?.tipo_usuario || 'morador',
        nome_completo: profile?.nome_completo || data.user.email
      };

      // Importante: Manter o storage local atualizado também
      storage.setCurrentUser(userFinal);

      return { user: userFinal, error: null };
    } catch (err) {
      return { user: null, error: { message: 'Erro de conexão' } };
    }
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { user: null };

    const { data: profile } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const user = { 
      ...session.user, 
      role: profile?.tipo_usuario || 'morador',
      nome_completo: profile?.nome_completo 
    };
    
    storage.setCurrentUser(user);
    return { user, error: null };
  },

  async logout() {
    await supabase.auth.signOut();
    storage.clearCurrentUser();
  }
};