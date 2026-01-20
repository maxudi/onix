import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
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
  // Extraímos 'loading' para garantir a segurança da renderização
  const { user, isAdmin, loading } = useAuth();
  const [bookings, setBookings] = useState(storage.getBookings() || []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '14:00',
    endTime: '18:00',
    event: '',
    guests: ''
  });

  // Realtime Supabase para reservas
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });
      if (!error && data) setBookings(data);
    };
    fetchBookings();

    const channel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        if (payload) fetchBookings();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- PROTEÇÃO DE CARREGAMENTO ---
  // Impede que o código tente ler 'user.id' enquanto o Supabase autentica no Easypanel
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Carregando calendário de reservas...</p>
      </div>
    );
  }

  // Filtrar reservas - Seguro agora que garantimos a existência do 'user'
  const userBookings = isAdmin ? bookings : bookings.filter(b => b.userId === user.id);
  
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
      isSameDay(parseISO(booking.date), date) && booking.status === 'approved'
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newBooking = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      unit: user.unit || '',
      ...formData,
      status: isAdmin ? 'approved' : 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    storage.setBookings(updatedBookings);
    
    setShowModal(false);
    setFormData({
      date: '',
      startTime: '14:00',
      endTime: '18:00',
      event: '',
      guests: ''
    });
  };

  const handleApprove = (bookingId) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'approved' } : booking
    );
    setBookings(updatedBookings);
    storage.setBookings(updatedBookings);
  };

  const handleReject = (bookingId) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'rejected' } : booking
    );
    setBookings(updatedBookings);
    storage.setBookings(updatedBookings);
  };

  const handleDelete = (bookingId) => {
    if (confirm('Deseja realmente excluir esta reserva?')) {
        const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
        setBookings(updatedBookings);
        storage.setBookings(updatedBookings);
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
          <p className="mt-2 text-gray-600">Agende o salão de festas do condomínio</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-5 h-5" /> Nova Reserva
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-lg">← Anterior</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-lg">Hoje</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-lg">Próximo →</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">{day}</div>
          ))}
          {daysInMonth.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const hasBooking = dayBookings.length > 0;
            const isPastDay = isPast(day) && !isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border rounded-lg transition-all ${!isSameMonth(day, currentMonth) ? 'bg-gray-50 text-gray-400' : ''} ${isToday(day) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} ${hasBooking ? 'bg-green-50 border-green-200' : ''} ${isPastDay ? 'opacity-50' : 'hover:border-primary-300 cursor-pointer'}`}
                onClick={() => !isPastDay && setSelectedDate(day)}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                {hasBooking && <div className="mt-1 text-xs text-green-700 font-medium">{dayBookings.length} reserva(s)</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{isAdmin ? 'Todas as Reservas' : 'Minhas Reservas'}</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" />
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            filteredBookings
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={booking.id} className={`p-4 border-2 rounded-lg ${statusConfig.borderColor}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${statusConfig.bgColor}`}><StatusIcon className={`w-5 h-5 ${statusConfig.color}`} /></div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{booking.event}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> {format(parseISO(booking.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {booking.startTime} - {booking.endTime}</p>
                            <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {booking.guests} convidados</p>
                            {isAdmin && <p className="text-primary-600 font-medium">{booking.userName} - Unidade {booking.unit}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className={`px-3 py-1 text-xs font-medium border rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>{statusConfig.text}</span>
                        {isAdmin && booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(booking.id)} className="btn-secondary text-green-600 border-green-200 py-1 px-2 text-xs">Aprovar</button>
                            <button onClick={() => handleReject(booking.id)} className="btn-secondary text-red-600 border-red-200 py-1 px-2 text-xs">Rejeitar</button>
                          </div>
                        )}
                        <button onClick={() => handleDelete(booking.id)} className="text-xs text-gray-400 hover:text-red-600 underline">Excluir</button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nova Reserva</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" required min={format(new Date(), 'yyyy-MM-dd')} />
              <div className="grid grid-cols-2 gap-4">
                <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="input-field" required />
                <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="input-field" required />
              </div>
              <input type="text" value={formData.event} onChange={e => setFormData({...formData, event: e.target.value})} className="input-field" placeholder="Evento" required />
              <input type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="input-field" placeholder="Convidados" min="1" required />
              <button type="submit" className="w-full btn-primary mt-4">Solicitar Reserva</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}