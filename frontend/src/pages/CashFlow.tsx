import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, Field, Input } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { money, labelize } from '../utils/format';

export function CashFlowPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow', from, to],
    queryFn: async () =>
      (await api.get('/reports/cash-flow', { params: { from: from || undefined, to: to || undefined } })).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  const categories = Object.entries(data.expensesByCategory ?? {});

  return (
    <div>
      <PageHeader title="Flujo de caja" subtitle="Ingresos, gastos y rentabilidad" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Desde">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Ingresos" value={money(data.income)} accent="green" />
        <StatTile label="Gastos" value={money(data.expenses)} accent="red" />
        <StatTile label="Utilidad" value={money(data.profit)} accent="gold" />
        <StatTile label="Pagos pendientes" value={money(data.pending)} accent="sky" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Rentabilidad por grupo</h3>
          <Table columns={['Grupo', 'Ingresos', 'Gastos', 'Utilidad']} empty={data.incomeByGroup.length === 0}>
            {data.incomeByGroup.map((r: any) => (
              <tr key={r.group}>
                <Td className="font-medium">{r.group}</Td>
                <Td>{money(r.income)}</Td>
                <Td>{money(r.expenses)}</Td>
                <Td className={r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{money(r.profit)}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Gastos por categoría</h3>
          <Table columns={['Categoría', 'Valor']} empty={categories.length === 0}>
            {categories.map(([cat, value]) => (
              <tr key={cat}>
                <Td>{labelize(cat)}</Td>
                <Td className="font-medium">{money(value as number)}</Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
