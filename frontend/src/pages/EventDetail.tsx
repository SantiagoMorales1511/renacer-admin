import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatDate, EVENT_STATUS_LABELS } from '../utils/format';
import type { OneDayEvent } from '../types';

const EVENT_STATUSES = ['SCHEDULED', 'DONE', 'CANCELLED'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => (await api.get<OneDayEvent>(`/events/${id}`)).data,
  });

  const save = useMutation({
    mutationFn: async (payload: any) => (await api.patch(`/events/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      setOpen(false);
    },
  });

  if (isLoading || !event) return <p className="text-muted">Cargando...</p>;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
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
      <PageHeader
        title={event.title}
        subtitle={formatDate(event.date)}
        action={
          <div className="flex items-center gap-2">
            <Badge status={event.status} label={EVENT_STATUS_LABELS[event.status]} />
            <button className="btn-ghost" onClick={() => setOpen(true)}>
              <Pencil size={16} /> Editar
            </button>
          </div>
        }
      />

      <div className="mb-4 card p-6">
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Asistentes" value={String(event.attendeesCount)} />
          <Stat label="Personas que constelaron" value={String(event.constellatedCount)} />
        </div>
        {event.observations && (
          <p className="mt-6 border-t border-line pt-4 text-sm text-muted">{event.observations}</p>
        )}
      </div>

      <p className="text-sm text-muted">
        Los ingresos y pagos de este evento se registran desde la pestaña Pagos usando
        "Otro tipo de pago".
      </p>

      <Modal open={open} title="Editar evento" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Título">
            <Input name="title" defaultValue={event.title} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <Input name="date" type="date" defaultValue={event.date?.slice(0, 10)} required />
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={event.status}>
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="N° asistentes">
              <Input name="attendeesCount" type="number" min={0} defaultValue={event.attendeesCount} />
            </Field>
            <Field label="N° que constelaron">
              <Input name="constellatedCount" type="number" min={0} defaultValue={event.constellatedCount} />
            </Field>
          </div>
          <Field label="Observaciones">
            <Textarea name="observations" defaultValue={event.observations ?? ''} />
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
