import BoletosAPagar from './pages/BoletosAPagar';
          <Route path="/financeiro/boletos-a-pagar" element={
            <ProtectedRoute requireAdmin><Layout><BoletosAPagar /></Layout></ProtectedRoute>
          } />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// --- IMPORTAÇÃO DE PÁGINAS ---

// Autenticação e Base
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import TestaSupabase from './pages/TestaSupabase';

// Módulo Financeiro
import Financeiro from './pages/Financeiro'; 
import Boleto from './pages/Boleto';
import PrestacaoContas from './pages/PrestacaoContas';
import Balancetes from './pages/Balancetes';
import Pagamentos from './pages/BoletosAPagar'; // Certifique-se que o arquivo existe

import Fornecedores from './pages/Fornecedores'; // Certifique-se que o arquivo existe

// Módulo Banco (Inter)
import Pix from './pages/Pix';

// Módulo Operacional
import Manutencao from './pages/Manutencao';
import ConsumoAgua from './pages/ConsumoAgua';
import Servicos from './pages/Servicos'; 
import Seguranca from './pages/Seguranca';
import Ocorrencias from './pages/Ocorrencias';
import Consumo from './pages/Consumo';
import ConsumoEnergia from './pages/ConsumoEnergia';

// Módulo Comunicação e Reservas
import Reservas from './pages/Reservas';
import Avisos from './pages/Avisos';
import PastaDigital from './pages/PastaDigital';
// ...existing code...

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/testa-supabase" element={<TestaSupabase />} />

          {/* --- ROTAS PROTEGIDAS (DENTRO DO LAYOUT) --- */}
          
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />

          {/* Módulo Financeiro */}
          <Route path="/financeiro/meus-boletos" element={
            <ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>
          } />
          

          <Route path="/financeiro/pagamentos" element={
            <ProtectedRoute requireAdmin><Layout><Pagamentos /></Layout></ProtectedRoute>
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

          <Route path="/financeiro/balancetes" element={
            <ProtectedRoute requireAdmin><Layout><Balancetes /></Layout></ProtectedRoute>
          } />

          {/* Módulo Gestão Bancária (Inter) */}
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

          <Route path="/operacional/servicos" element={
            <ProtectedRoute><Layout><Servicos /></Layout></ProtectedRoute>
          } />

          <Route path="/operacional/seguranca" element={
            <ProtectedRoute><Layout><Seguranca /></Layout></ProtectedRoute>
          } />

          <Route path="/operacional/ocorrencias" element={
            <ProtectedRoute><Layout><Ocorrencias /></Layout></ProtectedRoute>
          } />

          <Route path="/operacional/consumo-energia" element={
            <ProtectedRoute><Layout><ConsumoEnergia /></Layout></ProtectedRoute>
          } />

          {/* Módulo Comunicação e Social */}
          <Route path="/reservas" element={
            <ProtectedRoute><Layout><Reservas /></Layout></ProtectedRoute>
          } />
          <Route path="/avisos" element={
            <ProtectedRoute><Layout><Avisos /></Layout></ProtectedRoute>
          } />
          <Route path="/comunicacao/documentos" element={
            <ProtectedRoute><Layout><PastaDigital /></Layout></ProtectedRoute>
          } />
// ...existing code...

          {/* Perfil e Admin */}
          <Route path="/perfil" element={
            <ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin><Layout><Admin /></Layout></ProtectedRoute>
          } />

          {/* --- REDIRECIONAMENTOS --- */}
          <Route path="/financeiro" element={<Navigate to="/financeiro/meus-boletos" replace />} />
          <Route path="/banco" element={<Navigate to="/banco/extrato" replace />} />
          <Route path="/operacional" element={<Navigate to="/operacional/manutencao" replace />} />
          <Route path="/comunicacao" element={<Navigate to="/avisos" replace />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);