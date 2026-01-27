import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Send, User, DollarSign, Calendar, CheckCircle2, 
  Loader2, Search, X, Users, Square, Percent, ChevronRight, Hash
} from 'lucide-react';

const formatCurrency = (value) => {
  const amount = value.replace(/\D/g, "");
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
};

const getNextDay10 = () => {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();
  if (hoje.getDate() > 10) { mes += 1; if (mes > 11) { mes = 0; ano += 1; } }
  return `${ano}-${(mes + 1).toString().padStart(2, '0')}-10`;
};

export default function GerarBoleto() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [busca, setBusca] = useState('');
  const [usuarios, setUsuarios] = useState([]); 
  const [selecionados, setSelecionados] = useState([]);
  const [valorVisual, setValorVisual] = useState("");

  const [formData, setFormData] = useState({
    valor: '0',
    vencimento: getNextDay10(),
    descricao: '',
    multa: '1.00',
    mora: '1.00'
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from("perfis")
          .select("id, nome_completo, unidade_numero, status")
          .eq('status', true)
          .order("unidade_numero"); // Ordenar por unidade facilita a localização
        if (error) throw error;
        setUsuarios(data || []);
      } catch (err) { console.error(err); }
    };
    fetchUsuarios();
  }, []);

  const toggleUsuario = (user) => {
    const isSelected = selecionados.find(s => s.id === user.id);
    setSelecionados(isSelected ? selecionados.filter(s => s.id !== user.id) : [...selecionados, user]);
  };

  const handleValorChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setValorVisual(formatCurrency(e.target.value));
    setFormData({ ...formData, valor: (rawValue / 100).toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selecionados.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        configuracao: {
          valor_unitario: parseFloat(formData.valor),
          multa_percentual: parseFloat(formData.multa),
          mora_percentual: parseFloat(formData.mora),
          vencimento: formData.vencimento,
          descricao: formData.descricao.toUpperCase(),
        },
        ids_condominos: selecionados.map(s => s.id)
      };
      const response = await fetch('https://n8n.netminas.com/webhook/gera_boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSelecionados([]);
          setValorVisual("");
          setFormData({ ...formData, valor: '0', descricao: '', vencimento: getNextDay10() });
        }, 3000);
      }
    } catch (err) { alert("Erro ao enviar"); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* HEADER ESTATÍSTICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Faturamento em Lote</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Base de dados: {usuarios.length} unidades ativas</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Selecionados</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{selecionados.length} <span className="text-slate-300 text-xs">/ {usuarios.length}</span></p>
          </div>
          <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Total Estimado</p>
            <p className="text-xl font-black text-slate-900 leading-none">
               {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(parseFloat(formData.valor) * selecionados.length)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BUSCA E SELEÇÃO (6 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="BUSCAR NOME OU UNIDADE..."
                className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                value={busca} onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelecionados(usuarios)} className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase">Selecionar Todos</button>
              <button onClick={() => setSelecionados([])} className="flex-1 bg-white text-slate-400 border border-slate-200 py-2 rounded-xl text-[9px] font-black uppercase">Limpar</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {usuarios.filter(u => u.nome_completo?.toUpperCase().includes(busca.toUpperCase()) || u.unidade_numero?.toString().includes(busca)).map((u) => {
              const isSelected = selecionados.find(s => s.id === u.id);
              return (
                <button key={u.id} onClick={() => toggleUsuario(u)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {u.unidade_numero}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-700 leading-tight">{u.nome_completo}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RESUMO DA SELEÇÃO (3 colunas) */}
        <div className="lg:col-span-3 bg-slate-900 rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-black uppercase text-[10px] tracking-widest italic">Checklist de Envio</h2>
            <span className="bg-white/10 text-white px-2 py-1 rounded-md text-[9px] font-bold">{selecionados.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {selecionados.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl group hover:bg-white/10 transition-all">
                <span className="text-[9px] font-bold text-slate-300 uppercase truncate pr-2">Unid {s.unidade_numero} - {s.nome_completo.split(' ')[0]}</span>
                <button onClick={() => toggleUsuario(s)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
              </div>
            ))}
            {selecionados.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                <Users size={32} className="mb-2 opacity-20" />
                <p className="text-[9px] font-black uppercase px-4">Nenhuma unidade selecionada para o faturamento</p>
              </div>
            )}
          </div>
        </div>

        {/* CONFIGURAÇÃO FINAL (4 colunas) */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200 h-fit space-y-6">
          <h2 className="font-black uppercase text-xs text-indigo-600 border-b pb-4 flex items-center gap-2 italic">Configuração de Cobrança</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Valor Unitário</label>
              <input required type="text" value={valorVisual} onChange={handleValorChange} className="w-full p-5 bg-indigo-50/50 border-none rounded-3xl text-2xl font-black text-indigo-700 outline-none" placeholder="R$ 0,00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Multa (%)</label>
                <input required type="number" step="0.01" value={formData.multa} onChange={e => setFormData({...formData, multa: e.target.value})} className="w-full bg-transparent border-none p-0 text-sm font-black outline-none" />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Mora (%)</label>
                <input required type="number" step="0.01" value={formData.mora} onChange={e => setFormData({...formData, mora: e.target.value})} className="w-full bg-transparent border-none p-0 text-sm font-black outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Vencimento</label>
              <input required type="date" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Descrição</label>
              <textarea required rows="3" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold uppercase outline-none" placeholder="TAXA MENSAL..." />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || selecionados.length === 0} 
            className={`w-full py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600 disabled:bg-slate-100'}`}
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : success ? "ENVIADO!" : `FATURAR ${selecionados.length} UNIDADES`}
          </button>
        </form>
      </div>
    </div>
  );
}