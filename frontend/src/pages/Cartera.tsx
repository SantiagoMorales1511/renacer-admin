import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, Select } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { money, formatDate } from '../utils/format';
import type { Group } from '../types';

export function CarteraPage() {
  const [groupId, setGroupId] = useState('');

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cartera', groupId],
    queryFn: async () =>
      (await api.get('/reports/cartera', { params: { groupId: groupId || undefined } })).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <PageHeader title="Cartera" subtitle="Estudiantes con saldo pendiente por módulo" />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total por cobrar" value={money(data.summary.totalDebt)} accent="red" />
        <StatTile label="Estudiantes con deuda" value={data.summary.debtorCount} accent="sky" />
        <StatTile label="Módulos pendientes" value={data.summary.pendingModulesCount} accent="gold" />
      </div>

      <div className="mb-4 max-w-xs">
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        breakpoint="lg"
        rows={data.items as any[]}
        rowKey={(r) => `${r.studentId}:${r.moduleId}`}
        empty="Sin saldos pendientes."
        columns={[
          {
            header: 'Estudiante',
            primary: true,
            cell: (r) => (
              <Link
                to={`/students/${r.studentId}`}
                className="font-medium text-petrol-600 hover:underline"
              >
                {r.fullName}
              </Link>
            ),
          },
          { header: 'Grupo', cell: (r) => r.groupName ?? '-' },
          { header: 'Celular', hideOnMobile: true, cell: (r) => r.phone ?? '-' },
          { header: 'Módulo', cell: (r) => `${r.moduleNumber}. ${r.moduleName}` },
          { header: 'Dictado', hideOnMobile: true, cell: (r) => formatDate(r.moduleDate) },
          { header: 'Precio', hideOnMobile: true, cell: (r) => money(r.baseValue) },
          { header: 'Pagado', hideOnMobile: true, cell: (r) => money(r.paid) },
          {
            header: 'Saldo',
            className: 'font-medium text-red-600',
            cell: (r) => money(r.balance),
          },
          {
            header: 'Estado',
            cell: (r) => (
              <Badge
                status={r.paymentStatus === 'partial' ? 'PAUSED' : 'CANCELLED'}
                label={r.paymentStatus === 'partial' ? 'Abono parcial' : 'Sin pago'}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
