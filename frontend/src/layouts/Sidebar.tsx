import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  Landmark,
  Coins,
  Receipt,
  TrendingUp,
  FileBarChart,
  UserCog,
  Home,
  Layers,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { BrandLogo } from '../components/ui/BrandLogo';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  roles?: Role[];
  permission?: 'canRegisterExpenses';
}

const ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/assistant/home', label: 'Inicio', icon: Home, roles: ['ASSISTANT'] },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/programs', label: 'Programas', icon: Layers },
  { to: '/groups', label: 'Grupos', icon: Users },
  { to: '/students', label: 'Estudiantes', icon: GraduationCap },
  { to: '/modules', label: 'Módulos', icon: BookOpen, roles: ['ADMIN'] },
  { to: '/payments', label: 'Pagos', icon: Wallet },
  { to: '/cartera', label: 'Cartera', icon: Landmark },
  { to: '/daily-cash', label: 'Caja del día', icon: Coins },
  { to: '/expenses', label: 'Gastos', icon: Receipt, permission: 'canRegisterExpenses' },
  { to: '/cash-flow', label: 'Flujo de caja', icon: TrendingUp, roles: ['ADMIN'] },
  { to: '/reports', label: 'Reportes', icon: FileBarChart, roles: ['ADMIN'] },
  { to: '/settings/users', label: 'Usuarios', icon: UserCog, roles: ['ADMIN'] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const visible = ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.permission && user.role !== 'ADMIN' && !user[item.permission]) return false;
    return true;
  });

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 px-2 pt-2">
        <BrandLogo size="sm" className="mx-auto lg:mx-0" />
        <p className="mt-2 text-center text-xs text-muted lg:text-left">Administración</p>
      </div>
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gradient-to-r from-petrol-50 to-periwinkle-50 text-brand-600 dark:from-petrol-500/15 dark:to-periwinkle-500/10 dark:text-petrol-300'
                : 'text-muted hover:bg-periwinkle-50/60 hover:text-brand-600 dark:hover:bg-petrol-500/10 dark:hover:text-petrol-200',
            )
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
