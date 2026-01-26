import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  Loader2,
  Users
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    start_time: '14:00',
    end_time: '18:00',
    event: '',
    guests: '', // Será tratado como número no envio
    residentName: '' 
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, residentName: user.name || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Erro ao buscar reservas:", err);
    } finally {
      setIsFetching(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-black text-[10px] tracking-widest uppercase">Sincronizando Sistema...</p>
      </div>
    );
  }

  const userBookings = isAdmin ? bookings : bookings.filter(b => b.user_id === user.id);
  
  const filteredBookings = userBookings.filter(booking => 
    (booking.event || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.user_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => 
      booking.date && isSameDay(parseISO(booking.date), date) && 
      (booking.status === 'approved' || booking.status === 'confirmed')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // CORREÇÃO: Garante que 'guests' seja um número inteiro para o banco
    const guestsValue = formData.guests ? parseInt(formData.guests, 10) : 0;

    const newBookingData = {
      user_id: user.id,
      user_name: isAdmin ? (formData.residentName || "").toUpperCase() : (user.name || "").toUpperCase(),
      unit: user.unit || '',
      event: (formData.event || "").toUpperCase(),
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      guests: guestsValue, 
      status: isAdmin ? 'approved' : 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('bookings').insert([newBookingData]).select();
      
      if (error) throw error;

      if (data) {
        setBookings(prev => [...prev, data[0]]);
        setShowModal(false);
        setFormData({ 
          date: '', 
          start_time: '14:00', 
          end_time: '18:00', 
          event: '', 
          guests: '', 
          residentName: user.name || '' 
        });
      }
    } catch (err) {
      alert(`Erro no Banco: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Deseja excluir permanentemente este agendamento?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      approved: { icon: CheckCircle, text: 'Aprovado', color: 'text-green-600', bgColor: 'bg-green-50' },
      pending: { icon: Clock, text: 'Pendente', color: 'text-amber-600', bgColor: 'bg-amber-50' },
      rejected: { icon: XCircle, text: 'Rejeitado', color: 'text-red-600', bgColor: 'bg-red-50' }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="p-4 space-y-6 font-sans uppercase tracking-tighter">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">RESERVAS DO SALÃO</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Condomínio Onix</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs flex items-center gap-2 transition-all shadow-xl shadow-indigo-100"
        >
          <Plus size={18} /> NOVA SOLICITAÇÃO
        </button>
      </div>

      {/* CALENDÁRIO PREMIUM */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-sm font-black text-slate-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="px-4 py-2 bg-slate-50 text-[10px] font-black rounded-xl hover:bg-slate-100 uppercase transition-colors">Anterior</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 bg-slate-100 text-[10px] font-black rounded-xl uppercase">Hoje</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-4 py-2 bg-slate-50 text-[10px] font-black rounded-xl hover:bg-slate-100 uppercase transition-colors">Próximo</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[9px] font-black text-slate-300 pb-2 uppercase tracking-[0.2em]">{day}</div>
          ))}
          {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map((day, i) => {
            const dayBookings = getBookingsForDate(day);
            const isPastDay = isPast(day) && !isToday(day);
            return (
              <div
                key={i}
                onClick={() => !isPastDay && (setFormData(prev => ({...prev, date: format(day, 'yyyy-MM-dd')})), setShowModal(true))}
                className={`min-h-[70px] sm:min-h-[90px] p-2 border rounded-[1.5rem] transition-all relative ${!isSameMonth(day, currentMonth) ? 'opacity-20' : 'bg-white'} ${isToday(day) ? 'border-indigo-500 bg-indigo-50/20 shadow-inner' : 'border-slate-50'} ${dayBookings.length > 0 ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 cursor-pointer'}`}
              >
                <span className={`text-[10px] font-black ${isToday(day) ? 'text-indigo-600' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                {dayBookings.length > 0 && (
                  <div className="mt-1 text-[7px] font-black text-green-700 leading-tight truncate uppercase">
                    {dayBookings[0].event}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID DE CARDS CORRIGIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-300 font-black text-[10px] tracking-[0.4em] uppercase">Nenhum Registro no Período</div>
        ) : (
          filteredBookings.map((booking) => {
            const config = getStatusConfig(booking.status);
            return (
              <div key={booking.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 shrink-0 rounded-[1.25rem] flex items-center justify-center shadow-inner ${config.bgColor} ${config.color}`}>
                  <config.icon size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate">
                      <h3 className="text-xs font-black text-slate-800 uppercase truncate pr-2">{booking.event}</h3>
                      <p className="text-[9px] font-bold text-indigo-600 mt-1 truncate uppercase">
                        {booking.user_name || "MORADOR"} • UNID {booking.unit || "--"}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(booking.id)} className="text-slate-100 group-hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg"><CalendarIcon size={12} /> {booking.date ? format(parseISO(booking.date), "dd/MM/yyyy") : "--"}</span>
                    <span className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg"><Clock size={12} /> {booking.start_time} - {booking.end_time}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
            <h3 className="text-xl font-black mb-8 text-slate-800 text-center uppercase tracking-tighter">Dados da Reserva</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Responsável</label>
                <input 
                  type="text" 
                  value={formData.residentName} 
                  onChange={e => setFormData(prev => ({...prev, residentName: e.target.value}))} 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs focus:ring-2 focus:ring-indigo-500" 
                  required 
                  readOnly={!isAdmin} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Data do Evento</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData(prev => ({...prev, date: e.target.value}))} 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-indigo-500" 
                  required 
                  min={format(new Date(), 'yyyy-MM-dd')} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Horário Início</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData(prev => ({...prev, start_time: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Horário Fim</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData(prev => ({...prev, end_time: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Convidados</label>
                  <input 
                    type="number" 
                    value={formData.guests} 
                    onChange={e => setFormData(prev => ({...prev, guests: e.target.value}))} 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" 
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="col-span-1">
                   <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase tracking-widest">Tipo</label>
                   <input type="text" value={formData.event} onChange={e => setFormData(prev => ({...prev, event: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs" placeholder="EX: FESTA" required />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "RESERVAR AGORA"}
              </button>
              
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-[10px] text-slate-300 font-black uppercase tracking-widest hover:text-slate-500 transition-colors">Voltar para o calendário</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}