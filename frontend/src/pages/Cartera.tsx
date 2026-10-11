import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, MultiSelect, SearchInput } from '../components/ui/Form';
import { StatTile } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { money, formatDate, matchesSearch } from '../utils/format';
import type { Group } from '../types';

export function CarteraPage() {
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cartera'],
    queryFn: async () => (await api.get('/reports/cartera')).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  const allItems = data.items as any[];
  const moduleNumbers = [...new Set(allItems.map((r) => r.moduleNumber))].sort((a, b) => a - b);

  const items = allItems.filter((r) => {
    if (groupIds.length && !groupIds.includes(r.groupId)) return false;
    if (statusFilter.length && !statusFilter.includes(r.paymentStatus)) return false;
    if (moduleFilter.length && !moduleFilter.includes(String(r.moduleNumber))) return false;
    return matchesSearch(search, r.fullName, r.groupName, r.moduleName, r.phone);
  });

  const filtersActive = !!(search || groupIds.length || statusFilter.length || moduleFilter.length);
  const filteredDebt = items.reduce((s, r) => s + r.balance, 0);
  const filteredDebtors = new Set(items.map((r) => r.studentId)).size;

  function clearFilters() {
    setSearch('');
    setGroupIds([]);
    setStatusFilter([]);
    setModuleFilter([]);
  }

  return (
    <div>
      <PageHeader title="Cartera" subtitle="Estudiantes con saldo pendiente por módulo" />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={filtersActive ? 'Por cobrar (filtrado)' : 'Total por cobrar'}
          value={money(filtersActive ? filteredDebt : data.summary.totalDebt)}
          accent="red"
        />
        <StatTile
          label="Estudiantes con deuda"
          value={filtersActive ? filteredDebtors : data.summary.debtorCount}
          accent="sky"
        />
        <StatTile
          label="Módulos pendientes"
          value={filtersActive ? items.length : data.summary.pendingModulesCount}
          accent="gold"
        />
      </div>

      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por estudiante o celular"
          />
          <MultiSelect
            values={groupIds}
            onChange={setGroupIds}
            placeholder="Todos los grupos"
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
          />
          <MultiSelect
            values={moduleFilter}
            onChange={setModuleFilter}
            placeholder="Todos los módulos"
            options={moduleNumbers.map((n) => ({ value: String(n), label: `Módulo ${n}` }))}
          />
          <MultiSelect
            values={statusFilter}
            onChange={setStatusFilter}
            placeholder="Todos los estados"
            options={[
              { value: 'partial', label: 'Abono parcial' },
              { value: 'none', label: 'Sin pago' },
            ]}
          />
        </div>
        {filtersActive && (
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              Limpiar filtros
            </button>
            <span className="text-sm text-muted">
              {items.length} de {allItems.length} módulos pendientes
            </span>
          </div>
        )}
      </div>

      <DataTable
        breakpoint="lg"
        rows={items}
        rowKey={(r) => `${r.studentId}:${r.moduleId}`}
        empty={filtersActive ? 'Nadie coincide con la búsqueda.' : 'Sin saldos pendientes.'}
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
