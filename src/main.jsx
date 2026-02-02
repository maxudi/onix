import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; 
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import './index.css';

// --- IMPORTAÇÃO DE PÁGINAS ---
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reset from './pages/Reset';
import UpdatePassword from './pages/UpdatePassword';

// Importação das duas versões do Perfil
import PerfilEditar from './pages/Perfil'; 
import PerfilVisualizar from './pages/PerfilCondomino'; 

// Módulo Financeiro
import Financeiro from './pages/Financeiro';
import MeusBoletos from './pages/MeusBoletos';
import PrestacaoContas from './pages/PrestacaoContas';
import Balancetes from './pages/Balancetes';
import BoletosAPagar from './pages/BoletosAPagar';
import GerarBoletos from './pages/GerarBoletos';
import Fornecedores from './pages/Fornecedores';

// Módulo Banco e Operacional
import Pix from './pages/Pix';
import Manutencao from './pages/Manutencao';
import ConsumoAgua from './pages/ConsumoAgua';
import ConsumoEnergia from './pages/ConsumoEnergia';
import DemaisGastos from './pages/DemaisGastos';
import Servicos from './pages/Servicos'; 
import Seguranca from './pages/Seguranca';
import Ocorrencias from './pages/Ocorrencias';

// Módulo Comunicação e Administração
import Reservas from './pages/Reservas';
import Avisos from './pages/Avisos';
import PastaDigital from './pages/PastaDigital';
import CadastroCondomino from './pages/CadastroCondomino';
import Admin from './pages/Admin';

function AppRoutes() {
  const { user, forcePasswordChange, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  // Bloqueio para troca de senha obrigatória no primeiro acesso
  if (user && forcePasswordChange) {
    return <ForcePasswordChangeModal />;
  }

  return (
    <Routes>
      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* ROTAS PROTEGIDAS COM LAYOUT */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* PERFIL (Sincronizado com o Layout) */}
        <Route path="/perfil" element={<PerfilEditar />} />
        <Route path="/perfil/cracha" element={<PerfilVisualizar />} />
        
        {/* OPERACIONAL E MORADOR */}
        <Route path="/financeiro/meus-boletos" element={<MeusBoletos />} />
        <Route path="/operacional/manutencao" element={<Manutencao />} />
        <Route path="/operacional/consumo-agua" element={<ConsumoAgua />} />
        <Route path="/operacional/consumo-energia" element={<ConsumoEnergia />} />
        <Route path="/operacional/demais-gastos" element={<DemaisGastos />} />
        <Route path="/operacional/servicos" element={<Servicos />} />
        <Route path="/operacional/seguranca" element={<Seguranca />} />
        <Route path="/operacional/ocorrencias" element={<Ocorrencias />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/comunicacao/documentos" element={<PastaDigital />} />

        {/* ROTAS ADMINISTRATIVAS (APENAS SÍNDICO) */}
        <Route path="/financeiro/gerar-boletos" element={<ProtectedRoute requireAdmin><GerarBoletos /></ProtectedRoute>} />
        <Route path="/financeiro/boletos-a-pagar" element={<ProtectedRoute requireAdmin><BoletosAPagar /></ProtectedRoute>} />
        <Route path="/financeiro/fornecedores" element={<ProtectedRoute requireAdmin><Fornecedores /></ProtectedRoute>} />
        <Route path="/financeiro/prestacao-contas" element={<ProtectedRoute requireAdmin><PrestacaoContas /></ProtectedRoute>} />
        <Route path="/financeiro/boletos" element={<ProtectedRoute requireAdmin><Financeiro /></ProtectedRoute>} />
        <Route path="/financeiro/balancetes" element={<ProtectedRoute requireAdmin><Balancetes /></ProtectedRoute>} />
        <Route path="/banco/pix" element={<ProtectedRoute requireAdmin><Pix /></ProtectedRoute>} />
        <Route path="/condominos/cadastro" element={<ProtectedRoute requireAdmin><CadastroCondomino /></ProtectedRoute>} />
        <Route path="/condominos/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      </Route>

      {/* REDIRECIONAMENTOS PADRÃO */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Renderização Principal do React
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-primary-600 uppercase tracking-widest">
            Carregando Onix...
          </div>
        }>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);