import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
import { 
  DollarSign, 
  Calendar, 
  Bell, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const bills = storage.getBills();
  const bookings = storage.getBookings();
  const notices = storage.getNotices();
  const users = storage.getUsers();

  // Filtrar dados do usuário atual ou todos se admin
  const userBills = isAdmin ? bills : bills.filter(b => b.userId === user.id);
  const userBookings = isAdmin ? bookings : bookings.filter(b => b.userId === user.id);

  // Estatísticas
  const pendingBills = userBills.filter(b => b.status === 'pending');
  const overdueBills = userBills.filter(b => b.status === 'overdue');
  const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);

  const upcomingBookings = userBookings.filter(b => {
    const bookingDate = parseISO(b.date);
    return !isPast(bookingDate) && b.status === 'approved';
  });

  const recentNotices = notices
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const stats = isAdmin
    ? [
        {
          name: 'Total de Moradores',
          value: users.filter(u => u.role === 'resident').length,
          icon: Users,
          color: 'blue'
        },
        {
          name: 'Boletos Pendentes',
          value: pendingBills.length + overdueBills.length,
          icon: DollarSign,
          color: 'yellow'
        },
        {
          name: 'Reservas Pendentes',
          value: bookings.filter(b => b.status === 'pending').length,
          icon: Calendar,
          color: 'purple'
        },
        {
          name: 'Avisos Publicados',
          value: notices.length,
          icon: Bell,
          color: 'green'
        }
      ]
    : [
        {
          name: 'Boletos Pendentes',
          value: `R$ ${totalPending.toFixed(2)}`,
          icon: Clock,
          color: 'yellow',
          subtitle: `${pendingBills.length} boleto(s)`
        },
        {
          name: 'Boletos Atrasados',
          value: `R$ ${totalOverdue.toFixed(2)}`,
          icon: AlertCircle,
          color: 'red',
          subtitle: `${overdueBills.length} boleto(s)`
        },
        {
          name: 'Próximas Reservas',
          value: upcomingBookings.length,
          icon: Calendar,
          color: 'blue',
          subtitle: upcomingBookings.length > 0 ? 'agendamento(s)' : 'Nenhuma reserva'
        },
        {
          name: 'Avisos Recentes',
          value: notices.length,
          icon: Bell,
          color: 'green',
          subtitle: 'total de avisos'
        }
      ];

  const getStatusColor = (status) => {
    const colors = {
      paid: 'text-green-600 bg-green-50 border-green-200',
      pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      overdue: 'text-red-600 bg-red-50 border-red-200',
      approved: 'text-green-600 bg-green-50 border-green-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado',
      approved: 'Aprovado',
    };
    return texts[status] || status;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          {isAdmin 
            ? 'Painel de administração do condomínio' 
            : 'Aqui está um resumo das suas informações'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Boletos Recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Boletos Recentes</h2>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          {userBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum boleto encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userBills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{bill.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Vencimento: {format(parseISO(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900">R$ {bill.amount.toFixed(2)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium border rounded ${getStatusColor(bill.status)}`}>
                      {getStatusText(bill.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avisos Recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Avisos Recentes</h2>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>

          {recentNotices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum aviso publicado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{notice.title}</h3>
                    {notice.isPinned && (
                      <span className="text-primary-600">📌</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(parseISO(notice.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas Reservas */}
        {!isAdmin && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Próximas Reservas</h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma reserva agendada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{booking.event}</h3>
                      <span className={`px-2 py-1 text-xs font-medium border rounded ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📅 {format(parseISO(booking.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                      <p>🕐 {booking.startTime} - {booking.endTime}</p>
                      <p>👥 {booking.guests} convidados</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
