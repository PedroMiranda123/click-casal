import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HubPage } from './pages/HubPage';
import { DashboardPage } from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ShoppingListPage from './pages/ShoppingListPage';
import OfertasPage from './pages/OfertasPage';
import FolhetosPage from './pages/FolhetosPage';
import ManutencaoPage from './pages/ManutencaoPage';
import FitnessPage from './pages/FitnessPage';
import EventosPage from './pages/EventosPage';
import EventosFilmesPage from './pages/EventosFilmesPage';
import InteressesPage from './pages/InteressesPage';
import WrappedPage from './pages/WrappedPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HubPage />} />
            <Route path="/financas" element={<DashboardPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/manutencao" element={<ManutencaoPage />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/eventos" element={<EventosPage />}>
              <Route path="filmes" element={<EventosFilmesPage />} />
              <Route path="interesses" element={<InteressesPage />} />
            </Route>
            <Route path="/compras" element={<ShoppingListPage />}>
              <Route path="ofertas" element={<OfertasPage />} />
              <Route path="folhetos" element={<FolhetosPage />} />
            </Route>
            <Route path="/wrapped" element={<WrappedPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
