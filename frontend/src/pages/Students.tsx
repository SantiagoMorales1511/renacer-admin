import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import type { Group, Student } from '../types';

const STATUSES = ['ACTIVE', 'PAUSED', 'WITHDRAWN', 'FINISHED'];

export function StudentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', groupFilter, statusFilter, search],
    queryFn: async () =>
      (
        await api.get<Student[]>('/students', {
          params: {
            groupId: groupFilter || undefined,
            status: statusFilter || undefined,
            search: search || undefined,
          },
        })
      ).data,
  });

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return (await api.patch(`/students/${editing.id}`, payload)).data;
      return (await api.post('/students', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/students/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      fullName: form.get('fullName'),
      phone: form.get('phone') || undefined,
      email: form.get('email') || undefined,
      document: form.get('document') || undefined,
      groupId: form.get('groupId') || undefined,
      status: form.get('status'),
      notes: form.get('notes') || undefined,
    });
  }

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle="Listado e inscripción de estudiantes"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Nuevo estudiante
          </button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input placeholder="Buscar por nombre" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <DataTable
        breakpoint="sm"
        rows={isLoading ? [] : students}
        rowKey={(s) => s.id}
        empty="Sin estudiantes."
        columns={[
          {
            header: 'Nombre',
            primary: true,
            cell: (s) => (
              <Link to={`/students/${s.id}`} className="font-medium text-petrol-600 hover:underline">
                {s.fullName}
              </Link>
            ),
          },
          { header: 'Grupo', cell: (s) => s.group?.name ?? '-' },
          { header: 'Celular', cell: (s) => s.phone ?? '-' },
          { header: 'Estado', cell: (s) => <Badge status={s.status} /> },
          {
            header: 'Acciones',
            align: 'right',
            cell: (s) => (
              <div className="flex justify-end gap-1">
                <button
                  className="rounded-lg p-1.5 text-muted hover:bg-canvas"
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                >
                  <Pencil size={16} />
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${s.fullName}?`)) remove.mutate(s.id);
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

      <Modal open={open} title={editing ? 'Editar estudiante' : 'Nuevo estudiante'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo">
            <Input name="fullName" defaultValue={editing?.fullName} required />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Celular">
              <Input name="phone" defaultValue={editing?.phone ?? ''} />
            </Field>
            <Field label="Documento">
              <Input name="document" defaultValue={editing?.document ?? ''} />
            </Field>
          </div>
          <Field label="Correo">
            <Input name="email" type="email" defaultValue={editing?.email ?? ''} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Grupo">
              <Select name="groupId" defaultValue={editing?.groupId ?? ''}>
                <option value="">Sin grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={editing?.status ?? 'ACTIVE'}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notas">
            <Textarea name="notes" defaultValue={editing?.notes ?? ''} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
