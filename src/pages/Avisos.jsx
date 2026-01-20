import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// storage removed: all data now from Supabase only
import { 
  Bell, 
  Plus, 
  Pin, 
  Trash2, 
  AlertCircle,
  Info,
  Settings,
  Users,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Avisos() {
  const { user, isAdmin, loading } = useAuth();
  const [notices, setNotices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'info',
    priority: 'medium'
  });

  // --- BUSCA DIRETA NO BANCO (SEM WEBSOCKET) ---
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    
    const fetchNotices = async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setNotices(data);
          // storage removed: notices state only from Supabase
        }
      } catch (err) {
        console.error("Erro ao carregar avisos do Supabase:", err);
      }
    };
    
    fetchNotices();
    // Realtime removido para evitar erros de WebSocket no Easypanel
  }, []);

  // --- GUARDA DE SEGURANÇA ---
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Carregando mural de avisos...</p>
      </div>
    );
  }

  const filteredNotices = (notices || []).filter(notice => {
    const matchesSearch = 
      notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || notice.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newNoticeData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      priority: formData.priority,
      author: user.name || 'Admin',
      author_id: user.id,
      is_pinned: false,
      created_at: new Date().toISOString()
    };

    // Tenta salvar no Supabase primeiro
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase.from('notices').insert([newNoticeData]).select();
      if (!error && data) {
        const updated = [data[0], ...notices];
        setNotices(updated);
      }
    } else {
      // Fallback local se o banco estiver offline
      const localNotice = { id: Date.now().toString(), ...newNoticeData };
      const updated = [localNotice, ...notices];
      setNotices(updated);
    }

    setShowModal(false);
    setFormData({ title: '', content: '', category: 'info', priority: 'medium' });
  };

  const handlePin = async (noticeId) => {
    const notice = notices.find(n => n.id === noticeId);
    const newPinnedStatus = !notice?.isPinned;

    if (isSupabaseEnabled()) {
      await supabase.from('notices').update({ is_pinned: newPinnedStatus }).eq('id', noticeId);
    }

    const updated = notices.map(n => n.id === noticeId ? { ...n, isPinned: newPinnedStatus } : n);
    setNotices(updated);
  };

  const handleDelete = async (noticeId) => {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      if (isSupabaseEnabled()) {
        await supabase.from('notices').delete().eq('id', noticeId);
      }
      const updated = notices.filter(n => n.id !== noticeId);
      setNotices(updated);
    }
  };

  // Funções de estilo mantidas
  const getCategoryConfig = (category) => {
    const configs = {
      info: { icon: Info, label: 'Informação', color: 'blue' },
      maintenance: { icon: Settings, label: 'Manutenção', color: 'yellow' },
      meeting: { icon: Users, label: 'Assembleia', color: 'purple' },
      rules: { icon: AlertCircle, label: 'Regras', color: 'red' },
      general: { icon: Bell, label: 'Geral', color: 'gray' }
    };
    return configs[category] || configs.info;
  };

  const getPriorityBadge = (priority) => {
    const badges = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-blue-100 text-blue-800' };
    return `px-2 py-0.5 rounded text-xs font-medium ${badges[priority] || badges.medium}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mural de Avisos</h1>
          <p className="mt-2 text-gray-600">Comunicados para os moradores</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <Plus className="w-5 h-5" /> Novo Aviso
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar avisos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" />
        </div>
      </div>

      {/* Listas */}
      <div className="space-y-6">
        {pinnedNotices.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Pin className="w-5 h-5 text-primary-600" /> Fixados</h2>
            {pinnedNotices.map(n => <NoticeCard key={n.id} notice={n} isAdmin={isAdmin} onPin={handlePin} onDelete={handleDelete} getCategoryConfig={getCategoryConfig} getPriorityBadge={getPriorityBadge} />)}
          </div>
        )}

        <div className="space-y-4">
          {regularNotices.length === 0 && pinnedNotices.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">Nenhum aviso encontrado.</div>
          ) : (
            regularNotices.map(n => <NoticeCard key={n.id} notice={n} isAdmin={isAdmin} onPin={handlePin} onDelete={handleDelete} getCategoryConfig={getCategoryConfig} getPriorityBadge={getPriorityBadge} />)
          )}
        </div>
      </div>

      {/* Modal Simplificado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Novo Aviso</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="input-field" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea className="input-field min-h-[100px]" placeholder="Conteúdo" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NoticeCard({ notice, isAdmin, onPin, onDelete, getCategoryConfig, getPriorityBadge }) {
  const config = getCategoryConfig(notice.category);
  const Icon = config.icon;
  const createdAt = notice.created_at || notice.createdAt; // Suporta os dois padrões de nome

  return (
    <div className={`card hover:shadow-md transition-all ${notice.is_pinned || notice.isPinned ? 'border-l-4 border-primary-600' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${config.color}-100`}><Icon className={`w-6 h-6 text-${config.color}-600`} /></div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="text-lg font-bold">{notice.title}</h3>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => onPin(notice.id)} className="p-1 text-gray-400 hover:text-primary-600"><Pin className="w-4 h-4" /></button>
                <button onClick={() => onDelete(notice.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <p className="text-gray-700 mt-2 whitespace-pre-line">{notice.content}</p>
          <div className="mt-4 text-xs text-gray-500">
            <span className={getPriorityBadge(notice.priority)}>{notice.priority}</span>
            <span className="ml-3">Por {notice.author} • {createdAt ? format(parseISO(createdAt), "dd/MM/yyyy", { locale: ptBR }) : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}