import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { storage } from '../services/storage';
import { 
  DollarSign, 
  Calendar, 
  Bell, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { user, isAdmin, loading } = useAuth();
  
  // Estados para armazenar dados reais do banco
  const [bills, setBills] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notices, setNotices] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [fetching, setFetching] = useState(true);

  // --- BUSCA DE DADOS REAIS DO SUPABASE ---
  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;

    const fetchDashboardData = async () => {
      setFetching(true);
      try {
        // 1. Busca Boletos
        const { data: bData } = await supabase.from('bills').select('*');
        if (bData) setBills(bData);

        // 2. Busca Reservas
        const { data: resData } = await supabase.from('bookings').select('*');
        if (resData) setBookings(resData);

        // 3. Busca Avisos
        const { data: nData } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
        if (nData) setNotices(nData);

        // 4. Busca Usuários (se for Admin)
        if (isAdmin) {
          const { data: uData } = await supabase.from('users').select('*');
          if (uData) setUsersList(uData);
        }
      } catch (err) {
        console.error("Erro ao integrar Dashboard com Supabase:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdmin]);

  // --- PROTEÇÃO DE CARREGAMENTO ---
  if (loading || fetching || !user) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Carregando informações do banco de dados...</p>
      </div>
    );
  }

  // Filtragem Lógica baseada no usuário logado
  const userBills = isAdmin ? bills : bills.filter(b => b.userId === user.id || b.user_id === user.id);
  const userBookings = isAdmin ? bookings : bookings.filter(b => b.userId === user.id || b.user_id === user.id);

  // Estatísticas
  const pendingBills = userBills.filter(b => b.status === 'pending');
  const overdueBills = userBills.filter(b => b.status === 'overdue');
  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + Number(b.amount), 0);

  const upcomingBookings = userBookings.filter(b => {
    const dateStr = b.date || b.booking_date;
    if (!dateStr) return false;
    return !isPast(parseISO(dateStr)) && (b.status === 'approved' || b.status === 'confirmed');
  });

  const recentNotices = [...notices].slice(0, 3);

  const stats = isAdmin
    ? [
        { name: 'Total de Moradores', value: usersList.filter(u => u.role === 'resident').length, icon: Users, color: 'blue' },
        { name: 'Boletos Pendentes', value: pendingBills.length + overdueBills.length, icon: DollarSign, color: 'yellow' },
        { name: 'Reservas Pendentes', value: bookings.filter(b => b.status === 'pending').length, icon: Calendar, color: 'purple' },
        { name: 'Avisos Publicados', value: notices.length, icon: Bell, color: 'green' }
      ]
    : [
        { name: 'Boletos Pendentes', value: `R$ ${totalPending.toFixed(2)}`, icon: Clock, color: 'yellow', subtitle: `${pendingBills.length} boleto(s)` },
        { name: 'Boletos Atrasados', value: `R$ ${totalOverdue.toFixed(2)}`, icon: AlertCircle, color: 'red', subtitle: `${overdueBills.length} boleto(s)` },
        { name: 'Próximas Reservas', value: upcomingBookings.length, icon: Calendar, color: 'blue', subtitle: upcomingBookings.length > 0 ? 'agendamento(s)' : 'Nenhuma reserva' },
        { name: 'Avisos Recentes', value: notices.length, icon: Bell, color: 'green', subtitle: 'total de avisos' }
      ];

  // Mapeamento de cores para evitar problemas no build do Tailwind
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {user.name}!</h1>
        <p className="mt-2 text-gray-600">
          {isAdmin ? 'Painel administrativo conectado ao banco Onix' : 'Resumo das suas informações do condomínio'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Boletos Recentes</h2>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          {userBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum boleto encontrado no banco.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userBills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{bill.description}</p>
                    <p className="text-sm text-gray-500">Vencimento: {bill.due_date ? format(parseISO(bill.due_date), 'dd/MM/yyyy') : 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {Number(bill.amount).toFixed(2)}</p>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-600 border border-yellow-200">{bill.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Últimos Avisos</h2>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>

          {recentNotices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum aviso publicado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900">{notice.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{notice.created_at ? format(parseISO(notice.created_at), "dd/MM/yyyy HH:mm") : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}