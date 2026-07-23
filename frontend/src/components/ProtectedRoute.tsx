import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Em dev sem backend, deixa passar para facilitar testes de UI
  if (import.meta.env.DEV && import.meta.env.VITE_API_URL === 'http://localhost:3000' && !user && !loading) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--gold] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
