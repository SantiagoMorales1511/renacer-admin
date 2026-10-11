import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { api } from '../services/api';
import { PageHeader, Select } from '../components/ui/Form';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { money, formatDate } from '../utils/format';
import type { Group } from '../types';

type PayStatus = 'full' | 'partial' | 'none';
type DetailKind = 'attended' | PayStatus;

interface ModulePerson {
  studentId: string;
  fullName: string;
  attended: boolean;
  price: number;
  paid: number;
  balance: number;
  payStatus: PayStatus;
}

interface ModuleStat {
  moduleId: string;
  moduleNumber: number;
  name: string;
  date?: string | null;
  upcoming: boolean;
  students: number;
  attended: number;
  paidFull: number;
  paidPartial: number;
  paidNone: number;
  people: ModulePerson[];
}

const DETAIL_TITLES: Record<DetailKind, string> = {
  attended: 'Asistieron',
  full: 'Pago completo',
  partial: 'Abono parcial',
  none: 'Sin pago',
};

const COUNT_TONES: Record<DetailKind, string> = {
  attended: 'text-petrol-700 bg-petrol-50 hover:bg-petrol-100 dark:text-petrol-300 dark:bg-petrol-500/10',
  full: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30',
  partial: 'text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30',
  none: 'text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30',
};

export function ModuleSummaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<{ moduleId: string; kind: DetailKind } | null>(null);

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const defaultGroup = groups.find((g) => g.status === 'ACTIVE') ?? groups[0];
  const groupId = searchParams.get('group') || defaultGroup?.id || '';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['group', groupId, 'module-stats'],
    queryFn: async () =>
      (await api.get<{ students: number; modules: ModuleStat[] }>(`/groups/${groupId}/module-stats`)).data,
    enabled: !!groupId,
  });

  const modules = stats?.modules ?? [];
  const detailModule = detail ? modules.find((m) => m.moduleId === detail.moduleId) : undefined;
  const detailPeople = detailModule
    ? detailModule.people.filter((p) =>
        detail!.kind === 'attended' ? p.attended : p.payStatus === detail!.kind,
      )
    : [];

  function countButton(m: ModuleStat, kind: DetailKind, value: number, suffix?: string) {
    const label = suffix ? `${value} ${suffix}` : String(value);
    if (value === 0 || m.upcoming) {
      return <span className="px-2.5 py-1 text-sm text-muted">{label}</span>;
    }
    return (
      <button
        type="button"
        className={clsx('rounded-full px-2.5 py-1 text-sm font-semibold transition-colors', COUNT_TONES[kind])}
        onClick={() => setDetail({ moduleId: m.moduleId, kind })}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <PageHeader
        title="Resumen de módulos"
        subtitle="Asistencia y estado de pago de cada módulo"
      />

      <div className="mb-4 max-w-md">
        <Select
          value={groupId}
          onChange={(e) => setSearchParams(e.target.value ? { group: e.target.value } : {})}
          disabled={groupsLoading}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      {stats && (
        <p className="mb-3 text-sm text-muted">
          {stats.students} {stats.students === 1 ? 'estudiante' : 'estudiantes'} en el grupo
        </p>
      )}

      <DataTable
        breakpoint="md"
        rows={isLoading ? [] : modules}
        rowKey={(m) => m.moduleId}
        empty={isLoading ? 'Cargando...' : groupId ? 'Este grupo no tiene módulos.' : 'No hay grupos.'}
        columns={[
          {
            header: 'Módulo',
            primary: true,
            cell: (m) => (
              <span className={clsx('inline-flex items-center gap-2 font-medium', m.upcoming && 'text-muted')}>
                {m.moduleNumber}. {m.name}
                {m.upcoming && (
                  <span className="badge bg-canvas text-muted">Próximo</span>
                )}
              </span>
            ),
          },
          {
            header: 'Fecha',
            cell: (m) => (
              <span className={clsx(m.upcoming && 'text-muted')}>{m.date ? formatDate(m.date) : '-'}</span>
            ),
          },
          {
            header: 'Asistieron',
            align: 'center',
            cell: (m) => countButton(m, 'attended', m.attended, `de ${m.students}`),
          },
          { header: 'Pago completo', align: 'center', cell: (m) => countButton(m, 'full', m.paidFull) },
          { header: 'Abono parcial', align: 'center', cell: (m) => countButton(m, 'partial', m.paidPartial) },
          { header: 'Sin pago', align: 'center', cell: (m) => countButton(m, 'none', m.paidNone) },
        ]}
      />

      <Modal
        open={!!detail && !!detailModule}
        title={
          detail && detailModule
            ? `${DETAIL_TITLES[detail.kind]} · ${detailModule.moduleNumber}. ${detailModule.name}`
            : ''
        }
        onClose={() => setDetail(null)}
      >
        <p className="mb-3 text-sm text-muted">
          {detailPeople.length} {detailPeople.length === 1 ? 'persona' : 'personas'}
        </p>
        <ul className="divide-y divide-line/40">
          {detailPeople.map((p) => (
            <li key={p.studentId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <Link
                to={`/students/${p.studentId}`}
                className="min-w-0 truncate font-medium text-petrol-600 hover:underline"
                onClick={() => setDetail(null)}
              >
                {p.fullName}
              </Link>
              <span className="shrink-0 text-right">
                <span className="block">
                  {money(p.paid)} <span className="text-muted">de {money(p.price)}</span>
                </span>
                {p.balance > 0 && (
                  <span className="block text-xs text-red-600">Debe {money(p.balance)}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
