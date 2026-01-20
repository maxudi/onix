import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, DollarSign, Calendar, MessageSquare, User, Users, 
  LogOut, Building2, ChevronDown, ChevronRight, FileText, 
  Wrench, Truck, ShieldCheck, ClipboardList, ArrowDownCircle,
  Smartphone, Bell, Menu, X, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Controle de estados dos submenus - Sincronizado com as rotas do main.jsx
  const [menusOpen, setMenusOpen] = useState({
    financeiro: location.pathname.startsWith('/financeiro'),
    operacional: location.pathname.startsWith('/operacional'),
    comunicacao: location.pathname.startsWith('/avisos') || 
                 location.pathname.startsWith('/documentos') || 
                 location.pathname.startsWith('/comunicacao'),
    banco: location.pathname.startsWith('/banco')
  });

  // Atualiza o estado dos menus se a navegação ocorrer externamente
  useEffect(() => {
    setMenusOpen({
      financeiro: location.pathname.startsWith('/financeiro'),
      operacional: location.pathname.startsWith('/operacional'),
      comunicacao: location.pathname.startsWith('/avisos') || 
                   location.pathname.startsWith('/documentos') || 
                   location.pathname.startsWith('/comunicacao'),
      banco: location.pathname.startsWith('/banco')
    });
  }, [location.pathname]);

  const toggleSubmenu = (menu) => {
    setMenusOpen(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Proteção de carregamento do usuário para evitar erros de undefined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col flex-1">
          
          {/* Logo Onix */}
          <div className="flex items-center gap-3 px-6 py-8 border-b border-gray-100">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-xl shadow-md shadow-primary-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tighter">ONIX</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condomínio Tech</p>
            </div>
          </div>

          {/* Perfil Rápido */}
          <div className="px-6 py-6 bg-gray-50/30 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-sm font-bold text-primary-700">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Maximiano'}</p>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter">
                  {isAdmin ? 'Síndico / Admin' : `Unidade ${user?.unit || 'S/N'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
            
            <MenuLink to="/dashboard" icon={LayoutDashboard} name="Dashboard" />

            {/* Submenu Financeiro */}
            <Submenu 
              name="Financeiro" 
              icon={DollarSign} 
              isOpen={menusOpen.financeiro} 
              onClick={() => toggleSubmenu('financeiro')}
              active={location.pathname.startsWith('/financeiro')}
            >
              <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Contas a Receber</div>
              <SubmenuLink to="/financeiro/meus-boletos" name="Meus Boletos / 2ª Via" icon={FileText} />
              
              {isAdmin && (
                <>
                  <div className="px-3 py-2 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Contas a Pagar</div>
                  <SubmenuLink to="/financeiro/pagamentos" name="Boletos a Pagar" icon={ArrowDownCircle} />
                  <SubmenuLink to="/financeiro/fornecedores" name="Gestão de Fornecedores" icon={Truck} />
                  <div className="px-3 py-2 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Relatórios</div>
                  <SubmenuLink to="/financeiro/prestacao-contas" name="Balançete Real-time" icon={ClipboardList} />
                </>
              )}
            </Submenu>

            {/* Submenu Banco Inter (Apenas Admin) */}
            {isAdmin && (
              <Submenu 
                name="Gestão Bancária" 
                icon={Wallet} 
                isOpen={menusOpen.banco} 
                onClick={() => toggleSubmenu('banco')}
                active={location.pathname.startsWith('/banco')}
              >
                <SubmenuLink to="/banco/extrato" name="Conciliação Bancária" icon={ClipboardList} />
                <SubmenuLink to="/banco/pix" name="Gestão de Pix" icon={Smartphone} />
                <SubmenuLink to="/banco/webhooks" name="Logs de Webhooks" icon={ShieldCheck} />
              </Submenu>
            )}

            {/* Submenu Operacional - Ajustado para Segurança */}
            <Submenu 
              name="Operacional" 
              icon={Wrench} 
              isOpen={menusOpen.operacional} 
              onClick={() => toggleSubmenu('operacional')}
              active={location.pathname.startsWith('/operacional')}
            >
              <SubmenuLink to="/operacional/servicos" name="Contratação" icon={Truck} />
              <SubmenuLink to="/operacional/seguranca" name="Câmeras / DVR" icon={ShieldCheck} />
              <SubmenuLink to="/operacional/ocorrencias" name="Ocorrências" icon={ClipboardList} />
            </Submenu>

            <MenuLink to="/reservas" icon={Calendar} name="Áreas Comuns" />

            {/* Submenu Comunicação */}
            <Submenu 
              name="Comunicação" 
              icon={MessageSquare} 
              isOpen={menusOpen.comunicacao} 
              onClick={() => toggleSubmenu('comunicacao')}
              active={location.pathname.startsWith('/avisos') || location.pathname.startsWith('/documentos') || location.pathname.startsWith('/comunicacao')}
            >
              <SubmenuLink to="/avisos" name="Mural de Avisos" icon={Bell} />
              <SubmenuLink to="/comunicacao/assembleias" name="Assembleias & Votos" icon={Users} />
              <SubmenuLink to="/documentos" name="Atas e Regimento" icon={FileText} />
            </Submenu>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <MenuLink to="/perfil" icon={User} name="Configurações Perfil" />
              {isAdmin && <MenuLink to="/admin" icon={Users} name="Gerenciar Usuários" color="text-red-600" />}
            </div>

          </nav>

          {/* Botão Sair */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
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

function MenuLink({ to, icon: Icon, name, color = "text-gray-700" }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
          isActive 
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' 
            : `${color} hover:bg-gray-100`
        }`
      }
    >
      <Icon className="w-5 h-5" />
      {name}
    </NavLink>
  );
}

function Submenu({ name, icon: Icon, children, isOpen, onClick, active }) {
  return (
    <div className="space-y-1">
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all ${
          active ? 'text-primary-600 bg-primary-50/50' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span>{name}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="ml-9 space-y-1 border-l-2 border-primary-50 pl-2 mt-1 animate-in slide-in-from-top-1 duration-200">
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
          isActive 
            ? 'text-primary-700 bg-primary-100/50' 
            : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      {name}
    </NavLink>
  );
}