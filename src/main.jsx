import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas Existentes
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Financeiro from './pages/Financeiro'; // Atua como Boleto/Receita
import Reservas from './pages/Reservas';
import Avisos from './pages/Avisos';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import Seguranca from './pages/Seguranca';
import TestaSupabase from './pages/TestaSupabase';

// Novas Páginas (Certifique-se de criar estes arquivos em src/pages/)
import Servicos from './pages/Servicos'; 
import Boleto from './pages/Boleto'; // Gestão detalhada/Inter
import Pagamentos from './pages/Financeiro'; // Inicialmente pode reutilizar ou ser nova
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
          
          {/* Dashboard Geral */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />

          {/* Módulo Financeiro (Contas a Receber / Morador) */}
          <Route path="/financeiro/boletos" element={
            <ProtectedRoute><Layout><Boleto /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/meus-boletos" element={
            <ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>
          } />

          {/* Módulo Financeiro (Contas a Pagar / Admin) */}
          <Route path="/financeiro/pagamentos" element={
            <ProtectedRoute requireAdmin><Layout><Pagamentos /></Layout></ProtectedRoute>
          } />
          <Route path="/financeiro/prestacao-contas" element={
            <ProtectedRoute><Layout><div className="card"><h1>Prestação de Contas (Inter API)</h1><p>Módulo em desenvolvimento...</p></div></Layout></ProtectedRoute>
          } />

          {/* Módulo Operacional & Serviços */}
          <Route path="/operacional/servicos" element={
            <ProtectedRoute><Layout><Servicos /></Layout></ProtectedRoute>
          } />
          <Route path="/operacional/manutencao" element={
            <ProtectedRoute><Layout><div className="card"><h1>Agenda de Manutenção</h1><p>Próximas visitas de elevadores e bombas...</p></div></Layout></ProtectedRoute>
          } />

          {/* Áreas Comuns, Avisos e Documentos */}
          <Route path="/reservas" element={
            <ProtectedRoute><Layout><Reservas /></Layout></ProtectedRoute>
          } />
          <Route path="/avisos" element={
            <ProtectedRoute><Layout><Avisos /></Layout></ProtectedRoute>
          } />
          <Route path="/documentos" element={
            <ProtectedRoute><Layout><div className="card"><h1>Documentos e Atas</h1><p>Repositório de arquivos do condomínio...</p></div></Layout></ProtectedRoute>
          } />

          {/* Gestão Bancária (Inter Webhooks/Pix) */}
          <Route path="/banco/extrato" element={
            <ProtectedRoute requireAdmin><Layout><div className="card"><h1>Conciliação Bancária</h1></div></Layout></ProtectedRoute>
          } />

          {/* Módulo de Segurança - Tutorial de Câmeras */}
          <Route
          path="/operacional/seguranca"
          element={
              <ProtectedRoute>
              <Layout>
                  <Seguranca />
              </Layout>
              </ProtectedRoute>
        }
        />

          {/* Perfil e Admin */}
          <Route path="/perfil" element={
            <ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin><Layout><Admin /></Layout></ProtectedRoute>
          } />

          {/* --- REDIRECIONAMENTOS E SEGURANÇA --- */}
          {/* Fallback para Financeiro */}
          <Route path="/financeiro" element={<Navigate to="/financeiro/boletos" replace />} />
          
          {/* Root e 404 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);