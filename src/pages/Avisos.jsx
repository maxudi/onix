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
  const { user, isAdmin } = useAuth();
  const [notices, setNotices] = useState(storage.getNotices());

  // Realtime Supabase para avisos
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    // Busca inicial
    const fetchNotices = async () => {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (!error && data) setNotices(data);
    };
    fetchNotices();

    // Canal realtime
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

  // Filtrar avisos
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || notice.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Separar avisos fixados
  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[Avisos] handleSubmit user:', user);
    const newNotice = {
      id: Date.now().toString(),
      ...formData,
      author: user && user.name ? user.name : 'Desconhecido',
      authorId: user && user.id ? user.id : 'anon',
      isPinned: false,
      createdAt: new Date().toISOString()
    };
    if (!user) {
      console.warn('[Avisos] Tentativa de criar aviso sem usuário logado!');
    }
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
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-info'
    };
    return badges[priority] || badges.medium;
  };

  const getPriorityText = (priority) => {
    const texts = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    };
    return texts[priority] || 'Média';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
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

      {/* Pinned Notices */}
      {pinnedNotices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pin className="w-5 h-5 text-primary-600" />
            Avisos Fixados
          </h2>
          <div className="space-y-4">
            {pinnedNotices.map((notice) => {
              const categoryConfig = getCategoryConfig(notice.category);
              const CategoryIcon = categoryConfig.icon;

              return (
                <div
                  key={notice.id}
                  className="card border-2 border-primary-200 bg-primary-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-${categoryConfig.color}-100`}>
                      <CategoryIcon className={`w-6 h-6 text-${categoryConfig.color}-600`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`badge bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800`}>
                              {categoryConfig.label}
                            </span>
                            <span className={getPriorityBadge(notice.priority)}>
                              {getPriorityText(notice.priority)}
                            </span>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePin(notice.id)}
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                              title="Desafixar"
                            >
                              <Pin className="w-5 h-5 fill-current" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 whitespace-pre-line">{notice.content}</p>

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>Por {notice.author}</span>
                        <span>•</span>
                        <span>{format(parseISO(notice.createdAt), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Notices */}
      <div>
        {pinnedNotices.length > 0 && (
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Outros Avisos</h2>
        )}
        
        {regularNotices.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum aviso encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regularNotices.map((notice) => {
              const categoryConfig = getCategoryConfig(notice.category);
              const CategoryIcon = categoryConfig.icon;

              return (
                <div key={notice.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-${categoryConfig.color}-100`}>
                      <CategoryIcon className={`w-6 h-6 text-${categoryConfig.color}-600`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`badge bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800`}>
                              {categoryConfig.label}
                            </span>
                            <span className={getPriorityBadge(notice.priority)}>
                              {getPriorityText(notice.priority)}
                            </span>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePin(notice.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Fixar"
                            >
                              <Pin className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 whitespace-pre-line">{notice.content}</p>

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>Por {notice.author}</span>
                        <span>•</span>
                        <span>{format(parseISO(notice.createdAt), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Novo Aviso</h3>
                <p className="text-sm text-gray-500 mt-1">Publique um comunicado para os moradores</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Manutenção do Elevador"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[150px] resize-none"
                  placeholder="Descreva o aviso em detalhes..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="info">Informação</option>
                    <option value="maintenance">Manutenção</option>
                    <option value="meeting">Assembleia</option>
                    <option value="rules">Regras</option>
                    <option value="general">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
