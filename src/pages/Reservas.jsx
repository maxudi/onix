import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// storage removed: all data now from Supabase only
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reservas() {
  const { user, isAdmin, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '14:00',
    endTime: '18:00',
    event: '',
    guests: ''
  });

  // --- BUSCA DIRETA NO BANCO (SEM REALTIME/WEBSOCKET) ---
  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;

    const fetchBookings = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('date', { ascending: true });
        
        if (!error && data) {
          setBookings(data);
          // storage removed: bookings state only from Supabase
        }
      } catch (err) {
        console.error("Erro ao buscar reservas no Supabase:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchBookings();
    // Realtime removido para evitar erros de WSS no Easypanel
  }, [user]);

  // --- PROTEÇÃO DE CARREGAMENTO ---
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Sincronizando calendário de reservas...</p>
      </div>
    );
  }

  // Filtragem segura (suporta userId local ou user_id do banco)
  const userBookings = isAdmin ? bookings : bookings.filter(b => (b.userId === user.id || b.user_id === user.id));
  
  const filteredBookings = userBookings.filter(booking => 
    booking.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica do Calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => 
      isSameDay(parseISO(booking.date), date) && (booking.status === 'approved' || booking.status === 'confirmed')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newBookingData = {
      user_id: user.id,
      userName: user.name,
      unit: user.unit || '',
      event: formData.event,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      guests: formData.guests,
      status: isAdmin ? 'approved' : 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase.from('bookings').insert([newBookingData]).select();
      if (!error && data) {
        const updated = [...bookings, data[0]];
        setBookings(updated);
      }
    } else {
      const updated = [...bookings, { id: Date.now().toString(), ...newBookingData }];
      setBookings(updated);
    }
    
    setShowModal(false);
    setFormData({ date: '', startTime: '14:00', endTime: '18:00', event: '', guests: '' });
  };

  const updateStatus = async (id, status) => {
    if (isSupabaseEnabled()) {
      await supabase.from('bookings').update({ status }).eq('id', id);
    }
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    setBookings(updated);
    // storage removed: bookings state only from Supabase
  };

  const handleDelete = async (bookingId) => {
    if (confirm('Deseja realmente excluir esta reserva?')) {
        if (isSupabaseEnabled()) {
          await supabase.from('bookings').delete().eq('id', bookingId);
        }
        const updated = bookings.filter(b => b.id !== bookingId);
        setBookings(updated);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      approved: { icon: CheckCircle, text: 'Aprovado', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
      pending: { icon: Clock, text: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
      rejected: { icon: XCircle, text: 'Rejeitado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas do Salão</h1>
          <p className="mt-2 text-gray-600">Agende o salão de festas do condomínio Onix</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-5 h-5" /> Nova Reserva
        </button>
      </div>

      {/* Calendário */}
      <div className="card shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="btn-secondary py-1 px-3 text-xs">Anterior</button>
            <button onClick={() => setCurrentMonth(new Date())} className="btn-secondary py-1 px-3 text-xs">Hoje</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-secondary py-1 px-3 text-xs">Próximo</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-wider">{day}</div>
          ))}
          {daysInMonth.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const hasBooking = dayBookings.length > 0;
            const isPastDay = isPast(day) && !isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border rounded-lg transition-all ${!isSameMonth(day, currentMonth) ? 'bg-gray-50 text-gray-300' : 'bg-white'} ${isToday(day) ? 'ring-2 ring-primary-500' : 'border-gray-100'} ${hasBooking ? 'bg-green-50/50 border-green-200' : ''} ${isPastDay ? 'opacity-40' : 'hover:border-primary-300 cursor-pointer'}`}
                onClick={() => !isPastDay && (setFormData({...formData, date: format(day, 'yyyy-MM-dd')}), setShowModal(true))}
              >
                <div className="text-sm font-semibold">{format(day, 'd')}</div>
                {hasBooking && <div className="mt-1 text-[10px] text-green-700 font-bold leading-tight">{dayBookings[0].event}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="card shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isAdmin ? 'Todas as Reservas' : 'Minhas Reservas'}</h2>
          {isFetching && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>}
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma reserva agendada.</div>
          ) : (
            filteredBookings
              .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
              .map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={booking.id} className={`p-4 border-2 rounded-lg ${statusConfig.borderColor} hover:shadow-md transition-shadow`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${statusConfig.bgColor}`}><StatusIcon className={`w-5 h-5 ${statusConfig.color}`} /></div>
                        <div>
                          <h3 className="font-bold text-gray-900">{booking.event}</h3>
                          <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                            <p className="flex items-center gap-2"><CalendarIcon className="w-3 h-3" /> {format(parseISO(booking.date), "dd/MM/yyyy")}</p>
                            <p className="flex items-center gap-2"><Clock className="w-3 h-3" /> {booking.startTime} - {booking.endTime}</p>
                            {isAdmin && <p className="text-primary-600 font-bold uppercase tracking-tighter">{booking.userName} • Unidade {booking.unit}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}>{statusConfig.text}</span>
                        {isAdmin && booking.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => updateStatus(booking.id, 'approved')} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">APROVAR</button>
                            <button onClick={() => updateStatus(booking.id, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold">REJEITAR</button>
                          </div>
                        )}
                        <button onClick={() => handleDelete(booking.id)} className="text-[10px] text-gray-400 hover:text-red-600 font-bold uppercase">Excluir</button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Nova Solicitação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" required min={format(new Date(), 'yyyy-MM-dd')} />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="input-field" required />
                <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="input-field" required />
              </div>
              <input type="text" value={formData.event} onChange={e => setFormData({...formData, event: e.target.value})} className="input-field" placeholder="Nome do Evento" required />
              <input type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="input-field" placeholder="Total de Convidados" min="1" required />
              <button type="submit" className="w-full btn-primary py-3 font-bold">ENVIAR SOLICITAÇÃO</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-xs text-gray-400 font-bold uppercase mt-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}