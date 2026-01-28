import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ForcePasswordChangeModal({ onPasswordChanged }) {
  const { user, setForcePasswordChange } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // Troca de senha real com Supabase Auth
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError('Erro ao alterar senha: ' + error.message);
        setLoading(false);
        return;
      }
      setForcePasswordChange(false);
      onPasswordChanged && onPasswordChanged();
      setLoading(false);
    } catch (err) {
      setError('Erro ao alterar senha.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-primary-600">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Troca de Senha Obrigatória</h2>
        <p className="mb-4 text-gray-600">Por motivos de segurança, altere sua senha padrão antes de continuar.</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Nova senha"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Confirme a nova senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-all"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
