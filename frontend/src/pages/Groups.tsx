import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import { PROGRAM_TYPE_LABELS } from '../utils/format';
import type { Group, Program } from '../types';

const STATUSES = ['ACTIVE', 'PAUSED', 'FINISHED'];

export function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await api.get<Program[]>('/programs')).data,
  });

  const groupPrograms = programs.filter((p) => p.type !== 'ONE_DAY_CONSTELLATION_EVENT');

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return (await api.patch(`/groups/${editing.id}`, payload)).data;
      return (await api.post('/groups', payload)).data;
    },
    onSuccess: (created: Group, _vars, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      const wasEditing = !!editing;
      setOpen(false);
      setEditing(null);
      if (!wasEditing && created?.id) {
        navigate(`/groups/${created.id}?tab=modules`);
      }
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/groups/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(group: Group) {
    setEditing(group);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload: any = {
      programId: form.get('programId'),
      name: form.get('name'),
      cohort: form.get('cohort') || undefined,
      startDate: form.get('startDate') || undefined,
      status: form.get('status'),
      notes: form.get('notes') || undefined,
    };
    if (!editing) {
      payload.autoCreateModules = form.get('autoCreateModules') === 'on';
      const price = form.get('defaultModulePrice');
      if (price) payload.defaultModulePrice = Number(price);
    }
    save.mutate(payload);
  }

  return (
    <div>
      <PageHeader
        title="Grupos"
        subtitle="Cohortes y estado de cada grupo"
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} /> Nuevo grupo
          </button>
        }
      />

      <Table columns={['Nombre', 'Programa', 'Cohorte', 'Estudiantes', 'Sesiones', 'Estado', '']} empty={!isLoading && groups.length === 0}>
        {groups.map((g) => (
          <tr key={g.id}>
            <Td>
              <Link to={`/groups/${g.id}`} className="font-medium text-petrol-600 hover:underline">
                {g.name}
              </Link>
            </Td>
            <Td className="text-muted">{g.program ? PROGRAM_TYPE_LABELS[g.program.type] : '-'}</Td>
            <Td>{g.cohort ?? '-'}</Td>
            <Td>{g._count?.students ?? 0}</Td>
            <Td>{g._count?.sessions ?? 0}</Td>
            <Td><Badge status={g.status} /></Td>
            <Td className="text-right">
              <div className="flex justify-end gap-1">
                <button className="rounded-md p-1.5 text-muted hover:bg-canvas" onClick={() => openEdit(g)}>
                  <Pencil size={16} />
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      if (confirm(`¿Eliminar el grupo ${g.name}?`)) remove.mutate(g.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <Modal
        open={open}
        title={editing ? 'Editar grupo' : 'Nuevo grupo'}
        onClose={() => setOpen(false)}
      >
        <form id="group-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Programa">
            <Select name="programId" defaultValue={editing?.programId ?? groupPrograms[0]?.id ?? ''} required>
              {groupPrograms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre">
            <Input name="name" defaultValue={editing?.name} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cohorte">
              <Input name="cohort" defaultValue={editing?.cohort ?? ''} placeholder="2026-1" />
            </Field>
            <Field label="Fecha de inicio">
              <Input name="startDate" type="date" defaultValue={editing?.startDate?.slice(0, 10) ?? ''} />
            </Field>
          </div>
          <Field label="Estado">
            <Select name="status" defaultValue={editing?.status ?? 'ACTIVE'}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea name="notes" defaultValue={editing?.notes ?? ''} />
          </Field>
          {!editing && (
            <div className="space-y-3 rounded-lg border border-line bg-canvas/50 p-3">
              <Field label="Precio base por módulo">
                <Input name="defaultModulePrice" type="number" min={0} defaultValue={300000} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="autoCreateModules" defaultChecked className="h-4 w-4" />
                Crear módulos automáticamente según la formación
              </label>
              <p className="text-xs text-muted">
                Constelaciones genera 11 módulos y Biodescodificación 6. Podrás editarlos después.
              </p>
            </div>
          )}
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
