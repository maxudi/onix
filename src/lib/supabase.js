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

// Função utilitária para testar conexão com Supabase
export async function testSupabaseConnection() {
  if (!supabase) return { ok: false, error: 'Supabase não configurado' };
  try {
    // Tenta buscar 1 usuário (ou qualquer tabela existente)
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
