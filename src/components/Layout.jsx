import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, DollarSign, Calendar, MessageSquare, User, Users, 
  LogOut, Building2, ChevronDown, ChevronRight, FileText, 
  Wrench, Truck, ShieldCheck, ClipboardList, ArrowDownCircle,
  Smartphone, Bell, Menu, X, Wallet, ChevronLeft, BarChart3, 
  FilePieChart, FolderOpen, Droplets, HardHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Controle de estados dos submenus sincronizado com as rotas
  const [menusOpen, setMenusOpen] = useState({
    financeiro: location.pathname.startsWith('/financeiro'),
    operacional: location.pathname.startsWith('/operacional'),
    comunicacao: location.pathname.startsWith('/avisos') || 
                 location.pathname.startsWith('/documentos') || 
                 location.pathname.startsWith('/comunicacao'),
    banco: location.pathname.startsWith('/banco')
  });

  // Atualiza a expansão do menu ao navegar
  useEffect(() => {
    setMenusOpen(prev => ({
      ...prev,
      financeiro: location.pathname.startsWith('/financeiro'),
      operacional: location.pathname.startsWith('/operacional'),
      comunicacao: location.pathname.startsWith('/avisos') || 
                   location.pathname.startsWith('/documentos') || 
                   location.pathname.startsWith('/comunicacao'),
      banco: location.pathname.startsWith('/banco')
    }));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR DESKTOP RETRÁTIL */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-50 ${isCollapsed ? 'w-24' : 'w-72'}`}>
        
        {/* Botão para Recolher/Expandir */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:text-primary-600 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Logo */}
          <div className={`flex items-center gap-3 px-6 py-8 border-b border-gray-100 ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-primary-600 rounded-xl shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-xl font-black text-gray-900 tracking-tighter">ONIX</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condomínio Tech</p>
              </div>
            )}
          </div>

          {/* Navegação Principal */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
            
            <MenuLink to="/dashboard" icon={LayoutDashboard} name="Dashboard" isCollapsed={isCollapsed} />

            {/* Submenu Financeiro */}
            <Submenu 
              name="Financeiro" 
              icon={DollarSign} 
              isOpen={menusOpen.financeiro} 
              isCollapsed={isCollapsed}
              onClick={() => toggleSubmenu('financeiro')}
              active={location.pathname.startsWith('/financeiro')}
            >
              <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Contas a Receber</div>
              <SubmenuLink to="/financeiro/meus-boletos" name="Meus Boletos" icon={FileText} />
              
              {isAdmin && (
                <>
                  <div className="px-3 py-2 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Gestão Administrativa</div>
                  <SubmenuLink to="/financeiro/pagamentos" name="Boletos a Pagar" icon={ArrowDownCircle} />
                  <SubmenuLink to="/financeiro/fornecedores" name="Fornecedores" icon={Truck} />
                  <SubmenuLink to="/financeiro/prestacao-contas" name="Prestação de Contas" icon={BarChart3} />
                  <SubmenuLink to="/financeiro/balancetes" name="Balancetes" icon={FilePieChart} />
                </>
              )}
            </Submenu>

            {/* Submenu Banco Inter (Admin) */}
            {isAdmin && (
              <Submenu 
                name="Gestão Bancária" 
                icon={Wallet} 
                isOpen={menusOpen.banco} 
                isCollapsed={isCollapsed}
                onClick={() => toggleSubmenu('banco')}
                active={location.pathname.startsWith('/banco')}
              >
                <SubmenuLink to="/banco/extrato" name="Conciliação" icon={ClipboardList} />
                <SubmenuLink to="/banco/pix" name="Gestão de Pix" icon={Smartphone} />
              </Submenu>
            )}

            {/* Submenu Operacional */}
            <Submenu 
              name="Operacional" 
              icon={Wrench} 
              isOpen={menusOpen.operacional} 
              isCollapsed={isCollapsed}
              onClick={() => toggleSubmenu('operacional')}
              active={location.pathname.startsWith('/operacional')}
            >
              <SubmenuLink to="/operacional/manutencao" name="Plano de Manutenção" icon={HardHat} />
              <SubmenuLink to="/operacional/leituras" name="Consumo Água/Gás" icon={Droplets} />
              <SubmenuLink to="/operacional/seguranca" name="Câmeras / DVR" icon={ShieldCheck} />
              <SubmenuLink to="/operacional/ocorrencias" name="Ocorrências" icon={ClipboardList} />
            </Submenu>

            <MenuLink to="/reservas" icon={Calendar} name="Áreas Comuns" isCollapsed={isCollapsed} />

            {/* Submenu Comunicação */}
            <Submenu 
              name="Comunicação" 
              icon={MessageSquare} 
              isOpen={menusOpen.comunicacao} 
              isCollapsed={isCollapsed}
              onClick={() => toggleSubmenu('comunicacao')}
              active={location.pathname.startsWith('/avisos') || location.pathname.startsWith('/documentos')}
            >
              <SubmenuLink to="/avisos" name="Mural de Avisos" icon={Bell} />
              <SubmenuLink to="/comunicacao/documentos" name="Pasta Digital" icon={FolderOpen} />
              <SubmenuLink to="/comunicacao/assembleias" name="Votos e Atas" icon={Users} />
            </Submenu>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <MenuLink to="/perfil" icon={User} name="Meu Perfil" isCollapsed={isCollapsed} />
            </div>

          </nav>

          {/* Botão Sair */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {!isCollapsed && <span>Sair da Conta</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        
        {/* Header Mobile */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden flex items-center justify-between px-4 py-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg"><Building2 className="w-5 h-5 text-white" /></div>
            <h1 className="text-lg font-black text-gray-900 tracking-tighter">ONIX</h1>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function MenuLink({ to, icon: Icon, name, isCollapsed, color = "text-gray-700" }) {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? name : ""}
      className={({ isActive }) =>
        `flex items-center transition-all duration-300 rounded-xl
        ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3 w-full'}
        ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : `${color} hover:bg-gray-100`}`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm">{name}</span>}
    </NavLink>
  );
}

function Submenu({ name, icon: Icon, children, isOpen, isCollapsed, onClick, active }) {
  return (
    <div className="space-y-1">
      <button 
        onClick={onClick}
        title={isCollapsed ? name : ""}
        className={`flex items-center transition-all duration-300 rounded-xl
          ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3 w-full'}
          ${active ? 'text-primary-600 bg-primary-50/50' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm">{name}</span>}
        </div>
        {!isCollapsed && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
      </button>
      {isOpen && !isCollapsed && (
        <div className="ml-9 space-y-1 border-l-2 border-primary-50 pl-2 mt-1 animate-in slide-in-from-top-1">
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
        `flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
          isActive ? 'text-primary-700 bg-primary-100/50' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{name}</span>
    </NavLink>
  );
}