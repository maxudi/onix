import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  Edit2, Save, ArrowUpCircle, ArrowDownCircle, History, RefreshCw
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// CORREÇÃO: Imports de PDF movidos para o topo
import { PDFDownloadLink } from '@react-pdf/renderer';
import BalancetePDF from '../components/BalancetePDF';

export default function PrestacaoContas() {
  const { user } = useAuth();
  
  // Estados de Dados
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [saldoCC, setSaldoCC] = useState(0);
  const [valorUltimoInvestimento, setValorUltimoInvestimento] = useState(0);
  
  // Estados de Controle
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saldoAnteriorLoading, setSaldoAnteriorLoading] = useState(true);
  
  // Estados de Filtro
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); 

  // Estados do Modal de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newDescription, setNewDescription] = useState('');

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
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Cálculos de soma
  const creditos = transactions.filter(t => t.tipo_operacao === 'C');
  const debitos = transactions.filter(t => t.tipo_operacao === 'D');
  const totalCredito = creditos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  const totalDebito = debitos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);

  const handleSaveDescription = async () => {
    const { error } = await supabase.from('extrato').update({ descricao: newDescription }).eq('idTransacao', editingTransaction.idTransacao);
    if (!error) { setIsModalOpen(false); fetchData(false); }
  };

  // Montagem dos dados para o PDF
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
        <div className="flex flex-col items-center gap-4 text-primary-600 font-black uppercase tracking-widest text-sm">
          <RefreshCw className="animate-spin" size={32} />
          <span>Carregando Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Prestação de Contas</h1>
          <button onClick={() => fetchData(false)} className={`p-2 rounded-full hover:bg-white shadow-sm transition-all ${refreshing ? 'text-primary-500' : 'text-gray-300'}`}>
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          
          <PDFDownloadLink
            document={<BalancetePDF mes={mesLabel} ano={selectedYear} saldoAnterior={saldoAnterior} saldoCorrente={saldoCC} lancamentos={lancamentos} />}
            fileName={`balancete_${selectedYear}_${selectedMonth || 'ano'}.pdf`}
          >
            {({ loading }) => (
              <button className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold text-xs hover:bg-primary-700 transition-colors">
                {loading ? 'Gerando PDF...' : 'Baixar Balancete PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
        <div className="flex gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer">
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Saldo Anterior" value={saldoAnterior} icon={<History size={18}/>} color="text-gray-500" bgColor="bg-white" loading={saldoAnteriorLoading} />
        <StatCard title="Entradas Mês" value={totalCredito} icon={<TrendingUp size={18}/>} color="text-green-600" bgColor="bg-white" />
        <StatCard title="Saídas Mês" value={totalDebito} icon={<TrendingDown size={18}/>} color="text-red-600" bgColor="bg-white" />
        <StatCard title="C/C Atual" value={saldoCC} icon={<DollarSign size={18}/>} color="text-blue-600" bgColor="bg-white" />
        <StatCard title="Saldo Investimento" value={valorUltimoInvestimento} icon={<Wallet size={18}/>} color="text-purple-600" bgColor="bg-white" />
        <StatCard title="Saldo Total" value={saldoCC + valorUltimoInvestimento} icon={<DollarSign size={18}/>} color="text-primary-600" bgColor="bg-primary-50 border-primary-100" />
      </div>

      <TableSection title="Entradas / Créditos" icon={<ArrowUpCircle className="text-green-500" />} data={creditos} total={totalCredito} type="C" onEdit={(t) => {setEditingTransaction(t); setNewDescription(t.descricao || ''); setIsModalOpen(true);}} />
      <TableSection title="Saídas / Débitos" icon={<ArrowDownCircle className="text-red-500" />} data={debitos} total={totalDebito} type="D" onEdit={(t) => {setEditingTransaction(t); setNewDescription(t.descricao || ''); setIsModalOpen(true);}} />

      {/* Modal e Tabelas de Investimento continuam os mesmos... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 border-b pb-2">Editar Descrição</h3>
            <textarea className="w-full p-4 border border-gray-200 rounded-xl min-h-[120px] outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveDescription} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"><Save size={16}/> Salvar</button>
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-black text-xs uppercase hover:bg-gray-100 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componentes de apoio StatCard e TableSection...
function StatCard({ title, value, icon, color, bgColor, loading }) {
  return (
    <div className={`${bgColor} p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[110px]`}>
      <div className={`flex items-center gap-2 ${color} font-black text-[10px] uppercase tracking-wider opacity-80`}>
        {icon} {title}
      </div>
      <div className={`text-base font-black ${color} tabular-nums mt-2`}>
        {loading ? <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" /> : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
}

function TableSection({ title, icon, data, total, type, onEdit }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`p-4 border-b flex justify-between items-center ${type === 'C' ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
        <div className={`flex items-center gap-2 font-black uppercase text-xs ${type === 'C' ? 'text-green-700' : 'text-red-700'}`}>
          {icon} {title}
        </div>
        <div className={`text-lg font-black ${type === 'C' ? 'text-green-700' : 'text-red-700'}`}>
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((t) => (
              <tr key={t.idTransacao} className="group hover:bg-gray-50/50">
                <td className="p-4 text-gray-400 font-bold uppercase text-[10px]">{format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}</td>
                <td className="p-4 uppercase text-[11px] font-bold text-gray-700">{t.descricao}</td>
                <td className={`p-4 text-right font-black ${type === 'C' ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => onEdit(t)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-primary-500"><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}