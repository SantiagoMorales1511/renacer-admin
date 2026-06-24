import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AssistantHomePage } from './pages/AssistantHome';
import { CalendarPage } from './pages/Calendar';
import { ProgramsPage } from './pages/Programs';
import { ProgramDetailPage } from './pages/ProgramDetail';
import { EventDetailPage } from './pages/EventDetail';
import { GroupsPage } from './pages/Groups';
import { GroupDetailPage } from './pages/GroupDetail';
import { StudentsPage } from './pages/Students';
import { StudentDetailPage } from './pages/StudentDetail';
import { ModulesPage } from './pages/Modules';
import { SessionDetailPage } from './pages/SessionDetail';
import { PaymentsPage } from './pages/Payments';
import { CarteraPage } from './pages/Cartera';
import { DailyCashPage } from './pages/DailyCash';
import { ExpensesPage } from './pages/Expenses';
import { CashFlowPage } from './pages/CashFlow';
import { ReportsPage } from './pages/Reports';
import { UsersPage } from './pages/Users';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/assistant/home'} replace />;
}

export default function App() {
  const loadMe = useAuth((s) => s.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/assistant/home" element={<AssistantHomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route
          path="/modules"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ModulesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/cartera" element={<CarteraPage />} />
        <Route path="/daily-cash" element={<DailyCashPage />} />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute permission="canRegisterExpenses">
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cash-flow"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <CashFlowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
