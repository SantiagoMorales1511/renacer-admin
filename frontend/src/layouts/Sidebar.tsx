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

type NavTone = 'petrol' | 'sky' | 'brand' | 'periwinkle' | 'amber' | 'emerald' | 'rose';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  tone: NavTone;
  roles?: Role[];
  permission?: 'canRegisterExpenses';
}

const TONE: Record<
  NavTone,
  {
    bar: string;
    activeBg: string;
    activeText: string;
    icon: string;
    iconBg: string;
    hover: string;
  }
> = {
  petrol: {
    bar: 'bg-petrol-400',
    activeBg: 'bg-gradient-to-r from-petrol-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-petrol-800 dark:text-ink',
    icon: 'text-petrol-600 dark:text-petrol-400',
    iconBg: 'bg-petrol-100/70 dark:bg-petrol-500/15',
    hover: 'hover:bg-petrol-50/50 dark:hover:bg-surface-tint/70',
  },
  sky: {
    bar: 'bg-sky-400',
    activeBg: 'bg-gradient-to-r from-sky-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-sky-800 dark:text-ink',
    icon: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100/70 dark:bg-sky-500/15',
    hover: 'hover:bg-sky-50/50 dark:hover:bg-surface-tint/70',
  },
  brand: {
    bar: 'bg-brand-500',
    activeBg: 'bg-gradient-to-r from-brand-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-brand-800 dark:text-ink',
    icon: 'text-brand-600 dark:text-brand-300',
    iconBg: 'bg-brand-100/70 dark:bg-brand-500/15',
    hover: 'hover:bg-brand-50/50 dark:hover:bg-surface-tint/70',
  },
  periwinkle: {
    bar: 'bg-periwinkle-400',
    activeBg: 'bg-gradient-to-r from-periwinkle-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-brand-700 dark:text-ink',
    icon: 'text-periwinkle-500 dark:text-periwinkle-300',
    iconBg: 'bg-periwinkle-100/70 dark:bg-periwinkle-500/15',
    hover: 'hover:bg-periwinkle-50/50 dark:hover:bg-surface-tint/70',
  },
  amber: {
    bar: 'bg-amber-400',
    activeBg: 'bg-gradient-to-r from-amber-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-amber-900 dark:text-ink',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100/70 dark:bg-amber-500/15',
    hover: 'hover:bg-amber-50/50 dark:hover:bg-surface-tint/70',
  },
  emerald: {
    bar: 'bg-emerald-400',
    activeBg: 'bg-gradient-to-r from-emerald-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-emerald-800 dark:text-ink',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100/70 dark:bg-emerald-500/15',
    hover: 'hover:bg-emerald-50/50 dark:hover:bg-surface-tint/70',
  },
  rose: {
    bar: 'bg-rose-400',
    activeBg: 'bg-gradient-to-r from-rose-100/70 to-transparent dark:bg-surface-tint',
    activeText: 'text-rose-800 dark:text-ink',
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100/70 dark:bg-rose-500/15',
    hover: 'hover:bg-rose-50/50 dark:hover:bg-surface-tint/70',
  },
};

const ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tone: 'petrol', roles: ['ADMIN'] },
  { to: '/assistant/home', label: 'Inicio', icon: Home, tone: 'petrol', roles: ['ASSISTANT'] },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays, tone: 'sky' },
  { to: '/programs', label: 'Programas', icon: Layers, tone: 'brand' },
  { to: '/groups', label: 'Grupos', icon: Users, tone: 'periwinkle' },
  { to: '/students', label: 'Estudiantes', icon: GraduationCap, tone: 'periwinkle' },
  { to: '/modules', label: 'Módulos', icon: BookOpen, tone: 'amber', roles: ['ADMIN'] },
  { to: '/payments', label: 'Pagos', icon: Wallet, tone: 'emerald' },
  { to: '/cartera', label: 'Cartera', icon: Landmark, tone: 'emerald' },
  { to: '/daily-cash', label: 'Caja del día', icon: Coins, tone: 'emerald' },
  { to: '/expenses', label: 'Gastos', icon: Receipt, tone: 'rose', permission: 'canRegisterExpenses' },
  { to: '/cash-flow', label: 'Flujo de caja', icon: TrendingUp, tone: 'petrol', roles: ['ADMIN'] },
  { to: '/reports', label: 'Reportes', icon: FileBarChart, tone: 'brand', roles: ['ADMIN'] },
  { to: '/settings/users', label: 'Usuarios', icon: UserCog, tone: 'brand', roles: ['ADMIN'] },
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
    <nav className="flex h-full flex-col gap-0.5 p-3">
      <div className="mb-4 px-2 pt-2">
        <BrandLogo size="sm" className="mx-auto lg:mx-0" />
        <p className="mt-2 text-center text-xs font-medium text-ink/60 lg:text-left">Administración</p>
      </div>
      {visible.map((item) => {
        const tone = TONE[item.tone];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                isActive ? clsx(tone.activeBg, tone.activeText) : clsx('text-ink/75 dark:text-muted', tone.hover),
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className={clsx('absolute bottom-2 left-0 top-2 w-0.5 rounded-full', tone.bar)}
                    aria-hidden
                  />
                )}
                <span
                  className={clsx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                    isActive ? tone.iconBg : 'bg-transparent',
                  )}
                >
                  <item.icon size={16} className={isActive ? tone.icon : 'text-ink/55 dark:text-muted'} />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
