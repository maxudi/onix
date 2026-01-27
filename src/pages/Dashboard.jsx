import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Bell, AlertCircle, Users, Wallet, Calendar } from 'lucide-react';

// Gráficos
import ConsumoAgua from './ConsumoAgua';
import ConsumoEnergia from './ConsumoEnergia';
import DemaisGastos from './DemaisGastos';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState({ moradores: 0, pendentes: 0, avisos: 0, saldo: 0 });
  const [selectedYear, setSelectedYear] = useState('2026');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;

    const fetchStats = async () => {
      setFetching(true);
      try {
        // 1. Contagens (Moradores, Avisos e Boletos EXPIRADO/ATRASADO)
        const [m, a, b] = await Promise.all([
          supabase.from('moradores').select('*', { count: 'exact', head: true }),
          supabase.from('notices').select('*', { count: 'exact', head: true }),
          supabase.from('cobrancas_inter').select('*', { count: 'exact', head: true })
            .or('situacao.ilike.EXPIRADO,situacao.ilike.ATRASADO')
        ]);

        // 2. Cálculo do Saldo (C = Soma, D = Subtrai)
        const { data: extrato } = await supabase.from('extrato').select('valor, tipo_operacao');
        const saldoCalculado = extrato?.reduce((acc, item) => {
          const v = Math.abs(Number(item.valor)) || 0;
          return item.tipo_operacao === 'C' ? acc + v : acc - v;
        }, 0) || 0;

        setData({
          moradores: m.count || 0,
          avisos: a.count || 0,
          pendentes: b.count || 0,
          saldo: saldoCalculado
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading || fetching) return <div className="p-10 text-center font-bold">Carregando Onix...</div>;

  const cards = [
    { label: 'Moradores', val: data.moradores, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Boletos Pendentes', val: data.pendentes, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Avisos', val: data.avisos, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Saldo em Conta', val: `R$ ${data.saldo.toLocaleString('pt-BR')}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' }
  ];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Cabeçalho e Filtro Global */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 uppercase">Dashboard</h1>
        
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-xl font-black text-gray-900 mt-1">{c.val}</p>
            </div>
            <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}><c.icon className="w-6 h-6" /></div>
          </div>
        ))}
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border min-h-[400px]">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-6">Consumo de Água</h3>
          <ConsumoAgua embedMode selectedYear={selectedYear} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border min-h-[400px]">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-6">Consumo de Energia</h3>
          <ConsumoEnergia embedMode selectedYear={selectedYear} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border min-h-[400px] lg:col-span-2">
          <h3 className="text-xs font-black text-gray-400 uppercase mb-6">Detalhamento Financeiro Geral</h3>
          <DemaisGastos embedMode selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  );
}