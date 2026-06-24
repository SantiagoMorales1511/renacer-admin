import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Combobox } from '../components/ui/Combobox';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import { money, formatDate, labelize, PAYMENT_METHODS } from '../utils/format';
import type { GroupModule, OneDayEvent, Payment, Student } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

export function PaymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [editing, setEditing] = useState<Payment | null>(null);
  const [editStudentId, setEditStudentId] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', from, to],
    queryFn: async () =>
      (await api.get<Payment[]>('/payments', { params: { from: from || undefined, to: to || undefined } })).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await api.get<Student[]>('/students')).data,
  });

  const selectedGroupId = students.find((s) => s.id === selectedStudentId)?.groupId ?? '';
  const { data: modules = [] } = useQuery({
    queryKey: ['group', selectedGroupId, 'modules'],
    queryFn: async () => (await api.get<GroupModule[]>(`/groups/${selectedGroupId}/modules`)).data,
    enabled: !!selectedGroupId,
  });

  const { data: studentDetail } = useQuery({
    queryKey: ['student', selectedStudentId],
    queryFn: async () => (await api.get(`/students/${selectedStudentId}`)).data,
    enabled: !!selectedStudentId && open,
  });

  const selectedModuleSummary = studentDetail?.moduleSummary?.find(
    (m: { moduleId: string }) => m.moduleId === selectedModuleId,
  );

  const editGroupId = students.find((s) => s.id === editStudentId)?.groupId ?? '';
  const { data: editModules = [] } = useQuery({
    queryKey: ['group', editGroupId, 'modules'],
    queryFn: async () => (await api.get<GroupModule[]>(`/groups/${editGroupId}/modules`)).data,
    enabled: !!editGroupId,
  });

  const { data: oneDayEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<OneDayEvent[]>('/events')).data,
  });

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payments', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['cartera'] });
      setOpen(false);
      setSelectedModuleId('');
    },
  });

  const createOther = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payments', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOtherOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await api.patch(`/payments/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/payments/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const student = students.find((s) => s.id === selectedStudentId);
    create.mutate({
      studentId: selectedStudentId,
      groupId: student?.groupId || undefined,
      groupModuleId: form.get('groupModuleId'),
      amount: Number(form.get('amount')),
      method: form.get('method'),
      paidAt: form.get('paidAt') || undefined,
      observation: form.get('observation') || undefined,
    });
  }

  function openEdit(p: Payment) {
    setEditing(p);
    setEditStudentId(p.studentId ?? '');
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const isOther = !editing.studentId;
    const base = {
      amount: Number(form.get('amount')),
      method: form.get('method'),
      paidAt: form.get('paidAt') || undefined,
      observation: form.get('observation') || '',
    };
    if (isOther) {
      const eventId = form.get('oneDayEventId');
      update.mutate({
        id: editing.id,
        data: {
          ...base,
          concept: form.get('concept'),
          oneDayEventId: eventId && eventId !== '' ? eventId : '',
        },
      });
    } else {
      const student = students.find((s) => s.id === editStudentId);
      update.mutate({
        id: editing.id,
        data: {
          ...base,
          studentId: editStudentId,
          groupId: student?.groupId || '',
          groupModuleId: form.get('groupModuleId') || '',
        },
      });
    }
  }

  function handleOtherSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const eventId = form.get('oneDayEventId');
    createOther.mutate({
      concept: form.get('concept'),
      amount: Number(form.get('amount')),
      method: form.get('method'),
      paidAt: form.get('paidAt') || undefined,
      observation: form.get('observation') || undefined,
      oneDayEventId: eventId && eventId !== '' ? eventId : undefined,
    });
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Pagos"
        subtitle="Registro de pagos y pagos parciales"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => { setSelectedStudentId(''); setOpen(true); }}>
              <Plus size={16} /> Registrar pago
            </button>
            <button className="btn-ghost" onClick={() => setOtherOpen(true)}>
              <Sparkles size={16} /> Agregar otro tipo de pago
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Desde">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <div className="ml-auto text-sm">
          <span className="text-muted">Total filtrado: </span>
          <span className="font-semibold text-petrol-600">{money(total)}</span>
        </div>
      </div>

      <DataTable
        breakpoint="lg"
        rows={isLoading ? [] : payments}
        rowKey={(p) => p.id}
        empty="Sin pagos registrados."
        columns={[
          { header: 'Fecha', cell: (p) => formatDate(p.paidAt) },
          {
            header: 'Estudiante',
            primary: true,
            className: 'font-medium',
            cell: (p) =>
              p.student?.fullName ?? (
                <span className="inline-flex items-center gap-1.5">
                  {p.concept || 'Otro ingreso'}
                  <span className="badge bg-petrol-100 text-petrol-700 dark:bg-petrol-500/15 dark:text-petrol-300">
                    Otro
                  </span>
                </span>
              ),
          },
          { header: 'Grupo', hideOnMobile: true, cell: (p) => p.group?.name ?? '-' },
          { header: 'Módulo', hideOnMobile: true, cell: (p) => p.groupModule?.name ?? '-' },
          {
            header: 'Constelación',
            hideOnMobile: true,
            className: 'text-muted',
            cell: (p) =>
              p.oneDayEvent ? (
                <span title={p.oneDayEvent.title}>
                  {formatDate(p.oneDayEvent.date)} — {p.oneDayEvent.title}
                </span>
              ) : (
                '-'
              ),
          },
          { header: 'Método', cell: (p) => labelize(p.method) },
          { header: 'Valor', className: 'font-medium', cell: (p) => money(p.amount) },
          {
            header: 'Acciones',
            align: 'right',
            cell: (p) =>
              user?.role === 'ADMIN' ? (
                <div className="flex items-center justify-end gap-1">
                  <button
                    className="rounded-lg p-1.5 text-petrol-600 hover:bg-petrol-50 dark:hover:bg-petrol-950/30"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      if (confirm('¿Eliminar este pago?')) remove.mutate(p.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : null,
          },
        ]}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="w-full max-w-lg overflow-hidden rounded-panel bg-surface shadow-elevated">
            <div className="bg-canvas/50 px-5 py-4">
              <h3 className="text-base font-semibold">Registrar pago</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <Field label="Estudiante">
                <Combobox
                  options={students.map((s) => ({ value: s.id, label: s.fullName }))}
                  value={selectedStudentId}
                  onChange={(id) => {
                    setSelectedStudentId(id);
                    setSelectedModuleId('');
                  }}
                  placeholder="Selecciona"
                  searchPlaceholder="Escribe el nombre del estudiante..."
                  emptyText="No se encontró ningún estudiante"
                />
              </Field>
              <Field label="Módulo">
                <Select
                  name="groupModuleId"
                  required
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  disabled={!selectedGroupId}
                >
                  <option value="" disabled>
                    {!selectedStudentId ? 'Elige un estudiante primero' : selectedGroupId ? 'Selecciona' : 'El estudiante no tiene grupo'}
                  </option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.moduleNumber}. {m.name} — {money(m.price)}</option>
                  ))}
                </Select>
              </Field>
              {selectedModuleSummary && (
                <p className="text-sm text-muted">
                  Precio: {money(selectedModuleSummary.baseValue)} · Pagado: {money(selectedModuleSummary.paid)} · Saldo:{' '}
                  <span className={selectedModuleSummary.balance > 0 ? 'font-medium text-red-600' : ''}>
                    {money(selectedModuleSummary.balance)}
                  </span>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Valor">
                  <Input name="amount" type="number" min={1} required />
                </Field>
                <Field label="Método">
                  <Select name="method" defaultValue="EFECTIVO">
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{labelize(m)}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Fecha de pago">
                <Input name="paidAt" type="date" defaultValue={today()} />
              </Field>
              <Field label="Observación">
                <Textarea name="observation" />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={create.isPending || !selectedStudentId}>
                  {create.isPending ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal open={!!editing} title="Editar pago" onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editing.studentId ? (
              <>
                <Field label="Estudiante">
                  <Combobox
                    options={students.map((s) => ({ value: s.id, label: s.fullName }))}
                    value={editStudentId}
                    onChange={setEditStudentId}
                    placeholder="Selecciona"
                    searchPlaceholder="Escribe el nombre del estudiante..."
                    emptyText="No se encontró ningún estudiante"
                  />
                </Field>
                <Field label="Módulo">
                  <Select key={editGroupId} name="groupModuleId" defaultValue={editing.groupModuleId ?? ''} disabled={!editGroupId}>
                    <option value="">{editGroupId ? 'Sin módulo' : 'El estudiante no tiene grupo'}</option>
                    {editModules.map((m) => (
                      <option key={m.id} value={m.id}>{m.moduleNumber}. {m.name} — {money(m.price)}</option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field label="Concepto">
                  <Input name="concept" required defaultValue={editing.concept ?? ''} />
                </Field>
                <Field label="Relacionar a una constelación (opcional)">
                  <Select name="oneDayEventId" defaultValue={editing.oneDayEventId ?? ''}>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Valor">
                <Input name="amount" type="number" min={1} required defaultValue={editing.amount} />
              </Field>
              <Field label="Método">
                <Select name="method" defaultValue={editing.method}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{labelize(m)}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Fecha de pago">
              <Input name="paidAt" type="date" defaultValue={editing.paidAt.slice(0, 10)} />
            </Field>
            <Field label="Observación">
              <Textarea name="observation" defaultValue={editing.observation ?? ''} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={update.isPending}>
                {update.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={otherOpen} title="Agregar otro tipo de pago" onClose={() => setOtherOpen(false)}>
        <form onSubmit={handleOtherSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Para ingresos que no provienen de una formación: constelaciones, propinas u otros
            ingresos extra.
          </p>
          <Field label="Concepto">
            <Input name="concept" required placeholder="Ej: Constelación, propina, ingreso extra" />
          </Field>
          <Field label="Relacionar a una constelación (opcional)">
            <Select name="oneDayEventId" defaultValue="">
              <option value="">Ninguna</option>
              {oneDayEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {formatDate(ev.date)} — {ev.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Valor">
              <Input name="amount" type="number" min={1} required />
            </Field>
            <Field label="Método">
              <Select name="method" defaultValue="EFECTIVO">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{labelize(m)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Fecha de pago">
            <Input name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Observación">
            <Textarea name="observation" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOtherOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createOther.isPending}>
              {createOther.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
