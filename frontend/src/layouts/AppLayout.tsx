import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { useRealtime } from '../hooks/useRealtime';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  assistant: 'Inicio',
  calendar: 'Calendario',
  programs: 'Programas',
  groups: 'Grupos',
  students: 'Estudiantes',
  modules: 'Módulos',
  payments: 'Pagos',
  cartera: 'Cartera',
  'daily-cash': 'Caja del día',
  expenses: 'Gastos',
  'cash-flow': 'Flujo de caja',
  reports: 'Reportes',
  settings: 'Usuarios',
  sessions: 'Sesión',
  events: 'Evento',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useRealtime();

  const routeTitle = ROUTE_TITLES[location.pathname.split('/')[1]] ?? 'Renacer';

  return (
    <div className="flex h-screen gap-3 overflow-hidden p-3">
      <aside className="panel hidden w-60 shrink-0 overflow-hidden lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="panel absolute left-0 top-0 h-full w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex h-14 shrink-0 items-center justify-between rounded-panel bg-surface/85 px-3 shadow-card backdrop-blur-sm dark:bg-surface/90 dark:shadow-card-dark sm:px-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-muted hover:bg-periwinkle-50/80 dark:hover:bg-petrol-500/15 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-ink lg:hidden">{routeTitle}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-muted hover:bg-periwinkle-50/80 dark:hover:bg-petrol-500/15"
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{user?.name}</p>
              <p className="text-xs text-muted">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Asistente'}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-muted hover:bg-lilac-50/80 dark:hover:bg-petrol-500/15"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-2">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
