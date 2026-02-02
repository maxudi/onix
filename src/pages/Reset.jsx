import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Reset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const redirectTo = window.location.origin + '/update-password';
      const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (supaErr) throw supaErr;
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Não foi possível enviar o e-mail de redefinição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-slate-700 text-xs font-black uppercase tracking-[0.2em]">
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Link>
          </div>

          <h1 className="text-xl font-black text-slate-800 mb-2 uppercase italic">Redefinir Senha</h1>
          <p className="text-slate-500 text-sm mb-6">Informe o e-mail cadastrado para receber o link de redefinição.</p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight">Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all"
                  placeholder="exemplo@onix.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar link de redefinição'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
