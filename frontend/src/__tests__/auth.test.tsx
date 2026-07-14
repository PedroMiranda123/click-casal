import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Stub out DashboardPage so the test doesn't fetch data
function StubDashboard() {
  return <div>dashboard</div>;
}
function StubLogin() {
  return <div>login</div>;
}

function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<StubLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<StubDashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('auth redirect', () => {
  it('redirects unauthenticated user from / to /login', async () => {
    // Both /auth/me and /auth/refresh return 401
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('login')).toBeInTheDocument();
    });
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('shows dashboard when /auth/me succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'u1', name: 'Pedro', email: 'pedro@test.com' }),
    }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('login')).not.toBeInTheDocument();
  });

  it('shows dashboard when /auth/me 401 but /auth/refresh succeeds', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      callCount++;
      if (url.endsWith('/auth/me') && callCount === 1) {
        // First /auth/me → 401
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      if (url.endsWith('/auth/refresh')) {
        // Refresh succeeds
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) });
      }
      // Second /auth/me → success
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ id: 'u1', name: 'Pedro', email: 'pedro@test.com' }),
      });
    }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('dashboard')).toBeInTheDocument();
    });
  });
});
