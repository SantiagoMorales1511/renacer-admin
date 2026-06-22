import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatTile } from '../components/ui/Card';
import { PageHeader } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { money, formatDateTime, sessionLabel, sessionSubtitle } from '../utils/format';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data,
  });

  if (isLoading || !data) {
    return <p className="text-muted">Cargando...</p>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general de la operación" />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Ingresos del día" value={money(data.incomeToday)} accent="green" />
        <StatTile label="Ingresos del mes" value={money(data.incomeMonth)} accent="petrol" />
        <StatTile label="Gastos del mes" value={money(data.expensesMonth)} accent="red" />
        <StatTile label="Utilidad estimada" value={money(data.estimatedProfit)} accent="gold" />
        <StatTile label="Estudiantes activos" value={data.activeStudents} accent="lavender" />
        <Link to="/cartera">
          <StatTile
            label="Pagos pendientes"
            value={data.pendingPaymentsCount}
            hint={money(data.pendingPaymentsTotal)}
            accent="red"
          />
        </Link>
        <StatTile label="Ingresos del año" value={money(data.incomeYear)} accent="petrol" />
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Próxima clase</h3>
        {data.nextSession ? (
          <Link to={`/sessions/${data.nextSession.id}`} className="block rounded-md border border-line p-3 hover:bg-canvas">
            <p className="font-medium">{sessionLabel(data.nextSession)}</p>
            {sessionSubtitle(data.nextSession) && (
              <p className="text-sm text-muted">{sessionSubtitle(data.nextSession)}</p>
            )}
            <p className="mt-1 text-sm text-muted">{formatDateTime(data.nextSession.date)}</p>
          </Link>
        ) : (
          <p className="text-sm text-muted">No hay clases programadas.</p>
        )}
      </div>

      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Resumen por grupo</h3>
        <Table columns={['Grupo', 'Estudiantes', 'Ingresos']} empty={data.groupSummary.length === 0}>
          {data.groupSummary.map((g: any) => (
            <tr key={g.id}>
              <Td>
                <Link to={`/groups/${g.id}`} className="font-medium text-petrol-600 hover:underline">
                  {g.name}
                </Link>
              </Td>
              <Td>{g.students}</Td>
              <Td className="font-medium">{money(g.income)}</Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
