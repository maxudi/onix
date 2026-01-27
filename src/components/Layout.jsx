import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Calendar, MessageSquare, User, Users,
  LogOut, Building2, ChevronDown, ChevronRight, FileText,
  Wrench, Truck, ShieldCheck, ClipboardList, ArrowDownCircle,
  Bell, Menu, X, ChevronLeft, BarChart3,
  FilePieChart, FolderOpen, Droplets, HardHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
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
      condominos: location.pathname.startsWith('/condominos')
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
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-white border-r transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
          w-72
        `}
      >
        {/* Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 bg-white border rounded-full p-1 shadow"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center gap-3 px-6 py-6 border-b ${isCollapsed && 'lg:justify-center lg:px-0'}`}>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-black tracking-tight">ONIX</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Condomínio Tech
                </p>
              </div>
            )}
          </div>

          {/* NAV */}
          <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
            <MenuLink to="/dashboard" icon={LayoutDashboard} name="Dashboard" isCollapsed={isCollapsed} />

            <Submenu
              name="Financeiro"
              icon={DollarSign}
              isOpen={menusOpen.financeiro}
              isCollapsed={isCollapsed}
              active={location.pathname.startsWith('/financeiro')}
              onClick={() => toggleSubmenu('financeiro')}
            >
              <SubmenuLink to="/financeiro/meus-boletos" name="Meus Boletos" icon={FileText} />
              {isAdmin && (
                <>
                  <SubmenuLink to="/financeiro/boletos" name="Painel Financeiro" icon={BarChart3} />
                  <SubmenuLink to="/financeiro/gerar-boletos" name="Gerar Boletos" icon={DollarSign} />
                </>
              )}
            </Submenu>

            <Submenu
              name="Operacional"
              icon={Wrench}
              isOpen={menusOpen.operacional}
              isCollapsed={isCollapsed}
              active={location.pathname.startsWith('/operacional')}
              onClick={() => toggleSubmenu('operacional')}
            >
              <SubmenuLink to="/operacional/manutencao" name="Manutenção" icon={HardHat} />
              <SubmenuLink to="/operacional/consumo-agua" name="Consumo Água" icon={Droplets} />
              <SubmenuLink to="/operacional/consumo-energia" name="Consumo Energia" icon={BarChart3} />
            </Submenu>

            <MenuLink to="/reservas" icon={Calendar} name="Reservas" isCollapsed={isCollapsed} />

            <Submenu
              name="Comunicação"
              icon={MessageSquare}
              isOpen={menusOpen.comunicacao}
              isCollapsed={isCollapsed}
              active={
                location.pathname.startsWith('/avisos') ||
                location.pathname.startsWith('/comunicacao')
              }
              onClick={() => toggleSubmenu('comunicacao')}
            >
              <SubmenuLink to="/avisos" name="Avisos" icon={Bell} />
              <SubmenuLink to="/comunicacao/documentos" name="Documentos" icon={FolderOpen} />
            </Submenu>

            {isAdmin && (
              <Submenu
                name="Condôminos"
                icon={Users}
                isOpen={menusOpen.condominos}
                isCollapsed={isCollapsed}
                active={location.pathname.startsWith('/condominos')}
                onClick={() => toggleSubmenu('condominos')}
              >
                <SubmenuLink to="/condominos/cadastro" name="Cadastrar" icon={User} />
                <SubmenuLink to="/condominos/admin" name="Administração" icon={ShieldCheck} />
              </Submenu>
            )}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 rounded-xl ${
                isCollapsed && 'lg:justify-center'
              }`}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && 'Sair'}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main
        className={`
          flex-1 min-w-0 transition-all duration-300
          pt-16 lg:pt-0
          ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'}
        `}
      >
        {/* LIMITADOR DE LARGURA */}
        <div className="p-4 lg:p-6 w-full max-w-[1600px]">
          {children}
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
      className={({ isActive }) =>
        `flex items-center rounded-xl transition-all
        ${isCollapsed ? 'lg:justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'}
        ${isActive ? 'bg-primary-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'}`
      }
    >
      <Icon className="w-5 h-5" />
      {!isCollapsed && <span className="font-semibold text-sm">{name}</span>}
    </NavLink>
  );
}

function Submenu({ name, icon: Icon, children, isOpen, isCollapsed, onClick, active }) {
  return (
    <div>
      <button
        onClick={onClick}
        className={`flex items-center rounded-xl w-full transition-all
        ${isCollapsed ? 'lg:justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'}
        ${active ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <Icon className="w-5 h-5" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left font-semibold text-sm">{name}</span>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </>
        )}
      </button>
      {isOpen && !isCollapsed && (
        <div className="ml-9 mt-1 space-y-1 border-l border-gray-100 pl-3">
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
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all
        ${isActive ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`
      }
    >
      <Icon className="w-4 h-4" />
      {name}
    </NavLink>
  );
}
