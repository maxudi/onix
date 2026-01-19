import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Using localStorage mode.');
  console.info('💡 Para usar Supabase, configure as variáveis no arquivo .env');
} else {
  console.log('✅ Supabase está habilitado!');
  console.log('🔗 URL:', supabaseUrl);
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Verificar se Supabase está disponível
export const isSupabaseEnabled = () => supabase !== null;
