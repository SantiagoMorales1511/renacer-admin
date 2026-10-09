import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Sparkles, Pencil, Paperclip, X } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, MoneyInput, Select, Textarea } from '../components/ui/Form';
import { Combobox } from '../components/ui/Combobox';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../store/auth';
import {
  money,
  formatDate,
  parseThousands,
  formatThousands,
  todayInput,
  dateInputValue,
  paymentMethodLabel,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '../utils/format';
import type { GroupModule, OneDayEvent, Payment, Student } from '../types';

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

type FieldErrors = Record<string, string>;

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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editAmount, setEditAmount] = useState('');
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [editReceiptPreview, setEditReceiptPreview] = useState('');
  const [editReceiptRemoved, setEditReceiptRemoved] = useState(false);
  const [editExistingPreview, setEditExistingPreview] = useState('');
  const editReceiptInputRef = useRef<HTMLInputElement>(null);
  const [otherAmount, setOtherAmount] = useState('');
  const [otherErrors, setOtherErrors] = useState<FieldErrors>({});
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [viewUrl, setViewUrl] = useState('');
  const [viewError, setViewError] = useState('');
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview('');
      return;
    }
    const url = URL.createObjectURL(receiptFile);
    setReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receiptFile]);

  useEffect(() => {
    if (!editReceiptFile) {
      setEditReceiptPreview('');
      return;
    }
    const url = URL.createObjectURL(editReceiptFile);
    setEditReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editReceiptFile]);

  useEffect(() => {
    if (!editing?.receiptUrl || editReceiptRemoved || editReceiptFile) {
      setEditExistingPreview('');
      return;
    }
    let url = '';
    let cancelled = false;
    api
      .get(`/payments/${editing.id}/receipt`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setEditExistingPreview(url);
      })
      .catch(() => {
        if (!cancelled) setEditExistingPreview('');
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [editing, editReceiptRemoved, editReceiptFile]);

  useEffect(() => {
    if (!viewing) return;
    let url = '';
    let cancelled = false;
    setViewUrl('');
    setViewError('');
    api
      .get(`/payments/${viewing.id}/receipt`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setViewUrl(url);
      })
      .catch(() => !cancelled && setViewError('No se pudo cargar el comprobante.'));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [viewing]);

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
    mutationFn: async ({ payload, file }: { payload: any; file: File | null }) => {
      let receiptUrl: string | undefined;
      if (file) {
        const body = new FormData();
        body.append('file', file);
        receiptUrl = (await api.post('/payments/receipt', body)).data.receiptUrl;
      }
      return (await api.post('/payments', { ...payload, receiptUrl })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['cartera'] });
      closeCreate();
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
    mutationFn: async ({
      id,
      data,
      file,
      removeReceipt,
    }: {
      id: string;
      data: any;
      file: File | null;
      removeReceipt: boolean;
    }) => {
      let receiptUrl: string | undefined;
      if (file) {
        const body = new FormData();
        body.append('file', file);
        receiptUrl = (await api.post('/payments/receipt', body)).data.receiptUrl;
      } else if (removeReceipt) {
        receiptUrl = '';
      }
      return (
        await api.patch(`/payments/${id}`, {
          ...data,
          ...(receiptUrl !== undefined ? { receiptUrl } : {}),
        })
      ).data;
    },
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
    const value = parseThousands(amount);
    const next: FieldErrors = {};
    if (!selectedStudentId) next.student = 'Selecciona el estudiante.';
    if (!selectedModuleId) next.module = 'Selecciona el módulo.';
    if (!value) next.amount = 'Escribe el valor del pago.';
    if (!method) next.method = 'Selecciona el método de pago.';
    if (errors.receipt) next.receipt = errors.receipt;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const student = students.find((s) => s.id === selectedStudentId);
    create.mutate({
      payload: {
        studentId: selectedStudentId,
        groupId: student?.groupId || undefined,
        groupModuleId: selectedModuleId,
        amount: value,
        method,
        paidAt: form.get('paidAt') || undefined,
        observation: form.get('observation') || undefined,
      },
      file: receiptFile,
    });
  }

  function openCreate() {
    setSelectedStudentId('');
    setSelectedModuleId('');
    setAmount('');
    setMethod('');
    setReceiptFile(null);
    setErrors({});
    setOpen(true);
  }

  function closeCreate() {
    setOpen(false);
    setSelectedModuleId('');
    setAmount('');
    setMethod('');
    setReceiptFile(null);
    setErrors({});
  }

  function clearError(field: string) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  }

  function pickReceipt(file: File | null) {
    const reject = (message: string) => {
      setReceiptFile(null);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
      setErrors((prev) => ({ ...prev, receipt: message }));
    };
    if (!file) {
      setReceiptFile(null);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
      clearError('receipt');
      return;
    }
    if (!file.type.startsWith('image/')) return reject('El comprobante debe ser una imagen.');
    if (file.size > RECEIPT_MAX_BYTES) return reject('La imagen supera los 10 MB.');
    setReceiptFile(file);
    clearError('receipt');
  }

  function openEdit(p: Payment) {
    setEditing(p);
    setEditStudentId(p.studentId ?? '');
    setEditAmount(formatThousands(p.amount));
    setEditErrors({});
    setEditReceiptFile(null);
    setEditReceiptRemoved(false);
    if (editReceiptInputRef.current) editReceiptInputRef.current.value = '';
  }

  function pickEditReceipt(file: File | null) {
    const reject = (message: string) => {
      setEditReceiptFile(null);
      if (editReceiptInputRef.current) editReceiptInputRef.current.value = '';
      setEditErrors((prev) => ({ ...prev, receipt: message }));
    };
    if (!file) {
      setEditReceiptFile(null);
      if (editReceiptInputRef.current) editReceiptInputRef.current.value = '';
      setEditErrors((prev) => ({ ...prev, receipt: '' }));
      return;
    }
    if (!file.type.startsWith('image/')) return reject('El comprobante debe ser una imagen.');
    if (file.size > RECEIPT_MAX_BYTES) return reject('La imagen supera los 10 MB.');
    setEditReceiptFile(file);
    setEditErrors((prev) => ({ ...prev, receipt: '' }));
  }

  function clearEditReceipt() {
    pickEditReceipt(null);
    setEditReceiptRemoved(true);
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const isOther = !editing.studentId;
    const value = parseThousands(editAmount);
    const next: FieldErrors = {};
    if (!value) next.amount = 'Escribe el valor del pago.';
    if (!isOther && !editStudentId) next.student = 'Selecciona el estudiante.';
    if (editErrors.receipt) next.receipt = editErrors.receipt;
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;

    const base = {
      amount: value,
      method: form.get('method'),
      paidAt: form.get('paidAt') || undefined,
      observation: form.get('observation') || '',
    };
    if (isOther) {
      const eventId = form.get('oneDayEventId');
      update.mutate({
        id: editing.id,
        file: editReceiptFile,
        removeReceipt: editReceiptRemoved,
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
        file: editReceiptFile,
        removeReceipt: editReceiptRemoved,
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
    const value = parseThousands(otherAmount);
    const concept = String(form.get('concept') ?? '').trim();
    const next: FieldErrors = {};
    if (!concept) next.concept = 'Escribe el concepto.';
    if (!value) next.amount = 'Escribe el valor del pago.';
    setOtherErrors(next);
    if (Object.keys(next).length > 0) return;

    const eventId = form.get('oneDayEventId');
    createOther.mutate({
      concept,
      amount: value,
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
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Registrar pago
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setOtherAmount('');
                setOtherErrors({});
                setOtherOpen(true);
              }}
            >
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
          { header: 'Método', cell: (p) => paymentMethodLabel(p.method) },
          { header: 'Valor', className: 'font-medium', cell: (p) => money(p.amount) },
          {
            header: 'Comprobante',
            cell: (p) =>
              p.receiptUrl ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-petrol-600 hover:underline"
                  onClick={() => setViewing(p)}
                >
                  <Paperclip size={14} /> Ver
                </button>
              ) : (
                <span className="text-muted">-</span>
              ),
          },
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
              <Field label="Estudiante" error={errors.student}>
                <Combobox
                  options={students.map((s) => ({ value: s.id, label: s.fullName }))}
                  value={selectedStudentId}
                  onChange={(id) => {
                    setSelectedStudentId(id);
                    setSelectedModuleId('');
                    clearError('student');
                  }}
                  placeholder="Selecciona"
                  searchPlaceholder="Escribe el nombre del estudiante..."
                  emptyText="No se encontró ningún estudiante"
                />
              </Field>
              <Field label="Módulo" error={errors.module}>
                <Select
                  name="groupModuleId"
                  value={selectedModuleId}
                  onChange={(e) => {
                    setSelectedModuleId(e.target.value);
                    clearError('module');
                  }}
                  disabled={!selectedGroupId}
                >
                  <option value="">
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
                <Field label="Valor" error={errors.amount}>
                  <MoneyInput
                    value={amount}
                    onChange={(v) => {
                      setAmount(v);
                      clearError('amount');
                    }}
                    placeholder="0"
                  />
                </Field>
                <Field label="Método" error={errors.method}>
                  <Select
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      clearError('method');
                    }}
                  >
                    <option value="">Selecciona</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Fecha de pago">
                <Input name="paidAt" type="date" defaultValue={todayInput()} />
              </Field>
              <Field label="Observación">
                <Textarea name="observation" />
              </Field>
              <Field label="Comprobante (opcional)" error={errors.receipt}>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => pickReceipt(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1 text-xs text-muted">Imagen de la galería o de la cámara, hasta 10 MB.</p>
                {receiptPreview && (
                  <div className="mt-2 flex items-start gap-3">
                    <img
                      src={receiptPreview}
                      alt="Vista previa del comprobante"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted">{receiptFile?.name}</p>
                      <button
                        type="button"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                        onClick={() => pickReceipt(null)}
                      >
                        <X size={13} /> Quitar imagen
                      </button>
                    </div>
                  </div>
                )}
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => closeCreate()}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={create.isPending}>
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
                <Field label="Estudiante" error={editErrors.student}>
                  <Combobox
                    options={students.map((s) => ({ value: s.id, label: s.fullName }))}
                    value={editStudentId}
                    onChange={(id) => {
                      setEditStudentId(id);
                      setEditErrors((prev) => ({ ...prev, student: '' }));
                    }}
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
              <Field label="Valor" error={editErrors.amount}>
                <MoneyInput
                  value={editAmount}
                  onChange={(v) => {
                    setEditAmount(v);
                    setEditErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                />
              </Field>
              <Field label="Método">
                <Select name="method" defaultValue={editing.method}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Fecha de pago">
              <Input name="paidAt" type="date" defaultValue={dateInputValue(editing.paidAt)} />
            </Field>
            <Field label="Observación">
              <Textarea name="observation" defaultValue={editing.observation ?? ''} />
            </Field>
            <Field label="Comprobante (opcional)" error={editErrors.receipt}>
              <input
                ref={editReceiptInputRef}
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => pickEditReceipt(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted">Imagen de la galería o de la cámara, hasta 10 MB.</p>
              {(editReceiptPreview || editExistingPreview) && (
                <div className="mt-2 flex items-start gap-3">
                  <img
                    src={editReceiptPreview || editExistingPreview}
                    alt="Vista previa del comprobante"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted">
                      {editReceiptFile?.name ?? 'Comprobante actual'}
                    </p>
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                      onClick={clearEditReceipt}
                    >
                      <X size={13} /> Quitar comprobante
                    </button>
                  </div>
                </div>
              )}
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
          <Field label="Concepto" error={otherErrors.concept}>
            <Input
              name="concept"
              placeholder="Ej: Constelación, propina, ingreso extra"
              onChange={() => setOtherErrors((prev) => ({ ...prev, concept: '' }))}
            />
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
            <Field label="Valor" error={otherErrors.amount}>
              <MoneyInput
                value={otherAmount}
                onChange={(v) => {
                  setOtherAmount(v);
                  setOtherErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0"
              />
            </Field>
            <Field label="Método">
              <Select name="method" defaultValue="EFECTIVO">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Fecha de pago">
            <Input name="paidAt" type="date" defaultValue={todayInput()} />
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

      <Modal open={!!viewing} title="Comprobante de pago" onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {viewing.student?.fullName ?? viewing.concept ?? 'Otro ingreso'} · {money(viewing.amount)} ·{' '}
              {formatDate(viewing.paidAt)}
            </p>
            {viewError ? (
              <p className="text-sm text-red-600">{viewError}</p>
            ) : viewUrl ? (
              <>
                <img
                  src={viewUrl}
                  alt="Comprobante de pago"
                  className="max-h-[60vh] w-full rounded-lg object-contain"
                />
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-block text-sm text-petrol-600 hover:underline"
                >
                  Abrir en tamaño completo
                </a>
              </>
            ) : (
              <p className="text-sm text-muted">Cargando comprobante...</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
