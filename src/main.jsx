import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Verifique se a pasta é 'contexts' ou 'context'
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import './index.css';

// --- IMPORTAÇÃO DE PÁGINAS ---
// Nota: Se o Vite der erro 1, verifique se estes arquivos existem exatamente com esses nomes
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';

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

// Componente para gerenciar a troca de senha e rotas
function AppRoutes() {
  const { user, forcePasswordChange, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  // Se o login foi com senha padrão, trava na tela de troca
  if (user && forcePasswordChange) {
    return <ForcePasswordChangeModal />;
  }

  return (
    <Routes>
      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ROTAS PROTEGIDAS (LAYOUT COMUM) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil" element={<Perfil />} />
        
        {/* Morador e Síndico */}
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

        {/* APENAS SÍNDICO (ADMIN) */}
        <Route path="/financeiro/gerar-boletos" element={<ProtectedRoute requireAdmin><GerarBoletos /></ProtectedRoute>} />
        <Route path="/financeiro/boletos-a-pagar" element={<ProtectedRoute requireAdmin><BoletosAPagar /></ProtectedRoute>} />
        <Route path="/financeiro/fornecedores" element={<ProtectedRoute requireAdmin><Fornecedores /></ProtectedRoute>} />
        <Route path="/financeiro/prestacao-contas" element={<ProtectedRoute requireAdmin><PrestacaoContas /></ProtectedRoute>} />
        <Route path="/financeiro/boletos" element={<ProtectedRoute requireAdmin><Financeiro /></ProtectedRoute>} />
        <Route path="/financeiro/balancete-mensal" element={<ProtectedRoute requireAdmin><Balancetes /></ProtectedRoute>} />
        <Route path="/banco/pix" element={<ProtectedRoute requireAdmin><Pix /></ProtectedRoute>} />
        <Route path="/condominos/cadastro" element={<ProtectedRoute requireAdmin><CadastroCondomino /></ProtectedRoute>} />
        <Route path="/condominos/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      </Route>

      {/* REDIRECIONAMENTOS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Renderização Principal
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div>Carregando...</div>}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);