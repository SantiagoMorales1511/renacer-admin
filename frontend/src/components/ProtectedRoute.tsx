import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import type { Role } from '../types';

type AppPermission = 'canRegisterExpenses';

export function ProtectedRoute({
  children,
  roles,
  permission,
}: {
  children: ReactNode;
  roles?: Role[];
  permission?: AppPermission;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted">Cargando...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/assistant/home'} replace />;
  }

  if (permission && user.role !== 'ADMIN' && !user[permission]) {
    return <Navigate to="/assistant/home" replace />;
  }

  return <>{children}</>;
}
