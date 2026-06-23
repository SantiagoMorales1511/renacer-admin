import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { money } from '../utils/format';

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports')).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Indicadores académicos y financieros" />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Ingresos del mes" value={money(data.paymentsTotal)} accent="green" />
        <StatTile label="Gastos del mes" value={money(data.expensesTotal)} accent="red" />
        <StatTile label="Estudiantes con deuda" value={data.debtors.length} accent="sky" />
        <StatTile label="Asistieron sin pagar" value={data.attendedNotPaid.length} accent="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Estudiantes con deuda</h3>
          <Table columns={['Estudiante', 'Grupo', 'Saldo']} empty={data.debtors.length === 0}>
            {data.debtors.map((d: any) => (
              <tr key={d.id}>
                <Td className="font-medium">{d.fullName}</Td>
                <Td>{d.groupName ?? '-'}</Td>
                <Td className="font-medium text-red-600">{money(d.balance)}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Asistieron y no pagaron</h3>
          <Table columns={['Estudiante', 'Grupo', 'Módulo']} empty={data.attendedNotPaid.length === 0}>
            {data.attendedNotPaid.map((r: any, i: number) => (
              <tr key={i}>
                <Td className="font-medium">{r.studentName}</Td>
                <Td>{r.groupName ?? '-'}</Td>
                <Td>{r.moduleName}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Pagaron y no asistieron</h3>
          <Table columns={['Estudiante', 'Grupo', 'Módulo']} empty={data.paidNotAttended.length === 0}>
            {data.paidNotAttended.map((r: any, i: number) => (
              <tr key={i}>
                <Td className="font-medium">{r.studentName}</Td>
                <Td>{r.groupName ?? '-'}</Td>
                <Td>{r.moduleName}</Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
