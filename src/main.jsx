import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import './index.css';

// --- IMPORTAÇÃO DE PÁGINAS ---
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import TestaSupabase from './pages/TestaSupabase';

// Módulo Financeiro
import Financeiro from './pages/Financeiro'; // Certifique-se que este arquivo existe
import MeusBoletos from './pages/MeusBoletos';
import PrestacaoContas from './pages/PrestacaoContas';
import Balancetes from './pages/Balancetes';
import BoletosAPagar from './pages/BoletosAPagar';
import GerarBoletos from './pages/GerarBoletos';
import Fornecedores from './pages/Fornecedores';

// Módulo Banco
import Pix from './pages/Pix';

// Módulo Operacional
import Manutencao from './pages/Manutencao';
import ConsumoAgua from './pages/ConsumoAgua';
import ConsumoEnergia from './pages/ConsumoEnergia';
import DemaisGastos from './pages/DemaisGastos';
import Servicos from './pages/Servicos'; 
import Seguranca from './pages/Seguranca';
import Ocorrencias from './pages/Ocorrencias';

// Módulo Comunicação e Reservas
import Reservas from './pages/Reservas';
import Avisos from './pages/Avisos';
import PastaDigital from './pages/PastaDigital';
import CadastroCondomino from './pages/CadastroCondomino';
import Admin from './pages/Admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/testa-supabase" element={<TestaSupabase />} />

          {/* --- ROTAS PROTEGIDAS --- */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />

          {/* Módulo Financeiro */}
          <Route path="/financeiro/meus-boletos" element={
            <ProtectedRoute><Layout><MeusBoletos /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/gerar-boletos" element={
            <ProtectedRoute requireAdmin><Layout><GerarBoletos /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/boletos-a-pagar" element={
            <ProtectedRoute requireAdmin><Layout><BoletosAPagar /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/fornecedores" element={
            <ProtectedRoute requireAdmin><Layout><Fornecedores /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/prestacao-contas" element={
            <ProtectedRoute requireAdmin><Layout><PrestacaoContas /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/boletos" element={
            <ProtectedRoute requireAdmin><Layout><Financeiro /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/balancetes" element={
            <ProtectedRoute requireAdmin><Layout><Balancetes /></Layout></ProtectedRoute>
          } />

          {/* Módulo Gestão Bancária */}
          <Route path="/banco/pix" element={
            <ProtectedRoute requireAdmin><Layout><Pix /></Layout></ProtectedRoute>
          } />

          {/* Módulo Operacional */}
          <Route path="/operacional/manutencao" element={
            <ProtectedRoute><Layout><Manutencao /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/consumo-agua" element={
            <ProtectedRoute><Layout><ConsumoAgua /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/consumo-energia" element={
            <ProtectedRoute><Layout><ConsumoEnergia /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/demais-gastos" element={
            <ProtectedRoute><Layout><DemaisGastos /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/servicos" element={
            <ProtectedRoute><Layout><Servicos /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/seguranca" element={
            <ProtectedRoute><Layout><Seguranca /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/ocorrencias" element={
            <ProtectedRoute><Layout><Ocorrencias /></Layout></ProtectedRoute>
          } />

          {/* Módulo Comunicação */}
          <Route path="/reservas" element={
            <ProtectedRoute><Layout><Reservas /></Layout></ProtectedRoute>
          } />
          <Route path="/avisos" element={
            <ProtectedRoute><Layout><Avisos /></Layout></ProtectedRoute>
          } />
          <Route path="/comunicacao/documentos" element={
            <ProtectedRoute><Layout><PastaDigital /></Layout></ProtectedRoute>
          } />

          {/* Administração */}
          <Route path="/condominos/cadastro" element={
            <ProtectedRoute requireAdmin><Layout><CadastroCondomino /></Layout></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin><Layout><Admin /></Layout></ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>
          } />

          {/* --- REDIRECIONAMENTOS --- */}
          <Route path="/financeiro" element={<Navigate to="/financeiro/meus-boletos" replace />} />
          <Route path="/banco" element={<Navigate to="/banco/pix" replace />} />
          <Route path="/operacional" element={<Navigate to="/operacional/manutencao" replace />} />
          <Route path="/comunicacao" element={<Navigate to="/avisos" replace />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);