import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bar } from 'react-chartjs-2';
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

// Registro global fora do componente
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const months = [
  { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
  { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
  { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
  { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
];

export default function ConsumoAgua({ embedMode }) {
  const { user } = useAuth();
  const chartRef = useRef(null); // Referência para controle do canvas
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
      const filtro = t => {
        const txt = `${t.descricao || ''} ${t.detalhe || ''} ${t.titulo || ''}`.toLowerCase();
        return t.tipo_operacao === 'D' && (txt.includes('água') || txt.includes('agua') || txt.includes('dmae'));
      };
      setTransactions(data.filter(filtro));
    }
    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Agrupa por mês para o gráfico
  const consumoPorMes = months.map(m => {
    const mesTrans = transactions.filter(t => (t.data_entrada || '').slice(5,7) === m.v);
    return mesTrans.reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);
  });

  const chartData = {
    labels: months.map(m => m.l),
    datasets: [
      {
        label: 'Consumo Água/DMAE (R$)',
        data: consumoPorMes,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permite controlar altura via CSS
    plugins: { 
      legend: { display: false }, 
      title: { display: false } 
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
        }
      } 
    }
  };

  if (embedMode) {
    return (
      <div className="h-64 md:h-80 w-full">
        <Bar
          data={chartData}
          options={chartOptions}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-800 uppercase tracking-tight">Consumo Água / DMAE</h1>
          <p className="text-gray-500 text-xs font-bold uppercase">Análise de gastos com saneamento</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))} 
            className="p-2 rounded-xl border border-blue-100 bg-white font-bold text-xs shadow-sm outline-none cursor-pointer text-blue-800"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
            className="p-2 rounded-xl border border-blue-100 bg-white font-bold text-xs shadow-sm outline-none cursor-pointer text-blue-800"
          >
            <option value="">Ano Inteiro</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
        <div className="h-64 md:h-80 w-full">
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            key={selectedYear + '-' + selectedMonth}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-blue-50">
          <h2 className="text-sm font-black text-blue-900 uppercase">Detalhamento de Lançamentos</h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-400 font-bold animate-pulse">Buscando dados no extrato...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-blue-50/50 text-[10px] text-blue-400 font-black uppercase">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-10 text-center text-gray-400 text-xs uppercase font-bold">Nenhuma conta de água encontrada neste período</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-gray-400 font-bold uppercase text-[10px]">
                        {format(parseISO(t.data_entrada), 'dd MMM yy', { locale: ptBR })}
                      </td>
                      <td className="p-4 uppercase text-[11px] font-bold text-gray-700">
                        {t.descricao}
                      </td>
                      <td className="p-4 text-right font-black text-blue-700">
                        {Math.abs(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}