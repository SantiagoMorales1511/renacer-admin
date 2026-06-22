import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatTile } from '../components/ui/Card';
import { PageHeader } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { money, formatDateTime, formatTime, labelize, sessionLabel, sessionSubtitle } from '../utils/format';

export function AssistantHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assistant-home'],
    queryFn: async () => (await api.get('/reports/assistant-home')).data,
  });

  if (isLoading || !data) {
    return <p className="text-muted">Cargando...</p>;
  }

  return (
    <div>
      <PageHeader title="Inicio" subtitle="Operación del día" />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Ingresos de hoy" value={money(data.incomeToday)} accent="green" />
        <StatTile label="Pagos de hoy" value={data.paymentsToday.length} accent="petrol" />
        <StatTile label="Clases de hoy" value={data.todaySessions.length} accent="lavender" />
        <StatTile label="Estudiantes activos" value={data.activeStudents} accent="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold">Asistencia pendiente</h3>
          {data.pendingAttendance.length === 0 ? (
            <p className="text-sm text-muted">Sin asistencia pendiente hoy.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.pendingAttendance.map((s: any) => (
                <li key={s.sessionId} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/sessions/${s.sessionId}`} className="text-petrol-600 hover:underline">
                    {s.group} · {s.module}
                  </Link>
                  <span className="text-muted">{s.pending} por registrar</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Clases de hoy</h3>
          <Table columns={['Actividad', 'Detalle', 'Horario', 'Lugar', 'Estado']} empty={data.todaySessions.length === 0}>
            {data.todaySessions.map((s: any) => (
              <tr key={s.id}>
                <Td>
                  <Link to={`/sessions/${s.id}`} className="font-medium text-petrol-600 hover:underline">
                    {s.title ?? s.group ?? '-'}
                  </Link>
                </Td>
                <Td>{s.module ?? '-'}</Td>
                <Td>{s.startTime ? `${s.startTime} - ${s.endTime ?? ''}` : '-'}</Td>
                <Td>{s.place ?? '-'}</Td>
                <Td><Badge status={s.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Pagos registrados hoy</h3>
          <Table columns={['Estudiante', 'Módulo', 'Método', 'Valor', 'Hora']} empty={data.paymentsToday.length === 0}>
            {data.paymentsToday.map((p: any) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.studentName}</Td>
                <Td>{p.moduleName}</Td>
                <Td>{labelize(p.method)}</Td>
                <Td className="font-medium">{money(p.amount)}</Td>
                <Td>{formatTime(p.paidAt)}</Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
