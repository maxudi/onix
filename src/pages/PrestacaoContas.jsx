import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  Edit2, Save, ArrowUpCircle, ArrowDownCircle, History, RefreshCw
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PrestacaoContas() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); 
  const [saldoAnterior, setSaldoAnterior] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newDescription, setNewDescription] = useState('');

  const years = Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => 2023 + i);
  const months = [
    { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
    { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
  ];

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setRefreshing(true);
    
    try {
      let startDate, endDate;
      if (selectedMonth) {
        const dateStr = `${selectedYear}-${selectedMonth}-01`;
        startDate = startOfMonth(parseISO(dateStr)).toISOString();
        endDate = endOfMonth(parseISO(dateStr)).toISOString();
      } else {
        startDate = startOfYear(parseISO(`${selectedYear}-01-01`)).toISOString();
        endDate = endOfYear(parseISO(`${selectedYear}-12-31`)).toISOString();
      }

      const [prevRes, extRes, invRes] = await Promise.all([
        supabase.from('extrato').select('valor').lt('data_entrada', startDate),
        supabase.from('extrato').select('*').gte('data_entrada', startDate).lte('data_entrada', endDate).order('data_entrada', { ascending: false }),
        // Filtro de Investimentos: Se sua tabela tiver coluna de data, filtramos aqui. 
        // Caso contrário, ele exibe a posição atual (comum em dashboards de saldo).
        supabase.from('investimentos').select('*').order('ativo', { ascending: true })
      ]);

      if (prevRes.data) {
        const totalPrev = prevRes.data.reduce((acc, t) => acc + Number(t.valor), 0) || 0;
        setSaldoAnterior(totalPrev);
      }

      if (extRes.data) setTransactions(extRes.data);
      if (invRes.data) setInvestments(invRes.data);

    } catch (err) {
      // Erro silencioso
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500); // Feedback visual suave
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000); // Polling a cada 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Cálculos
  const creditos = transactions.filter(t => t.tipo_operacao === 'C');
  const debitos = transactions.filter(t => t.tipo_operacao === 'D');
  const totalCredito = creditos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  const totalDebito = debitos.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  const saldoCC = saldoAnterior + totalCredito - totalDebito;
  const saldoInvest = investments.reduce((acc, i) => acc + Number(i.valor), 0);

  const handleSaveDescription = async () => {
    const { error } = await supabase
      .from('extrato')
      .update({ descricao: newDescription })
      .eq('idTransacao', editingTransaction.idTransacao);

    if (!error) {
      setIsModalOpen(false);
      fetchData(false);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary-500" size={32} />
          <div className="font-black text-gray-400 uppercase tracking-widest text-sm">Carregando Onix Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header com Filtros e Botão Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Prestação de Contas</h1>
          <button 
            onClick={() => fetchData(false)} 
            className={`p-2 rounded-full hover:bg-white transition-all ${refreshing ? 'text-primary-500' : 'text-gray-300'}`}
            title="Sincronizar dados agora"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer hover:border-primary-300 transition-colors">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer hover:border-primary-300 transition-colors">
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Saldo Anterior" value={saldoAnterior} icon={<History size={20}/>} color="text-gray-400" bgColor="bg-gray-100" />
        <StatCard title="Entradas" value={totalCredito} icon={<TrendingUp size={20}/>} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Saídas" value={totalDebito} icon={<TrendingDown size={20}/>} color="text-red-600" bgColor="bg-red-50" />
        <StatCard title="C/C Atual" value={saldoCC} icon={<DollarSign size={20}/>} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Investido" value={saldoInvest} icon={<Wallet size={20}/>} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard title="Total Geral" value={saldoCC + saldoInvest} icon={<DollarSign size={20}/>} color="text-primary-600" bgColor="bg-primary-50" />
      </div>

      {/* Tabelas Principais */}
      <TableSection title="Entradas / Créditos" icon={<ArrowUpCircle className="text-green-500" />} data={creditos} total={totalCredito} onEdit={(t) => {setEditingTransaction(t); setNewDescription(t.descricao || ''); setIsModalOpen(true);}} type="C" />
      <TableSection title="Saídas / Débitos" icon={<ArrowDownCircle className="text-red-500" />} data={debitos} total={totalDebito} onEdit={(t) => {setEditingTransaction(t); setNewDescription(t.descricao || ''); setIsModalOpen(true);}} type="D" />

      {/* Tabela de Investimentos (Sempre visível para conferência) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-purple-700 uppercase text-xs">
            <Wallet size={18} /> Composição da Carteira
          </div>
          <div className="text-right">
            <div className="text-[10px] text-purple-400 font-bold uppercase leading-none">Saldo em {selectedMonth ? months.find(m => m.v === selectedMonth).l : selectedYear}</div>
            <div className="text-lg font-black text-purple-700">
              {saldoInvest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
              <tr>
                <th className="p-4">Ativo</th>
                <th className="p-4 text-center">Rentabilidade (12m)</th>
                <th className="p-4 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {investments.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 font-bold text-gray-900">{inv.ativo}</td>
                  <td className="p-4 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      +{inv.rentabilidade_12m}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-gray-900 tabular-nums">
                    {Number(inv.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">Ajustar Lançamento</h3>
              <div className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-400">ID: {editingTransaction.idTransacao}</div>
            </div>
            
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Descrição Detalhada</label>
            <textarea 
              className="w-full p-4 border rounded-xl min-h-[140px] outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 resize-none" 
              value={newDescription} 
              onChange={(e) => setNewDescription(e.target.value)} 
              placeholder="Digite aqui os detalhes deste movimento..." 
            />
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveDescription} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-200 active:scale-95 transition-all">
                <Save size={18}/> Confirmar
              </button>
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function StatCard({ title, value, icon, color, bgColor }) {
  return (
    <div className={`${bgColor} p-4 rounded-2xl border border-white shadow-sm flex flex-col justify-between min-h-[100px]`}>
      <div className={`flex items-center gap-2 ${color} font-black text-[10px] uppercase tracking-wider`}>
        {icon}
        {title}
      </div>
      <div className={`text-xl font-black ${color} tabular-nums mt-2`}>
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
}

function TableSection({ title, icon, data, total, onEdit, type }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`p-4 border-b flex justify-between items-center ${type === 'C' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
        <div className={`flex items-center gap-2 font-black uppercase text-xs ${type === 'C' ? 'text-green-700' : 'text-red-700'}`}>
          {icon} {title}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 font-bold uppercase leading-none">Subtotal</div>
          <div className={`text-lg font-black ${type === 'C' ? 'text-green-700' : 'text-red-700'}`}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400 font-medium italic">
                  Nenhum lançamento encontrado para este período.
                </td>
              </tr>
            ) : (
              data.map((t) => (
                <tr key={t.idTransacao} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                    {format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800 line-clamp-1">{t.descricao || 'Sem descrição'}</div>
                    <div className="text-[10px] text-gray-400 font-medium">Ref: {t.idTransacao}</div>
                  </td>
                  <td className={`p-4 text-right font-black tabular-nums ${type === 'C' ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onEdit(t)}
                      className="p-2 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}