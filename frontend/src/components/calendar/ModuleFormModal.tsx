import { FormEvent } from 'react';
import { format, parseISO } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Field, Input, Select, Textarea } from '../ui/Form';
import { MODULE_STATUS_LABELS } from '../../utils/format';
import type { GroupModule } from '../../types';

function toDateInput(value?: string | null) {
  if (!value) return '';
  return format(parseISO(value), 'yyyy-MM-dd');
}

export function ModuleFormModal({
  open,
  module,
  isPending,
  onSubmit,
  onClearDate,
  onClose,
}: {
  open: boolean;
  module: GroupModule | null;
  isPending: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onClearDate: () => void;
  onClose: () => void;
}) {
  if (!module) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      name: form.get('name'),
      moduleNumber: Number(form.get('moduleNumber')) || undefined,
      price: form.get('price') ? Number(form.get('price')) : undefined,
      date: form.get('date') || null,
      description: form.get('description') || undefined,
      status: form.get('status'),
    });
  }

  return (
    <Modal
      open={open}
      title="Editar módulo"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input name="name" required defaultValue={module.name} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Número">
            <Input name="moduleNumber" type="number" min={1} defaultValue={module.moduleNumber} />
          </Field>
          <Field label="Precio">
            <Input name="price" type="number" min={0} defaultValue={module.price} />
          </Field>
        </div>
        <Field label="Fecha">
          <Input name="date" type="date" defaultValue={toDateInput(module.date)} />
        </Field>
        <Field label="Estado">
          <Select name="status" defaultValue={module.status}>
            {Object.entries(MODULE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Descripción">
          <Textarea name="description" defaultValue={module.description ?? ''} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {module.date ? (
            <button type="button" className="btn-ghost text-red-600" onClick={onClearDate}>
              Quitar fecha
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
