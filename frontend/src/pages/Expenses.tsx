import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import { money, formatDate, labelize, EXPENSE_CATEGORIES } from '../utils/format';
import type { Expense, Group } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

export function ExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get<Expense[]>('/expenses')).data,
    enabled: isAdmin,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/expenses', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await api.patch(`/expenses/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/expenses/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      date: form.get('date') || undefined,
      category: form.get('category'),
      description: form.get('description'),
      amount: Number(form.get('amount')),
      groupId: form.get('groupId') || undefined,
    });
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const groupId = form.get('groupId');
    update.mutate({
      id: editing.id,
      data: {
        date: form.get('date') || undefined,
        category: form.get('category'),
        description: form.get('description'),
        amount: Number(form.get('amount')),
        groupId: groupId && groupId !== '' ? groupId : '',
      },
    });
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Registro de egresos operativos"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nuevo gasto
          </button>
        }
      />

      {isAdmin ? (
        <>
          <div className="mb-4 text-sm">
            <span className="text-muted">Total: </span>
            <span className="font-semibold text-red-600">{money(total)}</span>
          </div>
          <DataTable
            breakpoint="md"
            rows={isLoading ? [] : expenses}
            rowKey={(e) => e.id}
            empty="Sin gastos."
            columns={[
              { header: 'Fecha', cell: (e) => formatDate(e.date) },
              { header: 'Categoría', cell: (e) => labelize(e.category) },
              { header: 'Descripción', primary: true, cell: (e) => e.description },
              { header: 'Grupo', cell: (e) => e.group?.name ?? '-' },
              { header: 'Valor', className: 'font-medium', cell: (e) => money(e.amount) },
              {
                header: 'Acciones',
                align: 'right',
                cell: (e) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded-lg p-1.5 text-petrol-600 hover:bg-petrol-50 dark:hover:bg-petrol-950/30"
                      onClick={() => setEditing(e)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        if (confirm('¿Eliminar este gasto?')) remove.mutate(e.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </>
      ) : (
        <div className="card p-6 text-sm text-muted">
          Puedes registrar gastos con el botón superior. El detalle completo de gastos solo está disponible para administradores.
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="w-full max-w-lg overflow-hidden rounded-panel bg-surface shadow-elevated">
            <div className="bg-canvas/50 px-5 py-4">
              <h3 className="text-base font-semibold">Nuevo gasto</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Fecha">
                  <Input name="date" type="date" defaultValue={today()} />
                </Field>
                <Field label="Categoría">
                  <Select name="category" defaultValue="OTRO">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{labelize(c)}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Descripción">
                <Textarea name="description" required />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Valor">
                  <Input name="amount" type="number" min={1} required />
                </Field>
                <Field label="Grupo (opcional)">
                  <Select name="groupId" defaultValue="">
                    <option value="">Ninguno</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={create.isPending}>
                  {create.isPending ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal open={!!editing} title="Editar gasto" onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Fecha">
                <Input name="date" type="date" defaultValue={editing.date.slice(0, 10)} />
              </Field>
              <Field label="Categoría">
                <Select name="category" defaultValue={editing.category}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{labelize(c)}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Descripción">
              <Textarea name="description" required defaultValue={editing.description} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Valor">
                <Input name="amount" type="number" min={1} required defaultValue={editing.amount} />
              </Field>
              <Field label="Grupo (opcional)">
                <Select name="groupId" defaultValue={editing.groupId ?? ''}>
                  <option value="">Ninguno</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={update.isPending}>
                {update.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
