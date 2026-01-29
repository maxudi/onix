import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    // Salvamos a rota que ele tentou acessar para redirecionar após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // AJUSTE AQUI: Aceita 'admin' ou 'sindico'
  const isAuthorized = user.role === 'admin' || user.role === 'sindico';

  if (requireAdmin && !isAuthorized) {
    console.warn("Acesso negado: Perfil do usuário não é administrativo.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};