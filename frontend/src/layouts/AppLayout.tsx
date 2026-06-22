import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { useRealtime } from '../hooks/useRealtime';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  useRealtime();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 border-r border-line bg-surface">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
          <button
            className="rounded-md p-2 text-muted hover:bg-canvas lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="rounded-md p-2 text-muted hover:bg-canvas"
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
              className="rounded-md p-2 text-muted hover:bg-canvas"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
