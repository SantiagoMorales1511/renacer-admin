import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { api } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Field, Input, Select, Textarea } from '../ui/Form';
import { formatDate } from '../../utils/format';
import type { ClassSession, Group, GroupModule, OneDayEvent } from '../../types';

export type SessionVariant = 'regular' | 'other';

function toDateInput(value?: string | null) {
  if (!value) return '';
  return format(parseISO(value), 'yyyy-MM-dd');
}

export function SessionFormModal({
  open,
  mode,
  variant,
  session,
  defaultDate,
  groups,
  oneDayEvents,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  variant: SessionVariant;
  session?: ClassSession | null;
  defaultDate?: string;
  groups: Group[];
  oneDayEvents: OneDayEvent[];
  isPending: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(session?.groupId ?? '');

  const { data: modules = [] } = useQuery({
    queryKey: ['group', selectedGroupId, 'modules'],
    queryFn: async () =>
      (await api.get<GroupModule[]>(`/groups/${selectedGroupId}/modules`)).data,
    enabled: open && !!selectedGroupId,
  });

  const dateValue = mode === 'edit' ? toDateInput(session?.date) : defaultDate ?? '';

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (variant === 'regular') {
      onSubmit({
        groupId: form.get('groupId'),
        groupModuleId: form.get('groupModuleId'),
        date: form.get('date'),
        startTime: form.get('startTime') || undefined,
        endTime: form.get('endTime') || undefined,
        place: form.get('place') || undefined,
      });
    } else {
      const eventId = form.get('oneDayEventId');
      onSubmit({
        title: form.get('title'),
        date: form.get('date'),
        startTime: form.get('startTime') || undefined,
        endTime: form.get('endTime') || undefined,
        place: form.get('place') || undefined,
        notes: form.get('notes') || undefined,
        oneDayEventId: eventId && eventId !== '' ? eventId : undefined,
      });
    }
  }

  const title =
    mode === 'edit'
      ? variant === 'regular'
        ? 'Editar sesión'
        : 'Editar evento'
      : variant === 'regular'
        ? 'Nueva sesión'
        : 'Agregar otro tipo de sesión';

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {variant === 'regular' ? (
          <>
            <Field label="Grupo">
              <Select
                name="groupId"
                required
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Módulo">
              <Select
                name="groupModuleId"
                required
                defaultValue={session?.groupModuleId ?? ''}
                disabled={!selectedGroupId}
              >
                <option value="" disabled>
                  {selectedGroupId ? 'Selecciona' : 'Elige un grupo primero'}
                </option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.moduleNumber}. {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Para actividades que no son clase de formación: constelaciones, talleres especiales u
              otros eventos.
            </p>
            <Field label="Título">
              <Input
                name="title"
                required
                defaultValue={session?.title ?? ''}
                placeholder="Ej: Constelación, taller especial, evento"
              />
            </Field>
            <Field label="Relacionar a una constelación (opcional)">
              <Select name="oneDayEventId" defaultValue={session?.oneDayEventId ?? ''}>
                <option value="">Ninguna</option>
                {oneDayEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {formatDate(ev.date)} — {ev.title}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Fecha">
            <Input name="date" type="date" required defaultValue={dateValue} />
          </Field>
          <Field label="Inicio">
            <Input name="startTime" type="time" defaultValue={session?.startTime ?? ''} />
          </Field>
          <Field label="Fin">
            <Input name="endTime" type="time" defaultValue={session?.endTime ?? ''} />
          </Field>
        </div>

        <Field label="Lugar">
          <Input name="place" placeholder="Salón A" defaultValue={session?.place ?? ''} />
        </Field>

        {variant === 'other' && (
          <Field label="Observaciones">
            <Textarea name="notes" defaultValue={session?.notes ?? ''} />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
