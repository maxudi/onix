import { supabase, isSupabaseEnabled } from '../lib/supabase';

// Storage service - Abstração para localStorage (fallback)
class StorageService {
  constructor() {
    this.prefix = 'onix_';
  }

  // Métodos genéricos
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

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // Métodos específicos da aplicação
  getCurrentUser() {
    return this.get('currentUser');
  }

  setCurrentUser(user) {
    this.set('currentUser', user);
  }

  clearCurrentUser() {
    this.remove('currentUser');
  }

  getUsers() {
    return this.get('users') || [];
  }

  setUsers(users) {
    this.set('users', users);
  }

  getBills() {
    return this.get('bills') || [];
  }

  setBills(bills) {
    this.set('bills', bills);
  }

  getBookings() {
    return this.get('bookings') || [];
  }

  setBookings(bookings) {
    this.set('bookings', bookings);
  }

  getNotices() {
    return this.get('notices') || [];
  }

  setNotices(notices) {
    this.set('notices', notices);
  }

  getUnits() {
    return this.get('units') || [];
  }

  setUnits(units) {
    this.set('units', units);
  }
}

export const storage = new StorageService();

// Adapter para Supabase ou localStorage
export const supabaseAdapter = {
  async login(email, password) {
    // Usar Supabase se disponível
    if (isSupabaseEnabled()) {
      try {
        // Buscar usuário no Supabase
        const { data: users, error: queryError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password) // NOTA: Use hash em produção!
          .single();

        if (queryError || !users) {
          return { user: null, error: { message: 'Credenciais inválidas' } };
        }

        const { password: _, ...userWithoutPassword } = users;
        storage.setCurrentUser(userWithoutPassword);
        return { user: userWithoutPassword, error: null };
      } catch (err) {
        console.error('Erro ao fazer login com Supabase:', err);
        return { user: null, error: { message: 'Erro ao conectar com servidor' } };
      }
    }

    // Fallback para localStorage
    const users = storage.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      storage.setCurrentUser(userWithoutPassword);
      return { user: userWithoutPassword, error: null };
    }
    return { user: null, error: { message: 'Credenciais inválidas' } };
  },

  async register(userData) {
    // Usar Supabase se disponível
    if (isSupabaseEnabled()) {
      try {
        // Verificar se email já existe
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (existing) {
          return { user: null, error: { message: 'Email já cadastrado' } };
        }

        // Criar novo usuário
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            ...userData,
            role: 'resident'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar usuário:', insertError);
          return { user: null, error: { message: 'Erro ao criar conta' } };
        }

        const { password, ...userWithoutPassword } = newUser;
        storage.setCurrentUser(userWithoutPassword);
        return { user: userWithoutPassword, error: null };
      } catch (err) {
        console.error('Erro ao registrar com Supabase:', err);
        return { user: null, error: { message: 'Erro ao conectar com servidor' } };
      }
    }

    // Fallback para localStorage
    const users = storage.getUsers();
    const existingUser = users.find(u => u.email === userData.email);
    
    if (existingUser) {
      return { user: null, error: { message: 'Email já cadastrado' } };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: 'resident',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    storage.setUsers(users);

    const { password, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, error: null };
  },

  async logout() {
    storage.clearCurrentUser();
    return { error: null };
  },

  async getCurrentUser() {
    const user = storage.getCurrentUser();
    return { user, error: null };
  }
};
