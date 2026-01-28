import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);// ... (Imports iguais)
export default function DemaisGastos({ embedMode }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState('movel');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const years = useMemo(() => Array.from({ length: currentYear - 2022 + 1 }, (_, i) => 2022 + i), [currentYear]);

  const periodos = useMemo(() => {
    if (selectedYear === 'movel') {
      return Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), 11 - i);
        return { label: format(d, 'MMM/yy', { locale: ptBR }), busca: format(d, 'yyyy-MM'), ref: d };
      });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(selectedYear, i, 1);
      return { label: format(d, 'MMM', { locale: ptBR }), busca: format(d, 'yyyy-MM'), ref: d };
    });
  }, [selectedYear]);

  const fetchData = useCallback(async () => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    const startDate = startOfMonth(periodos[0].ref).toISOString().split('T')[0];
    const endDate = endOfMonth(periodos[11].ref).toISOString().split('T')[0];

    const { data, error } = await supabase.from('extrato').select('*').gte('data_entrada', startDate).lte('data_entrada', endDate);
    if (!error && data) {
      setTransactions(data.filter(t => {
        const txt = `${t.descricao || ''} ${t.detalhe || ''} ${t.titulo || ''}`.toLowerCase();
        const isEnergia = txt.includes('energia') || txt.includes('cemig') || txt.includes('3004884');
        const isAgua = txt.includes('agua') || txt.includes('água') || txt.includes('dmae');
        return t.tipo_operacao === 'D' && !isEnergia && !isAgua;
      }));
    }
    setLoading(false);
  }, [periodos]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = {
    labels: periodos.map(p => p.label),
    datasets: [{
      label: 'Outros Gastos (R$)',
      data: periodos.map(p => transactions.filter(t => (t.data_entrada || '').startsWith(p.busca)).reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0)),
      backgroundColor: 'rgba(71, 85, 105, 0.7)',
      borderRadius: 8,
    }]
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-slate-800 uppercase italic">Demais Gastos</h1>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'movel' ? 'movel' : Number(e.target.value))} className="p-2 rounded-xl border bg-white font-bold text-xs uppercase shadow-sm">
          <option value="movel">Últimos 12 Meses</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 h-80">
        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
}