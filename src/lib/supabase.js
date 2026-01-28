import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. Verificação robusta das variáveis
const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasCredentials) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não encontradas!');
}

// 2. Cria o client sempre (evita que o objeto seja null e quebre o código adiante)
// Se não houver credenciais, ele criará um cliente "vazio" que não quebra o sistema ao ser chamado
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseEnabled = () => hasCredentials;

// 3. Função de teste atualizada para a sua nova realidade
export async function testSupabaseConnection() {
  if (!hasCredentials) return { ok: false, error: 'Credenciais ausentes' };
  
  try {
    // Agora testamos na tabela correta: 'perfis'
    const { error } = await supabase.from('perfis').select('count', { count: 'exact', head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}