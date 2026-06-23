import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Ban, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import {
  formatDate,
  money,
  PROGRAM_TYPE_LABELS,
  ATTENDANCE_MATRIX_LABELS,
  MODULE_STATUS_LABELS,
} from '../utils/format';
import type { AttendanceMatrix, AttendanceMatrixStatus, GroupModule } from '../types';

type Tab = 'summary' | 'modules' | 'matrix';

export function GroupDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab: Tab = searchParams.get('tab') === 'modules' ? 'modules' : 'summary';
  const [tab, setTab] = useState<Tab>(initialTab);

  const { data, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => (await api.get(`/groups/${id}`)).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <PageHeader
        title={data.name}
        subtitle={data.program ? PROGRAM_TYPE_LABELS[data.program.type] : data.cohort ? `Cohorte ${data.cohort}` : undefined}
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabButton active={tab === 'summary'} onClick={() => setTab('summary')} short="Resumen">
          Resumen
        </TabButton>
        <TabButton active={tab === 'modules'} onClick={() => setTab('modules')} short="Módulos">
          Módulos del grupo
        </TabButton>
        <TabButton active={tab === 'matrix'} onClick={() => setTab('matrix')} short="Matriz">
          Matriz de asistencia
        </TabButton>
      </div>

      {tab === 'summary' && <Summary data={data} />}
      {tab === 'modules' && <GroupModulesView groupId={id!} />}
      {tab === 'matrix' && <AttendanceMatrixView groupId={id!} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  short,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  short: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        '-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-petrol-600 text-petrol-700 dark:border-petrol-400 dark:text-petrol-300'
          : 'border-transparent text-muted hover:text-ink',
      )}
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function Summary({ data }: { data: any }) {
  return (
    <div>
      <div className="mb-4 card p-5">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted">Programa</p>
            <p className="mt-1 font-medium">{data.program?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-muted">Estado</p>
            <div className="mt-1"><Badge status={data.status} /></div>
          </div>
          <div>
            <p className="text-muted">Inicio</p>
            <p className="mt-1 font-medium">{formatDate(data.startDate)}</p>
          </div>
          <div>
            <p className="text-muted">Estudiantes</p>
            <p className="mt-1 font-medium">{data.students.length}</p>
          </div>
        </div>
        {data.notes && <p className="mt-4 text-sm text-muted">{data.notes}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Estudiantes</h3>
          <Table columns={['Nombre', 'Estado']} empty={data.students.length === 0}>
            {data.students.map((s: any) => (
              <tr key={s.id}>
                <Td>
                  <Link to={`/students/${s.id}`} className="font-medium text-petrol-600 hover:underline">
                    {s.fullName}
                  </Link>
                </Td>
                <Td><Badge status={s.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Sesiones</h3>
          <Table columns={['Fecha', 'Módulo', 'Estado']} empty={data.sessions.length === 0}>
            {data.sessions.map((s: any) => (
              <tr key={s.id}>
                <Td>
                  <Link to={`/sessions/${s.id}`} className="text-petrol-600 hover:underline">
                    {formatDate(s.date)}
                  </Link>
                </Td>
                <Td>{s.groupModule?.name}</Td>
                <Td><Badge status={s.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}

function GroupModulesView({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GroupModule | null>(null);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['group', groupId, 'modules'],
    queryFn: async () => (await api.get<GroupModule[]>(`/groups/${groupId}/modules`)).data,
  });

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return (await api.patch(`/group-modules/${editing.id}`, payload)).data;
      return (await api.post('/group-modules', { ...payload, groupId })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['group-modules-tree'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (m: GroupModule) =>
      (await api.patch(`/group-modules/${m.id}`, { status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['group-modules-tree'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/group-modules/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['group-modules-tree'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? 'No se pudo eliminar el módulo.');
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      name: form.get('name'),
      moduleNumber: Number(form.get('moduleNumber')),
      price: Number(form.get('price')) || 0,
      date: form.get('date') ? form.get('date') : null,
      description: form.get('description') || undefined,
      status: form.get('status'),
    });
  }

  function canDelete(m: GroupModule) {
    const c = m.counts;
    return !c || (c.sessions === 0 && c.payments === 0 && c.attendances === 0);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Módulos del grupo</h3>
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={16} /> Agregar módulo
        </button>
      </div>

      {modules.some((m) => m.date) && (
        <div className="mb-4 card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays size={16} className="text-emerald-500" />
            Fechas de módulos
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {modules
              .filter((m) => m.date)
              .map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg bg-canvas px-3 py-2',
                    m.status === 'INACTIVE' && 'opacity-50',
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {m.moduleNumber}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{m.name}</span>
                    <span className="block text-xs text-muted">{formatDate(m.date!)}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <DataTable
        breakpoint="lg"
        rows={isLoading ? [] : modules}
        rowKey={(m) => m.id}
        empty="Sin módulos."
        columns={[
          { header: '#', cell: (m) => m.moduleNumber },
          { header: 'Nombre', primary: true, className: 'font-medium', cell: (m) => m.name },
          { header: 'Fecha', cell: (m) => (m.date ? formatDate(m.date) : '-') },
          { header: 'Precio', cell: (m) => money(m.price) },
          {
            header: 'Estado',
            cell: (m) => <Badge status={m.status} label={MODULE_STATUS_LABELS[m.status]} />,
          },
          { header: 'Sesiones', hideOnMobile: true, cell: (m) => m.counts?.sessions ?? 0 },
          { header: 'Pagos', hideOnMobile: true, cell: (m) => m.counts?.payments ?? 0 },
          { header: 'Asistencias', hideOnMobile: true, cell: (m) => m.counts?.attendances ?? 0 },
          {
            header: 'Acciones',
            align: 'right',
            cell: (m) => (
              <div className="flex justify-end gap-1">
                <button
                  className="rounded-lg p-1.5 text-muted hover:bg-canvas"
                  title="Editar"
                  onClick={() => {
                    setEditing(m);
                    setOpen(true);
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="rounded-lg p-1.5 text-muted hover:bg-canvas"
                  title={m.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  onClick={() => toggleStatus.mutate(m)}
                >
                  <Ban size={16} />
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    className={clsx(
                      'rounded-lg p-1.5',
                      canDelete(m)
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'cursor-not-allowed text-muted/40',
                    )}
                    title={canDelete(m) ? 'Eliminar' : 'No se puede eliminar: tiene registros asociados'}
                    disabled={!canDelete(m)}
                    onClick={() => {
                      if (confirm(`¿Eliminar ${m.name}?`)) remove.mutate(m.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editing ? 'Editar módulo' : 'Agregar módulo'}
        onClose={() => { setOpen(false); setEditing(null); }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Número">
              <Input name="moduleNumber" type="number" min={1} defaultValue={editing?.moduleNumber ?? modules.length + 1} required />
            </Field>
            <Field label="Precio">
              <Input name="price" type="number" min={0} defaultValue={editing?.price ?? 300000} />
            </Field>
          </div>
          <Field label="Nombre">
            <Input name="name" defaultValue={editing?.name ?? `Módulo ${modules.length + 1}`} required />
          </Field>
          <Field label="Fecha (sábado)">
            <Input name="date" type="date" defaultValue={editing?.date?.slice(0, 10) ?? ''} />
          </Field>
          <Field label="Descripción">
            <Textarea name="description" defaultValue={editing?.description ?? ''} />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={editing?.status ?? 'ACTIVE'}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const CELL_STYLES: Record<AttendanceMatrixStatus, string> = {
  ASISTIO_PAGO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ASISTIO_NO_PAGO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  NO_ASISTIO_PAGO: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  NO_ASISTIO_NO_PAGO: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SIN_REGISTRO: 'text-muted',
};

const MATRIX_LEGEND: AttendanceMatrixStatus[] = [
  'ASISTIO_PAGO',
  'ASISTIO_NO_PAGO',
  'NO_ASISTIO_PAGO',
  'NO_ASISTIO_NO_PAGO',
  'SIN_REGISTRO',
];

function AttendanceMatrixView({ groupId }: { groupId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['group', groupId, 'attendance-matrix'],
    queryFn: async () =>
      (await api.get<AttendanceMatrix>(`/groups/${groupId}/attendance-matrix`)).data,
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  if (data.modules.length === 0) {
    return <div className="card px-4 py-10 text-center text-sm text-muted">El programa no tiene módulos.</div>;
  }
  if (data.rows.length === 0) {
    return <div className="card px-4 py-10 text-center text-sm text-muted">El grupo no tiene estudiantes.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MATRIX_LEGEND.map((status) => (
          <span
            key={status}
            className={clsx(
              'inline-flex rounded-md px-2 py-1 text-xs font-medium',
              CELL_STYLES[status],
              status === 'SIN_REGISTRO' && 'bg-canvas',
            )}
          >
            {ATTENDANCE_MATRIX_LABELS[status]}
          </span>
        ))}
      </div>

      <div className="hidden card overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-canvas/50">
              <th className="sticky left-0 z-10 bg-canvas px-4 py-3 text-left font-medium text-muted">
                Estudiante
              </th>
              {data.modules.map((m) => (
                <th
                  key={m.id}
                  className="whitespace-nowrap px-3 py-3 text-center font-medium text-muted"
                  title={m.name}
                >
                  M{m.number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {data.rows.map((row) => (
              <tr key={row.studentId}>
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 font-medium text-ink">
                  <Link to={`/students/${row.studentId}`} className="hover:underline">
                    {row.fullName}
                  </Link>
                </td>
                {row.cells.map((cell) => (
                  <td key={cell.moduleId} className="px-3 py-2.5 text-center">
                    <span
                      className={clsx(
                        'inline-flex min-w-[140px] justify-center rounded-md px-2 py-1 text-xs font-medium',
                        CELL_STYLES[cell.status],
                        cell.status === 'SIN_REGISTRO' && 'bg-canvas',
                      )}
                    >
                      {ATTENDANCE_MATRIX_LABELS[cell.status]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2.5 lg:hidden">
        {data.rows.map((row) => {
          const moduleName = (id: string) => data.modules.find((m) => m.id === id);
          return (
            <div key={row.studentId} className="card p-4">
              <Link
                to={`/students/${row.studentId}`}
                className="font-medium text-petrol-600 hover:underline"
              >
                {row.fullName}
              </Link>
              <ul className="mt-3 space-y-1.5">
                {row.cells.map((cell) => {
                  const m = moduleName(cell.moduleId);
                  return (
                    <li key={cell.moduleId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-muted">
                        M{m?.number} {m?.name ? `· ${m.name}` : ''}
                      </span>
                      <span
                        className={clsx(
                          'inline-flex shrink-0 justify-center rounded-md px-2 py-1 text-xs font-medium',
                          CELL_STYLES[cell.status],
                          cell.status === 'SIN_REGISTRO' && 'bg-canvas',
                        )}
                      >
                        {ATTENDANCE_MATRIX_LABELS[cell.status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
