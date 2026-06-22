import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, Field, Input } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { useAuth } from '../store/auth';
import { money, formatTime, labelize } from '../utils/format';

export function DailyCashPage() {
  const { user } = useAuth();
  const canPickRange = user?.role === 'ADMIN' || user?.canViewOtherDays;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['daily-cash', from, to],
    queryFn: async () =>
      (
        await api.get('/daily-cash', {
          params: canPickRange ? { from: from || undefined, to: to || undefined } : {},
        })
      ).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  const methods = [
    ['EFECTIVO', 'Efectivo'],
    ['TARJETA', 'Tarjeta'],
    ['TRANSFERENCIA', 'Transferencia'],
    ['NEQUI', 'Nequi'],
    ['DAVIPLATA', 'Daviplata'],
    ['OTRO', 'Otros'],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Caja del día"
        subtitle={canPickRange ? 'Ingresos por método de pago' : 'Ingresos de hoy por método de pago'}
      />

      {canPickRange && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="Desde">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {methods.map(([key, label]) => (
          <StatTile key={key} label={label} value={money(data.byMethod[key] ?? 0)} accent="petrol" />
        ))}
        <StatTile label="Total del día" value={money(data.total)} accent="gold" />
      </div>

      <h3 className="mb-3 text-sm font-semibold">Pagos registrados</h3>
      <Table columns={['Hora', 'Estudiante', 'Grupo', 'Módulo', 'Método', 'Valor']} empty={data.payments.length === 0}>
        {data.payments.map((p: any) => (
          <tr key={p.id}>
            <Td>{formatTime(p.paidAt)}</Td>
            <Td className="font-medium">{p.studentName}</Td>
            <Td>{p.groupName ?? '-'}</Td>
            <Td>{p.moduleName}</Td>
            <Td>{labelize(p.method)}</Td>
            <Td className="font-medium">{money(p.amount)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
