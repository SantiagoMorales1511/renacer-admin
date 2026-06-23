import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Select } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../store/auth';
import { SessionFormModal } from '../components/calendar/SessionFormModal';
import { formatDate, sessionLabel, sessionSubtitle } from '../utils/format';
import type { AttendanceStatus, Group, OneDayEvent } from '../types';

interface Row {
  studentId: string;
  fullName: string;
  status: AttendanceStatus;
  observation: string;
}

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [rows, setRows] = useState<Row[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => (await api.get(`/sessions/${id}`)).data,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });
  const { data: oneDayEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<OneDayEvent[]>('/events')).data,
  });

  const isOther = !!data && !data.groupId && !!data.title;

  useEffect(() => {
    if (!data?.group?.students) return;
    const attendanceMap = new Map(
      data.attendances.map((a: any) => [a.studentId, a]),
    );
    setRows(
      data.group.students.map((s: any) => {
        const a: any = attendanceMap.get(s.id);
        return {
          studentId: s.id,
          fullName: s.fullName,
          status: (a?.status as AttendanceStatus) ?? 'PRESENT',
          observation: a?.observation ?? '',
        };
      }),
    );
  }, [data]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.post('/attendance', {
          sessionId: id,
          items: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            observation: r.observation || undefined,
          })),
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', id] }),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/sessions/${id}`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', id] }),
  });

  const updateSession = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.patch(`/sessions/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setEditOpen(false);
    },
  });

  const removeSession = useMutation({
    mutationFn: async () => (await api.delete(`/sessions/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/calendar');
    },
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  function setRow(studentId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  }

  const subtitle = sessionSubtitle(data);
  const pageTitle = subtitle ? `${sessionLabel(data)} · ${subtitle}` : sessionLabel(data);

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={formatDate(data.date)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={data.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              className="w-40"
            >
              <option value="SCHEDULED">Programada</option>
              <option value="DONE">Realizada</option>
              <option value="CANCELLED">Cancelada</option>
            </Select>
            <button className="btn-ghost" onClick={() => setEditOpen(true)}>
              <Pencil size={16} /> Editar
            </button>
            {isAdmin && (
              <button
                className="btn-ghost text-red-600"
                onClick={() => {
                  if (confirm('¿Eliminar esta sesión?')) removeSession.mutate();
                }}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
          </div>
        }
      />

      <div className="mb-4 card p-5">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div><p className="text-muted">Estado</p><div className="mt-1"><Badge status={data.status} /></div></div>
          <div><p className="text-muted">Horario</p><p className="mt-1 font-medium">{data.startTime ?? '-'} - {data.endTime ?? ''}</p></div>
          <div><p className="text-muted">Lugar</p><p className="mt-1 font-medium">{data.place ?? '-'}</p></div>
          {!isOther && (
            <div><p className="text-muted">Estudiantes</p><p className="mt-1 font-medium">{data.group?.students?.length ?? 0}</p></div>
          )}
          {isOther && data.notes && (
            <div className="col-span-2 sm:col-span-3"><p className="text-muted">Observaciones</p><p className="mt-1 font-medium">{data.notes}</p></div>
          )}
        </div>
      </div>

      {isOther ? (
        <div className="card p-5">
          <p className="text-sm text-muted">
            Esta sesión no está vinculada a un grupo de formación. No aplica registro de asistencia.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Asistencia</h3>
            <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Guardando...' : 'Guardar asistencia'}
            </button>
          </div>

          <div className="hidden sm:block">
            <Table columns={['Estudiante', 'Asistencia', 'Observación']} empty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.studentId}>
                  <Td className="font-medium">{r.fullName}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRow(r.studentId, { status: 'PRESENT' })}
                        className={`badge ${r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-canvas text-muted'}`}
                      >
                        Asistió
                      </button>
                      <button
                        onClick={() => setRow(r.studentId, { status: 'ABSENT' })}
                        className={`badge ${r.status === 'ABSENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-canvas text-muted'}`}
                      >
                        No asistió
                      </button>
                    </div>
                  </Td>
                  <Td>
                    <input
                      className="input"
                      value={r.observation}
                      onChange={(e) => setRow(r.studentId, { observation: e.target.value })}
                      placeholder="Opcional"
                    />
                  </Td>
                </tr>
              ))}
            </Table>
          </div>

          <div className="space-y-2.5 sm:hidden">
            {rows.length === 0 ? (
              <div className="card px-4 py-10 text-center text-sm text-muted">Sin estudiantes.</div>
            ) : (
              rows.map((r) => (
                <div key={r.studentId} className="card p-4">
                  <p className="font-medium text-ink">{r.fullName}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRow(r.studentId, { status: 'PRESENT' })}
                      className={`rounded-lg py-2 text-sm font-medium transition-colors ${r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-canvas text-muted'}`}
                    >
                      Asistió
                    </button>
                    <button
                      onClick={() => setRow(r.studentId, { status: 'ABSENT' })}
                      className={`rounded-lg py-2 text-sm font-medium transition-colors ${r.status === 'ABSENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-canvas text-muted'}`}
                    >
                      No asistió
                    </button>
                  </div>
                  <input
                    className="input mt-2"
                    value={r.observation}
                    onChange={(e) => setRow(r.studentId, { observation: e.target.value })}
                    placeholder="Observación (opcional)"
                  />
                </div>
              ))
            )}
          </div>

          {save.isSuccess && <p className="mt-2 text-sm text-emerald-600">Asistencia guardada.</p>}
        </>
      )}

      <SessionFormModal
        open={editOpen}
        mode="edit"
        variant={isOther ? 'other' : 'regular'}
        session={data}
        groups={groups}
        oneDayEvents={oneDayEvents}
        isPending={updateSession.isPending}
        onSubmit={(payload) => updateSession.mutate(payload)}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
