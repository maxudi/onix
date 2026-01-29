import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Calendar, MessageSquare, User, Users,
  LogOut, Building2, ChevronDown, ChevronRight, FileText,
  Wrench, Truck, ShieldCheck, ClipboardList, ArrowDownCircle,
  Bell, Menu, X, ChevronLeft, BarChart3,
  FilePieChart, FolderOpen, Droplets, HardHat,
  PlugZap2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [menusOpen, setMenusOpen] = useState({
    financeiro: false,
    operacional: false,
    comunicacao: false,
    condominos: false
  });

  useEffect(() => {
    setMenusOpen({
      financeiro: location.pathname.startsWith('/financeiro'),
      operacional: location.pathname.startsWith('/operacional'),
      comunicacao:
        location.pathname.startsWith('/avisos') ||
        location.pathname.startsWith('/comunicacao'),
      condominos: 
        location.pathname.startsWith('/condominos') || 
        location.pathname.startsWith('/perfil')
    });
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSubmenu = (menu) => {
    if (isCollapsed) setIsCollapsed(false);
    setMenusOpen(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
      {/* HEADER MOBILE */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight">ONIX</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full z-50 bg-white border-r transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-24' : 'lg:w-72'} w-72`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex absolute -right-3 top-10 bg-white border rounded-full p-1 shadow z-[60]">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex flex-col h-full">
          <div className={`flex items-center gap-3 px-6 py-6 border-b ${isCollapsed && 'lg:justify-center lg:px-0'}`}>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-lg font-black tracking-tight">ONIX</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condomínio Tech</p>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
            <MenuLink to="/dashboard" icon={LayoutDashboard} name="Dashboard" isCollapsed={isCollapsed} />

            <Submenu name="Financeiro" icon={DollarSign} isOpen={menusOpen.financeiro} isCollapsed={isCollapsed} active={location.pathname.startsWith('/financeiro')} onClick={() => toggleSubmenu('financeiro')}>
              <SubmenuLink to="/financeiro/meus-boletos" name="Meus Boletos" icon={FileText} />
              {isAdmin && (
                <>
                  <SubmenuLink to="/financeiro/boletos" name="Painel Financeiro" icon={BarChart3} />
                  <SubmenuLink to="/financeiro/gerar-boletos" name="Gerar Boletos" icon={DollarSign} />
                  <SubmenuLink to="/financeiro/boletos-a-pagar" name="Cadatrar Pagamentos" icon={ArrowDownCircle} />
                  <SubmenuLink to="/financeiro/prestacao-contas" name="Prestação de Contas" icon={FilePieChart} />
                  <SubmenuLink to="/financeiro/balancete-mensal" name="Balancete Mensal" icon={ClipboardList} />
                </>
              )}
            </Submenu>

            <Submenu name="Operacional" icon={Wrench} isOpen={menusOpen.operacional} isCollapsed={isCollapsed} active={location.pathname.startsWith('/operacional')} onClick={() => toggleSubmenu('operacional')}>
              <SubmenuLink to="/operacional/manutencao" name="Manutenção" icon={HardHat} />
              <SubmenuLink to="/operacional/consumo-agua" name="Consumo Água" icon={Droplets} />
              <SubmenuLink to="/operacional/consumo-energia" name="Consumo Energia" icon={PlugZap2} />
              <SubmenuLink to="/operacional/demais-gastos" name="Demais Gastos" icon={DollarSign} />
              <SubmenuLink to="/operacional/seguranca" name="Câmeras / DVR" icon={ShieldCheck} />
              <SubmenuLink to="/operacional/servicos" name="Serviços" icon={Truck} />
              <SubmenuLink to="/operacional/ocorrencias" name="Ocorrências" icon={ClipboardList} />
            </Submenu>

            <MenuLink to="/reservas" icon={Calendar} name="Reservas Salão" isCollapsed={isCollapsed} />

            <Submenu name="Comunicação" icon={MessageSquare} isOpen={menusOpen.comunicacao} isCollapsed={isCollapsed} active={location.pathname.startsWith('/avisos') || location.pathname.startsWith('/comunicacao')} onClick={() => toggleSubmenu('comunicacao')}>
              <SubmenuLink to="/avisos" name="Avisos" icon={Bell} />
              <SubmenuLink to="/comunicacao/documentos" name="Documentos" icon={FolderOpen} />
            </Submenu>

            {/* SUBMENU CONDÔMINOS - CORRIGIDO PARA AS ROTAS DO MAIN.JSX */}
            <Submenu name="Perfil e Cadastro" icon={Users} isOpen={menusOpen.condominos} isCollapsed={isCollapsed} active={location.pathname.startsWith('/condominos') || location.pathname.startsWith('/perfil')} onClick={() => toggleSubmenu('condominos')}>
              <SubmenuLink to="/perfil" name="Meu Perfil" icon={User} />
              
              {isAdmin && <SubmenuLink to="/condominos/cadastro" name="Cadastrar Novo" icon={Users} />}
              {isAdmin && <SubmenuLink to="/condominos/admin" name="Administração" icon={ShieldCheck} />}
            </Submenu>
          </nav>

          <div className="p-4 border-t">
            <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 rounded-xl transition-colors ${isCollapsed && 'lg:justify-center'}`}>
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Sair do Sistema</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className={`flex-1 min-w-0 transition-all duration-300 pt-16 lg:pt-0 ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <div className="p-4 lg:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* COMPONENTES AUXILIARES */

function MenuLink({ to, icon: Icon, name, isCollapsed }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex items-center rounded-xl transition-all ${isCollapsed ? 'lg:justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'} ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span className="font-bold text-sm truncate">{name}</span>}
    </NavLink>
  );
}

function Submenu({ name, icon: Icon, children, isOpen, isCollapsed, onClick, active }) {
  return (
    <div className="space-y-1">
      <button 
        onClick={onClick} 
        className={`flex items-center rounded-xl w-full transition-all ${isCollapsed ? 'lg:justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'} ${active ? 'text-primary-700 bg-primary-50/50' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left font-bold text-sm truncate">{name}</span>
            {isOpen ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
          </>
        )}
      </button>
      {isOpen && !isCollapsed && (
        <div className="ml-6 pl-4 border-l-2 border-gray-100 space-y-1 animate-in slide-in-from-left-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function SubmenuLink({ to, name, icon: Icon }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg transition-all ${isActive ? 'bg-primary-100 text-primary-700 font-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </NavLink>
  );
}