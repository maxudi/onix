import { useState, useEffect, useCallback } from 'react';
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

export default function ConsumoEnergia() {
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
    // Busca débitos com descrição, detalhe ou título contendo 'energia' ou 'cemig' (case-insensitive)
    const { data, error } = await supabase
      .from('extrato')
      .select('*')
      .gte('data_entrada', startDate)
      .lte('data_entrada', endDate);
    if (!error && data) {
      const filtro = t => {
        const txt = `${t.descricao || ''} ${t.detalhe || ''} ${t.titulo || ''}`.toLowerCase();
        return t.tipo_operacao === 'D' && (
          txt.includes('energia') ||
          txt.includes('cemig') ||
          txt.includes('3004884')
        );
      };
      setTransactions(data.filter(filtro));
    }
    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Agrupa por mês para o gráfico
  const meses = months.map(m => m.v);
  const consumoPorMes = meses.map(m => {
    const mesTrans = transactions.filter(t => (t.data_entrada || '').slice(5,7) === m);
    return mesTrans.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  });

  const chartData = {
    labels: months.map(m => m.l),
    datasets: [
      {
        label: 'Consumo Energia/CEMIG (R$)',
        data: consumoPorMes,
        backgroundColor: 'rgba(251, 191, 36, 0.7)'
      }
    ]
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-yellow-700 uppercase tracking-tight">Consumo Energia / CEMIG</h1>
        <div className="flex gap-2">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none cursor-pointer">
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-6">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: false },
              datalabels: {
                anchor: 'end',
                align: 'start',
                color: '#b45309',
                font: { weight: 'bold', size: 12 },
                formatter: value => value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                clamp: true
              }
            },
            scales: { y: { beginAtZero: true } }
          }}
          plugins={[ChartDataLabels]}
        />
      </div>
      <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 text-yellow-900">Lançamentos Mês a Mês</h2>
        {loading ? <div>Carregando...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-yellow-50 text-xs text-yellow-400 font-black uppercase">
              <tr>
                <th className="p-2">Data</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-50">
              {transactions.map(t => (
                <tr key={t.idTransacao}>
                  <td className="p-2 text-gray-400 font-bold uppercase text-[10px]">{format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}</td>
                  <td className="p-2 uppercase text-[11px] font-bold text-gray-700">{t.descricao}</td>
                  <td className="p-2 text-right font-black text-yellow-700">{Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
