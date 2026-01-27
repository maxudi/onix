import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const months = [
  { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
  { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
  { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
  { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
];

export default function DemaisGastos() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const years = Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => 2022 + i);

  const fetchData = useCallback(async () => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    
    let startDate, endDate;
    if (selectedMonth) {
      const dateStr = `${selectedYear}-${selectedMonth}-01`;
      startDate = startOfMonth(parseISO(dateStr)).toISOString().split('T')[0];
      endDate = endOfMonth(parseISO(dateStr)).toISOString().split('T')[0];
    } else {
      startDate = `${selectedYear}-01-01`;
      endDate = `${selectedYear}-12-31`;
    }

    const { data, error } = await supabase
      .from('extrato')
      .select('*')
      .gte('data_entrada', startDate)
      .lte('data_entrada', endDate);

    if (!error && data) {
      const filtroRestante = t => {
        const txt = `${t.descricao || ''} ${t.detalhe || ''} ${t.titulo || ''}`.toLowerCase();
        
        // Termos de Energia (Para excluir)
        const isEnergia = txt.includes('energia') || txt.includes('cemig') || txt.includes('3004884');
        
        // Termos de Água (Para excluir)
        const isAgua = txt.includes('agua') || txt.includes('água') || txt.includes('dmae');

        // Retorna apenas Débitos que NÃO sejam energia e NÃO sejam água
        return t.tipo_operacao === 'D' && !isEnergia && !isAgua;
      };
      
      setTransactions(data.filter(filtroRestante));
    }
    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Agrupamento para o Gráfico
  const consumoPorMes = useMemo(() => {
    return months.map(m => {
      const mesTrans = transactions.filter(t => (t.data_entrada || '').slice(5, 7) === m.v);
      return mesTrans.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
    });
  }, [transactions]);

  const chartData = {
    labels: months.map(m => m.l),
    datasets: [
      {
        label: 'Demais Gastos (R$)',
        data: consumoPorMes,
        backgroundColor: 'rgba(71, 85, 105, 0.7)', // Cor Slate para diferenciar da energia
        borderRadius: 8,
      }
    ]
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Demais Gastos</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">(Exceto Energia e Água)</p>
        </div>
        
        <div className="flex gap-2">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white font-black text-xs shadow-sm outline-none cursor-pointer uppercase">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white font-black text-xs shadow-sm outline-none cursor-pointer uppercase">
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#475569',
                font: { weight: 'bold', size: 10 },
                formatter: value => value > 0 ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '',
              }
            },
            scales: { 
              y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
              x: { grid: { display: false } }
            }
          }}
        />
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
        <h2 className="text-sm font-black mb-6 text-slate-900 uppercase italic">Detalhamento dos Lançamentos</h2>
        {loading ? (
           <div className="flex items-center justify-center py-10"><span className="animate-pulse font-bold text-slate-300">CARREGANDO...</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] text-slate-400 font-black uppercase">
                  <th className="pb-4 px-2">Data</th>
                  <th className="pb-4 px-2">Descrição / Detalhe</th>
                  <th className="pb-4 px-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.length > 0 ? transactions.map(t => (
                  <tr key={t.idTransacao} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 text-slate-400 font-bold uppercase text-[9px] whitespace-nowrap">
                      {format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}
                    </td>
                    <td className="py-4 px-2">
                      <p className="uppercase text-[11px] font-black text-slate-700 leading-none">{t.descricao || t.titulo}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase truncate max-w-xs">{t.detalhe}</p>
                    </td>
                    <td className="py-4 px-2 text-right font-black text-slate-900 text-xs">
                      {Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-slate-300 font-bold uppercase text-xs">Nenhum gasto encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}