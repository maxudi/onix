import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  Edit2, Save, ArrowUpCircle, ArrowDownCircle, History, RefreshCw, X
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { PDFDownloadLink } from '@react-pdf/renderer';
import BalancetePDF from '../components/BalancetePDF';

export default function PrestacaoContas() {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [saldoCC, setSaldoCC] = useState(0);
  const [valorUltimoInvestimento, setValorUltimoInvestimento] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saldoAnteriorLoading, setSaldoAnteriorLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); 

  // Modal de Edição de Detalhe
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newDetail, setNewDetail] = useState('');

  const years = Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => 2022 + i);
  const months = [
    { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
    { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
  ];

  const fetchData = useCallback(async (isInitial = false) => {
    if (!isSupabaseEnabled()) return;
    if (isInitial) setLoading(true);
    setRefreshing(true);
    setSaldoAnteriorLoading(true);
    
    try {
      let startDate, endDate, dataLimiteSaldoAnterior;

      if (selectedMonth) {
        const dateStr = `${selectedYear}-${selectedMonth}-01`;
        startDate = startOfMonth(parseISO(dateStr)).toISOString().split('T')[0];
        endDate = endOfMonth(parseISO(dateStr)).toISOString().split('T')[0];
        const dataLimite = new Date(selectedYear, parseInt(selectedMonth, 10) - 1, 0);
        dataLimiteSaldoAnterior = dataLimite.toISOString().split('T')[0];
      } else {
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
        dataLimiteSaldoAnterior = `${parseInt(selectedYear, 10) - 1}-12-31`;
      }

      const [prevRes, periodRes, allRes, invCardRes, invListRes] = await Promise.all([
        supabase.from('extrato').select('valor, tipo_operacao').lte('data_entrada', dataLimiteSaldoAnterior),
        supabase.from('extrato').select('*').gte('data_entrada', startDate).lte('data_entrada', endDate).order('data_entrada', { ascending: false }),
        supabase.from('extrato').select('valor, tipo_operacao'),
        supabase.from('investimentos').select('valor, data').order('data', { ascending: false }).limit(1),
        supabase.from('investimentos').select('*').gte('data', startDate).lte('data', endDate).order('data', { ascending: false }).limit(1)
      ]);

      const calcularSaldo = (data) => data?.reduce((acc, t) => {
        const val = Math.abs(Number(t.valor));
        return t.tipo_operacao === 'C' ? acc + val : acc - val;
      }, 0) || 0;

      setSaldoAnterior(calcularSaldo(prevRes.data));
      setSaldoCC(calcularSaldo(allRes.data));
      setValorUltimoInvestimento(Number(invCardRes.data?.[0]?.valor || 0));
      if (periodRes.data) setTransactions(periodRes.data);
      setInvestments(invListRes.data || []);

    } catch (err) {
      console.error("Erro na sincronização de dados:", err);
    } finally {
      setLoading(false);
      setSaldoAnteriorLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const creditos = transactions.filter(t => t.tipo_operacao === 'C');
  const debitos = transactions.filter(t => t.tipo_operacao === 'D');
  const totalCredito = creditos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  const totalDebito = debitos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);

  const handleUpdateDetail = async () => {
    const { error } = await supabase
      .from('extrato')
      .update({ detalhe: newDetail })
      .eq('idTransacao', editingTransaction.idTransacao);
    
    if (!error) { 
      setIsModalOpen(false); 
      fetchData(false); 
    }
  };

  const mesLabel = selectedMonth ? months.find(m => m.v === selectedMonth)?.l : 'Ano Inteiro';
  const lancamentos = transactions.map(t => ({
    data: t.data_entrada,
    descricao: t.descricao,
    credito: t.tipo_operacao === 'C' ? Math.abs(Number(t.valor)) : null,
    debito: t.tipo_operacao === 'D' ? Math.abs(Number(t.valor)) : null,
  }));

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Prestação de Contas</h1>
          <PDFDownloadLink
            document={<BalancetePDF mes={mesLabel} ano={selectedYear} saldoAnterior={saldoAnterior} saldoCorrente={saldoCC} lancamentos={lancamentos} />}
            fileName={`balancete_${selectedYear}_${selectedMonth || 'ano'}.pdf`}
          >
            {({ loading }) => (
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold text-xs hover:shadow-lg transition-all active:scale-95">
                {loading ? 'GERANDO...' : 'BAIXAR BALANCETE PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
        <div className="flex gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="p-2.5 rounded-xl border-none bg-white font-bold text-sm shadow-sm focus:ring-2 focus:ring-primary-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2.5 rounded-xl border-none bg-white font-bold text-sm shadow-sm focus:ring-2 focus:ring-primary-500">
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Saldo Anterior" value={saldoAnterior} icon={<History size={16}/>} color="text-slate-500" loading={saldoAnteriorLoading} />
        <StatCard title="Entradas Mês" value={totalCredito} icon={<TrendingUp size={16}/>} color="text-emerald-600" />
        <StatCard title="Saídas Mês" value={totalDebito} icon={<TrendingDown size={16}/>} color="text-rose-600" />
        <StatCard title="C/C Atual" value={saldoCC} icon={<DollarSign size={16}/>} color="text-blue-600" />
        <StatCard title="Investimento" value={valorUltimoInvestimento} icon={<Wallet size={16}/>} color="text-violet-600" />
        <StatCard title="Saldo Total" value={saldoCC + valorUltimoInvestimento} icon={<DollarSign size={16}/>} color="text-primary-700" isHighlight />
      </div>

      {/* TABLES */}
      <div className="space-y-8">
        <TableSection 
          title="Entradas / Créditos" 
          icon={<ArrowUpCircle className="text-emerald-500" />} 
          data={creditos} 
          total={totalCredito} 
          type="C" 
          onEdit={(t) => {setEditingTransaction(t); setNewDetail(t.detalhe || ''); setIsModalOpen(true);}} 
        />
        <TableSection 
          title="Saídas / Débitos" 
          icon={<ArrowDownCircle className="text-rose-500" />} 
          data={debitos} 
          total={totalDebito} 
          type="D" 
          onEdit={(t) => {setEditingTransaction(t); setNewDetail(t.detalhe || ''); setIsModalOpen(true);}} 
        />
      </div>

      {/* ELEGANT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Ajuste de Lançamento</span>
              <h3 className="text-xl font-black text-slate-800 mt-1 uppercase italic">Editar Detalhes</h3>
              <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tight">
                Origem: {editingTransaction?.descricao}
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observação Interna</label>
              <textarea 
                placeholder="Insira informações complementares aqui..."
                className="w-full p-5 border-none bg-slate-50 rounded-2xl min-h-[140px] outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 font-medium transition-all shadow-inner"
                value={newDetail} 
                onChange={(e) => setNewDetail(e.target.value)} 
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleUpdateDetail} 
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary-600 transition-all shadow-lg active:scale-95"
              >
                <Save size={16}/> Confirmar Edição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, loading, isHighlight }) {
  return (
    <div className={`p-5 rounded-3xl border ${isHighlight ? 'bg-primary-600 border-none shadow-blue-200 shadow-xl' : 'bg-white border-slate-100 shadow-sm'} flex flex-col gap-3 transition-transform hover:-translate-y-1`}>
      <div className={`flex items-center gap-2 ${isHighlight ? 'text-white/70' : color} font-black text-[9px] uppercase tracking-[0.15em]`}>
        {icon} {title}
      </div>
      <div className={`text-lg font-black tabular-nums ${isHighlight ? 'text-white' : 'text-slate-800'}`}>
        {loading ? <div className="h-6 w-24 bg-slate-100 animate-pulse rounded-lg" /> : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
}

function TableSection({ title, icon, data, total, type, onEdit }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className={`p-6 px-8 border-b border-slate-50 flex justify-between items-center ${type === 'C' ? 'bg-emerald-50/20' : 'bg-rose-50/20'}`}>
        <div className={`flex items-center gap-3 font-black uppercase text-[11px] tracking-widest ${type === 'C' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {icon} {title}
        </div>
        <div className={`text-xl font-black italic ${type === 'C' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="p-6 px-8 w-32">Data</th>
              <th className="p-6">Detalhamento</th>
              <th className="p-6 text-right w-48">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((t) => (
              <tr 
                key={t.idTransacao} 
                onClick={() => onEdit(t)}
                className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                <td className="p-6 px-8 text-slate-400 font-bold uppercase text-[10px] whitespace-nowrap">
                  {format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="uppercase text-[12px] font-black text-slate-700 leading-none group-hover:text-primary-600 transition-colors">
                      {t.descricao}
                    </span>
                    {t.detalhe && (
                      <span className="text-[10px] text-slate-400 font-bold italic lowercase leading-tight">
                        {t.detalhe}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`p-6 text-right font-black tabular-nums text-[13px] ${type === 'C' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}