import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select } from '../components/ui/Form';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import type { User } from '../types';

export function UsersPage() {
  const { user: current } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  });

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/users', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await api.patch(`/users/${id}`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      role: form.get('role'),
      canRegisterExpenses: form.get('canRegisterExpenses') === 'on',
      canViewOtherDays: form.get('canViewOtherDays') === 'on',
    });
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas, roles y permisos"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nuevo usuario
          </button>
        }
      />

      <DataTable
        breakpoint="md"
        rows={isLoading ? [] : users}
        rowKey={(u) => u.id}
        empty="Sin usuarios."
        columns={[
          { header: 'Nombre', primary: true, className: 'font-medium', cell: (u) => u.name },
          { header: 'Correo', cell: (u) => u.email },
          {
            header: 'Rol',
            cell: (u) => (
              <Badge
                label={u.role === 'ADMIN' ? 'Administrador' : 'Asistente'}
                status={u.role === 'ADMIN' ? 'FINISHED' : 'SCHEDULED'}
              />
            ),
          },
          {
            header: 'Registra gastos',
            cell: (u) => (
              <input
                type="checkbox"
                checked={u.canRegisterExpenses}
                disabled={u.role === 'ADMIN'}
                onChange={(e) => update.mutate({ id: u.id, canRegisterExpenses: e.target.checked })}
              />
            ),
          },
          {
            header: 'Otros días',
            cell: (u) => (
              <input
                type="checkbox"
                checked={u.canViewOtherDays}
                disabled={u.role === 'ADMIN'}
                onChange={(e) => update.mutate({ id: u.id, canViewOtherDays: e.target.checked })}
              />
            ),
          },
          {
            header: 'Acciones',
            align: 'right',
            cell: (u) =>
              u.id !== current?.id ? (
                <button
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    if (confirm(`¿Eliminar a ${u.name}?`)) remove.mutate(u.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              ) : null,
          },
        ]}
      />

      <Modal open={open} title="Nuevo usuario" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre">
            <Input name="name" required />
          </Field>
          <Field label="Correo">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Contraseña">
            <Input name="password" type="password" minLength={4} required />
          </Field>
          <Field label="Rol">
            <Select name="role" defaultValue="ASSISTANT">
              <option value="ASSISTANT">Asistente</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </Field>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="canRegisterExpenses" /> Puede registrar gastos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="canViewOtherDays" /> Puede ver otros días en caja
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Guardando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
