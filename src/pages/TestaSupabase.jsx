import React, { useState } from 'react';
import { testSupabaseConnection } from '../lib/supabase';

export default function TestaSupabase() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setStatus('testando...');
    setError(null);
    const result = await testSupabaseConnection();
    if (result.ok) {
      setStatus('✅ Conexão com Supabase OK!');
    } else {
      setStatus('❌ Falha na conexão com Supabase');
      setError(result.error);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Testar conexão com Supabase</h2>
      <button onClick={handleTest} style={{ padding: 8, fontSize: 16 }}>
        Testar conexão
      </button>
      {status && <div style={{ marginTop: 16 }}>{status}</div>}
      {error && <pre style={{ color: 'red', marginTop: 8 }}>{error}</pre>}
    </div>
  );
}
