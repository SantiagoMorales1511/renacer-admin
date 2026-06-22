import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, Select } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
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
        <StatTile label="Estudiantes con deuda" value={data.summary.debtorCount} accent="lavender" />
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

      <Table
        columns={['Estudiante', 'Grupo', 'Celular', 'Módulo', 'Dictado', 'Precio', 'Pagado', 'Saldo', 'Estado']}
        empty={data.items.length === 0}
      >
        {data.items.map((r: any) => (
          <tr key={`${r.studentId}:${r.moduleId}`}>
            <Td>
              <Link to={`/students/${r.studentId}`} className="font-medium text-petrol-600 hover:underline">
                {r.fullName}
              </Link>
            </Td>
            <Td>{r.groupName ?? '-'}</Td>
            <Td>{r.phone ?? '-'}</Td>
            <Td>
              {r.moduleNumber}. {r.moduleName}
            </Td>
            <Td>{formatDate(r.moduleDate)}</Td>
            <Td>{money(r.baseValue)}</Td>
            <Td>{money(r.paid)}</Td>
            <Td className="font-medium text-red-600">{money(r.balance)}</Td>
            <Td>
              <Badge
                status={r.paymentStatus === 'partial' ? 'PAUSED' : 'CANCELLED'}
                label={r.paymentStatus === 'partial' ? 'Abono parcial' : 'Sin pago'}
              />
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
