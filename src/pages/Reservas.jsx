import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Plus,
  XCircle,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reservas() {
  const { user, isAdmin, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConflict, setModalConflict] = useState(false); 
  const [modalDelete, setModalDelete] = useState({ open: false, bookingId: null });

  const [formData, setFormData] = useState({
    date: '',
    start_time: '14:00',
    end_time: '18:00',
    event: '',
    guests: '1',
    residentName: '' 
  });

  useEffect(() => {
    if (user) setFormData(prev => ({ ...prev, residentName: user.name || '' }));
  }, [user]);

  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Erro ao buscar:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.event || parseInt(formData.guests) <= 0) {
        return alert("Preencha todos os campos obrigatórios.");
    }

    setIsSubmitting(true);
    const exists = bookings.some(b => b.date === formData.date && (b.status === 'approved' || b.status === 'confirmed'));

    if (exists) {
      setModalConflict(true);
      setIsSubmitting(false);
      return;
    }

    const newBookingData = {
      user_id: user.id,
      user_name: isAdmin ? (formData.residentName || "").toUpperCase() : (user.name || "").toUpperCase(),
      unit: user.unit || '',
      event: (formData.event || "").toUpperCase(),
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      guests: parseInt(formData.guests, 10),
      status: isAdmin ? 'approved' : 'pending'
    };

    try {
      const { data, error } = await supabase.from('bookings').insert([newBookingData]).select();
      if (error) throw error;
      setBookings(prev => [...prev, data[0]]);
      setShowModal(false);
      setFormData({ ...formData, date: '', event: '', guests: '1' });
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!modalDelete.bookingId) return;

    try {
      // 1. Tenta deletar no Supabase
      const { error, status } = await supabase
        .from('bookings')
        .delete()
        .eq('id', modalDelete.bookingId);

      // Se o status for 403 ou 401, é erro de permissão (RLS)
      if (error) {
        console.error("Erro detalhado do banco:", error);
        alert(`Erro ao excluir: ${error.message} (Código: ${error.code})`);
        return;
      }

      // 2. Se chegou aqui, deu certo no banco. Agora remove da tela.
      setBookings(prev => prev.filter(b => b.id !== modalDelete.bookingId));
      setModalDelete({ open: false, bookingId: null });
      
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getBookingsForDate = (date) => {
    const d = format(date, 'yyyy-MM-dd');
    return bookings.filter(b => b.date === d && b.status !== 'rejected');
  };

  if (loading || !user) return <div className="p-20 text-center font-black">CARREGANDO...</div>;

  return (
    <div className="p-4 space-y-6 font-sans uppercase tracking-tighter">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 text-left">RESERVAS DO SALÃO</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest text-left">Condomínio Onix</p>
        </div>
        <button 
          onClick={() => { setFormData({...formData, date: ''}); setShowModal(true); }} 
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-2"
        >
          <Plus size={18} /> NOVA SOLICITAÇÃO
        </button>
      </div>

      {/* CALENDÁRIO */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-sm font-black text-slate-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-full"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-400 py-2">{day}</div>
          ))}
          {days.map(day => {
            const dayBookings = getBookingsForDate(day);
            return (
              <div 
                key={day.toString()} 
                onClick={() => { setFormData({...formData, date: format(day, 'yyyy-MM-dd')}); setShowModal(true); }}
                className={`min-h-[100px] p-2 rounded-2xl border cursor-pointer transition-all flex flex-col items-center ${
                  isToday(day) ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className={`text-base font-black mb-1 ${!isSameMonth(day, currentMonth) ? 'text-slate-200' : 'text-slate-800'}`}>
                  {format(day, 'd')}
                </span>
                {dayBookings.map(b => (
                  <div key={b.id} className="w-full px-1 py-1 bg-indigo-600 rounded-lg text-[7px] text-white font-black truncate text-center mb-0.5">
                    {b.event}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* LISTA DE RESERVAS (Onde a lixeira está) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 tracking-widest px-2 text-left">MEUS AGENDAMENTOS</h3>
        <div className="grid gap-3">
            {bookings.filter(b => isAdmin || b.user_id === user.id).map(booking => (
                <div key={booking.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col items-start">
                        <p className="text-xs font-black text-slate-800">{booking.event}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                            {format(parseISO(booking.date), "dd 'DE' MMMM", { locale: ptBR })} • {booking.start_time}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black px-3 py-1 rounded-full bg-slate-50 text-slate-500">
                            {booking.status === 'approved' ? 'APROVADO' : 'PENDENTE'}
                        </span>
                        <button 
                            onClick={() => setModalDelete({ open: true, bookingId: booking.id })}
                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[3.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black mb-6 text-slate-800 text-center uppercase tracking-tighter">Dados da Reserva</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase">Responsável *</label>
                <input type="text" value={formData.residentName} readOnly className="w-full p-4 bg-slate-50 rounded-2xl font-bold uppercase text-xs" />
              </div>
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase">Data do Evento *</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase">Início *</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase">Convidados *</label>
                  <input type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" required min="1" />
                </div>
              </div>
              <div className="text-left">
                 <label className="text-[10px] font-black text-slate-400 ml-3 mb-1 block uppercase">Tipo de Evento *</label>
                 <input type="text" value={formData.event} onChange={e => setFormData({...formData, event: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold uppercase text-xs" placeholder="EX: ANIVERSÁRIO" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs tracking-widest mt-4">
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "RESERVAR AGORA"}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-[10px] text-slate-300 font-black uppercase text-center mt-2">Voltar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DELETE */}
      {modalDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <Trash2 className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="font-black text-slate-800 mb-2 uppercase">Excluir reserva?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
                <button onClick={() => setModalDelete({ open: false, bookingId: null })} className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase">Não</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}