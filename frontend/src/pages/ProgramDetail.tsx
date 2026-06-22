import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import {
  formatDate,
  money,
  PROGRAM_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  MODULE_STATUS_LABELS,
} from '../utils/format';
import type { OneDayEvent, Program, ProgramModuleTemplate } from '../types';

const GROUP_STATUSES = ['ACTIVE', 'PAUSED', 'FINISHED'];
const EVENT_STATUSES = ['SCHEDULED', 'DONE', 'CANCELLED'];

export function ProgramDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: async () => (await api.get<Program>(`/programs/${id}`)).data,
  });

  const [groupOpen, setGroupOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProgramModuleTemplate | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OneDayEvent | null>(null);

  const saveGroup = useMutation({
    mutationFn: async (payload: any) => (await api.post('/groups', payload)).data,
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setGroupOpen(false);
      if (created?.id) navigate(`/groups/${created.id}?tab=modules`);
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (payload: any) => {
      if (editingTemplate) return (await api.patch(`/program-module-templates/${editingTemplate.id}`, payload)).data;
      return (await api.post(`/programs/${id}/module-templates`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      setTemplateOpen(false);
      setEditingTemplate(null);
    },
  });

  const removeTemplate = useMutation({
    mutationFn: async (templateId: string) => (await api.delete(`/program-module-templates/${templateId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program', id] }),
  });

  const saveEvent = useMutation({
    mutationFn: async (payload: any) => {
      if (editingEvent) return (await api.patch(`/events/${editingEvent.id}`, payload)).data;
      return (await api.post('/events', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      setEventOpen(false);
      setEditingEvent(null);
    },
  });

  if (isLoading || !program) return <p className="text-muted">Cargando...</p>;

  const isEvent = program.type === 'ONE_DAY_CONSTELLATION_EVENT';

  function handleGroupSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveGroup.mutate({
      programId: id,
      name: form.get('name'),
      cohort: form.get('cohort') || undefined,
      startDate: form.get('startDate') || undefined,
      status: form.get('status'),
      notes: form.get('notes') || undefined,
      autoCreateModules: form.get('autoCreateModules') === 'on',
      defaultModulePrice: form.get('defaultModulePrice') ? Number(form.get('defaultModulePrice')) : undefined,
    });
  }

  function handleTemplateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveTemplate.mutate({
      moduleNumber: Number(form.get('moduleNumber')),
      name: form.get('name'),
      defaultPrice: Number(form.get('defaultPrice')) || 0,
      status: form.get('status'),
    });
  }

  function handleEventSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveEvent.mutate({
      programId: id,
      title: form.get('title'),
      date: form.get('date'),
      attendeesCount: Number(form.get('attendeesCount')) || 0,
      constellatedCount: Number(form.get('constellatedCount')) || 0,
      observations: form.get('observations') || undefined,
      status: form.get('status'),
    });
  }

  return (
    <div>
      <PageHeader title={program.name} subtitle={PROGRAM_TYPE_LABELS[program.type]} />

      {isEvent ? (
        <EventsSection
          events={program.events ?? []}
          onNew={() => {
            setEditingEvent(null);
            setEventOpen(true);
          }}
          onEdit={(ev) => {
            setEditingEvent(ev);
            setEventOpen(true);
          }}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Grupos</h3>
              <button className="btn-primary" onClick={() => setGroupOpen(true)}>
                <Plus size={16} /> Nuevo grupo
              </button>
            </div>
            <Table
              columns={['Nombre', 'Cohorte', 'Estudiantes', 'Sesiones', 'Estado']}
              empty={(program.groups ?? []).length === 0}
            >
              {(program.groups ?? []).map((g) => (
                <tr key={g.id}>
                  <Td>
                    <Link to={`/groups/${g.id}`} className="font-medium text-petrol-600 hover:underline">
                      {g.name}
                    </Link>
                  </Td>
                  <Td>{g.cohort ?? '-'}</Td>
                  <Td>{g._count?.students ?? 0}</Td>
                  <Td>{g._count?.sessions ?? 0}</Td>
                  <Td><Badge status={g.status} /></Td>
                </tr>
              ))}
            </Table>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Plantillas de módulos</h3>
                <p className="text-xs text-muted">Se copian a cada grupo nuevo. Editar aquí no afecta a los grupos existentes.</p>
              </div>
              {user?.role === 'ADMIN' && (
                <button className="btn-primary" onClick={() => { setEditingTemplate(null); setTemplateOpen(true); }}>
                  <Plus size={16} /> Nueva plantilla
                </button>
              )}
            </div>
            <Table columns={['#', 'Nombre', 'Precio por defecto', 'Estado', '']} empty={(program.moduleTemplates ?? []).length === 0}>
              {(program.moduleTemplates ?? []).map((t: ProgramModuleTemplate) => (
                <tr key={t.id}>
                  <Td>{t.moduleNumber}</Td>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>{money(t.defaultPrice)}</Td>
                  <Td>
                    <Badge status={t.status} label={MODULE_STATUS_LABELS[t.status]} />
                  </Td>
                  <Td className="text-right">
                    {user?.role === 'ADMIN' && (
                      <div className="flex justify-end gap-1">
                        <button
                          className="rounded-md p-1.5 text-muted hover:bg-canvas"
                          onClick={() => { setEditingTemplate(t); setTemplateOpen(true); }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => { if (confirm(`¿Eliminar la plantilla ${t.name}?`)) removeTemplate.mutate(t.id); }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </section>
        </div>
      )}

      <Modal open={groupOpen} title="Nuevo grupo" onClose={() => setGroupOpen(false)}>
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <Field label="Nombre">
            <Input name="name" required placeholder="Grupo 1" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cohorte">
              <Input name="cohort" placeholder="2026-1" />
            </Field>
            <Field label="Fecha de inicio">
              <Input name="startDate" type="date" />
            </Field>
          </div>
          <Field label="Estado">
            <Select name="status" defaultValue="ACTIVE">
              {GROUP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea name="notes" />
          </Field>
          <div className="space-y-3 rounded-lg border border-line bg-canvas/50 p-3">
            <Field label="Precio base por módulo">
              <Input name="defaultModulePrice" type="number" min={0} defaultValue={300000} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="autoCreateModules" defaultChecked className="h-4 w-4" />
              Crear módulos automáticamente según la formación
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setGroupOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saveGroup.isPending}>
              {saveGroup.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={templateOpen}
        title={editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
        onClose={() => { setTemplateOpen(false); setEditingTemplate(null); }}
      >
        <form onSubmit={handleTemplateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <Input name="moduleNumber" type="number" min={1} defaultValue={editingTemplate?.moduleNumber ?? (program.moduleTemplates?.length ?? 0) + 1} required />
            </Field>
            <Field label="Precio por defecto">
              <Input name="defaultPrice" type="number" min={0} defaultValue={editingTemplate?.defaultPrice ?? 300000} />
            </Field>
          </div>
          <Field label="Nombre">
            <Input name="name" defaultValue={editingTemplate?.name ?? `Módulo ${(program.moduleTemplates?.length ?? 0) + 1}`} required />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={editingTemplate?.status ?? 'ACTIVE'}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => { setTemplateOpen(false); setEditingTemplate(null); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={eventOpen}
        title={editingEvent ? 'Editar evento' : 'Nuevo evento'}
        onClose={() => { setEventOpen(false); setEditingEvent(null); }}
      >
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <Field label="Título">
            <Input name="title" defaultValue={editingEvent?.title} required placeholder="Constelación de un día - Junio" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <Input name="date" type="date" defaultValue={editingEvent?.date?.slice(0, 10)} required />
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={editingEvent?.status ?? 'SCHEDULED'}>
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="N° asistentes">
              <Input name="attendeesCount" type="number" min={0} defaultValue={editingEvent?.attendeesCount ?? 0} />
            </Field>
            <Field label="N° que constelaron">
              <Input name="constellatedCount" type="number" min={0} defaultValue={editingEvent?.constellatedCount ?? 0} />
            </Field>
          </div>
          <p className="text-xs text-muted">
            Los ingresos de constelaciones se registran desde la pestaña Pagos con "Otro tipo de pago".
          </p>
          <Field label="Observaciones">
            <Textarea name="observations" defaultValue={editingEvent?.observations ?? ''} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => { setEventOpen(false); setEditingEvent(null); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saveEvent.isPending}>
              {saveEvent.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function EventsSection({
  events,
  onNew,
  onEdit,
}: {
  events: OneDayEvent[];
  onNew: () => void;
  onEdit: (ev: OneDayEvent) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Eventos</h3>
        <button className="btn-primary" onClick={onNew}>
          <Plus size={16} /> Nuevo evento
        </button>
      </div>
      <Table
        columns={['Fecha', 'Título', 'Asistentes', 'Constelaron', 'Estado', '']}
        empty={events.length === 0}
      >
        {events.map((ev) => (
          <tr key={ev.id}>
            <Td>
              <Link to={`/events/${ev.id}`} className="text-petrol-600 hover:underline">
                {formatDate(ev.date)}
              </Link>
            </Td>
            <Td className="font-medium">{ev.title}</Td>
            <Td>{ev.attendeesCount}</Td>
            <Td>{ev.constellatedCount}</Td>
            <Td><Badge status={ev.status} label={EVENT_STATUS_LABELS[ev.status]} /></Td>
            <Td className="text-right">
              <button className="rounded-md p-1.5 text-muted hover:bg-canvas" onClick={() => onEdit(ev)}>
                <Pencil size={16} />
              </button>
            </Td>
          </tr>
        ))}
      </Table>
    </section>
  );
}
