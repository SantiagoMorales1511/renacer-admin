import { FormEvent } from 'react';
import { format, parseISO } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Field, Input, Select, Textarea } from '../ui/Form';
import { EVENT_STATUS_LABELS } from '../../utils/format';
import type { OneDayEvent } from '../../types';

function toDateInput(value?: string | null) {
  if (!value) return '';
  return format(parseISO(value), 'yyyy-MM-dd');
}

export function EventFormModal({
  open,
  event,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean;
  event: OneDayEvent | null;
  isPending: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  if (!event) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      title: form.get('title'),
      date: form.get('date'),
      attendeesCount: Number(form.get('attendeesCount')) || 0,
      constellatedCount: Number(form.get('constellatedCount')) || 0,
      observations: form.get('observations') || undefined,
      status: form.get('status'),
    });
  }

  return (
    <Modal open={open} title="Editar constelación" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título">
          <Input name="title" required defaultValue={event.title} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Fecha">
            <Input name="date" type="date" required defaultValue={toDateInput(event.date)} />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={event.status}>
              {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Asistentes">
            <Input
              name="attendeesCount"
              type="number"
              min={0}
              defaultValue={event.attendeesCount}
            />
          </Field>
          <Field label="Constelados">
            <Input
              name="constellatedCount"
              type="number"
              min={0}
              defaultValue={event.constellatedCount}
            />
          </Field>
        </div>
        <Field label="Observaciones">
          <Textarea name="observations" defaultValue={event.observations ?? ''} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
