import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  User, 
  Users, 
  LogOut,
  Building2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false); // Estado para o submenu
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mantém o submenu aberto se o usuário estiver em uma rota de financeiro
  useEffect(() => {
    if (location.pathname.startsWith('/financeiro')) {
      setFinanceiroOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- GUARDA DE CARREGAMENTO ---
  // Impede que o Layout tente ler user.name enquanto o Auth ainda está carregando
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Onix</h1>
              <p className="text-xs text-gray-500">Condomínio</p>
            </div>
          </div>

          {/* Perfil do Usuário na Sidebar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full border border-primary-200">
                <span className="text-sm font-bold text-primary-600">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-tight">
                  {isAdmin ? 'Administrador' : `Unidade ${user?.unit || 'S/N'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <MenuLink to="/dashboard" icon={LayoutDashboard} name="Dashboard" />
            
            {/* Item com Submenu: Financeiro */}
            <div className="space-y-1">
              <button 
                onClick={() => setFinanceiroOpen(!financeiroOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname.startsWith('/financeiro') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5" />
                  <span>Financeiro</span>
                </div>
                {financeiroOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Conteúdo do Submenu */}
              {financeiroOpen && (
                <div className="ml-9 space-y-1">
                  <NavLink
                    to="/financeiro/boletos"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive ? 'text-primary-600 bg-primary-50/50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <FileText className="w-4 h-4" />
                    Boletos
                  </NavLink>
                </div>
              )}
            </div>

            <MenuLink to="/reservas" icon={Calendar} name="Reservas" />
            <MenuLink to="/avisos" icon={MessageSquare} name="Avisos" />
            <MenuLink to="/perfil" icon={User} name="Perfil" />
            
            {isAdmin && (
              <MenuLink to="/admin" icon={Users} name="Administração" color="text-red-600" />
            )}
          </nav>

          {/* Botão Sair */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* Versão Mobile (Ajustada para o novo padrão) */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              <h1 className="text-lg font-bold text-gray-900">Onix</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay (Omitida para brevidade, mas você deve manter a lógica de transição que já tinha) */}
    </div>
  );
}

// Subcomponente para evitar repetição de código no menu
function MenuLink({ to, icon: Icon, name, color = "text-gray-700" }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-primary-50 text-primary-700' : `${color} hover:bg-gray-50`
        }`
      }
    >
      <Icon className="w-5 h-5" />
      {name}
    </NavLink>
  );
}