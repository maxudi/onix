import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
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
  // Extraímos loading para garantir que não usemos 'user' antes da hora
  const { user, isAdmin, loading } = useAuth();
  const [notices, setNotices] = useState(storage.getNotices() || []);

  // Realtime Supabase para avisos
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    
    const fetchNotices = async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setNotices(data);
    };
    
    fetchNotices();

    const channel = supabase
      .channel('public:notices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, payload => {
        if (payload) fetchNotices();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'info',
    priority: 'medium'
  });

  // --- PROTEÇÃO DE CARREGAMENTO ---
  // Bloqueamos o processamento se o usuário ainda não estiver pronto
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Sincronizando mural de avisos...</p>
      </div>
    );
  }

  // Filtrar avisos - Agora é seguro pois o 'if' acima garantiu a existência de dados
  const filteredNotices = (notices || []).filter(notice => {
    const matchesSearch = 
      notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || notice.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Agora é 100% seguro acessar user.name e user.id
    const newNotice = {
      id: Date.now().toString(),
      ...formData,
      author: user.name || 'Admin',
      authorId: user.id,
      isPinned: false,
      createdAt: new Date().toISOString()
    };

    const updatedNotices = [newNotice, ...notices];
    setNotices(updatedNotices);
    storage.setNotices(updatedNotices);

    setShowModal(false);
    setFormData({
      title: '',
      content: '',
      category: 'info',
      priority: 'medium'
    });
  };

  const handlePin = (noticeId) => {
    const updatedNotices = notices.map(notice =>
      notice.id === noticeId ? { ...notice, isPinned: !notice.isPinned } : notice
    );
    setNotices(updatedNotices);
    storage.setNotices(updatedNotices);
  };

  const handleDelete = (noticeId) => {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      const updatedNotices = notices.filter(notice => notice.id !== noticeId);
      setNotices(updatedNotices);
      storage.setNotices(updatedNotices);
    }
  };

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
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${badges[priority] || badges.medium}`;
  };

  const getPriorityText = (priority) => {
    const texts = { high: 'Alta', medium: 'Média', low: 'Baixa' };
    return texts[priority] || 'Média';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mural de Avisos</h1>
          <p className="mt-2 text-gray-600">Fique por dentro dos comunicados do condomínio</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Novo Aviso
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar avisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="all">Todas Categorias</option>
              <option value="info">Informação</option>
              <option value="maintenance">Manutenção</option>
              <option value="meeting">Assembleia</option>
              <option value="rules">Regras</option>
              <option value="general">Geral</option>
            </select>
          </div>
        </div>
      </div>

      {pinnedNotices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pin className="w-5 h-5 text-primary-600" />
            Avisos Fixados
          </h2>
          <div className="grid gap-4">
            {pinnedNotices.map((notice) => (
               <NoticeCard 
                key={notice.id} 
                notice={notice} 
                isAdmin={isAdmin} 
                onPin={handlePin} 
                onDelete={handleDelete}
                getCategoryConfig={getCategoryConfig}
                getPriorityBadge={getPriorityBadge}
                getPriorityText={getPriorityText}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {pinnedNotices.length > 0 && <h2 className="text-lg font-semibold text-gray-900">Outros Avisos</h2>}
        {regularNotices.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum aviso encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {regularNotices.map((notice) => (
              <NoticeCard 
                key={notice.id} 
                notice={notice} 
                isAdmin={isAdmin} 
                onPin={handlePin} 
                onDelete={handleDelete}
                getCategoryConfig={getCategoryConfig}
                getPriorityBadge={getPriorityBadge}
                getPriorityText={getPriorityText}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Novo Aviso</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Título" 
                className="input-field" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Conteúdo" 
                className="input-field min-h-[150px]" 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="info">Informação</option>
                  <option value="maintenance">Manutenção</option>
                </select>
                <select className="input-field" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary mt-4">Publicar Aviso</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente para manter o código limpo
function NoticeCard({ notice, isAdmin, onPin, onDelete, getCategoryConfig, getPriorityBadge, getPriorityText }) {
  const config = getCategoryConfig(notice.category);
  const Icon = config.icon;

  return (
    <div className={`card hover:shadow-md transition-all ${notice.isPinned ? 'border-l-4 border-primary-600' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${config.color}-100`}>
          <Icon className={`w-6 h-6 text-${config.color}-600`} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => onPin(notice.id)} className="p-1 text-gray-400 hover:text-primary-600"><Pin className={`w-4 h-4 ${notice.isPinned ? 'fill-current text-primary-600' : ''}`} /></button>
                <button onClick={() => onDelete(notice.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <p className="text-gray-700 mt-2 whitespace-pre-line">{notice.content}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
            <span className={getPriorityBadge(notice.priority)}>{getPriorityText(notice.priority)}</span>
            <span>Por {notice.author}</span>
            <span>• {format(parseISO(notice.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}