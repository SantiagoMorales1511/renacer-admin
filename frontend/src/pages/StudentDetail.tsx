import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, MoneyInput, Select, Textarea } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StatTile } from '../components/ui/Card';
import {
  money,
  formatDate,
  formatDateTime,
  formatThousands,
  parseThousands,
  paymentMethodLabel,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '../utils/format';

type ModuleRow = {
  moduleId: string;
  number: number;
  name: string;
  baseValue: number;
  groupPrice: number;
  hasModulePrice: boolean;
  paid: number;
  balance: number;
  attended: boolean;
};

export function StudentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [method, setMethod] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allPrice, setAllPrice] = useState('');
  const [modulePrices, setModulePrices] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => (await api.get(`/students/${id}`)).data,
  });

  useEffect(() => {
    if (!data) return;
    setAllPrice(data.customPrice ? formatThousands(data.customPrice) : '');
    setModulePrices(
      Object.fromEntries(
        (data.moduleSummary as ModuleRow[]).map((m) => [m.moduleId, formatThousands(m.baseValue)]),
      ),
    );
  }, [data]);

  const savePricing = useMutation({
    mutationFn: async (payload: {
      scope: 'all' | 'module';
      groupModuleId?: string;
      price: number | null;
    }) => (await api.patch(`/students/${id}/pricing`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['cartera'] });
    },
  });

  const pay = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payments', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      closePay();
    },
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  function handlePay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const value = parseThousands(amount);
    const next: Record<string, string> = {};
    if (!moduleId) next.module = 'Selecciona el módulo.';
    if (!value) next.amount = 'Escribe el valor del pago.';
    if (!method) next.method = 'Selecciona el método de pago.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    pay.mutate({
      studentId: id,
      groupId: data.groupId || undefined,
      groupModuleId: moduleId,
      amount: value,
      method,
      observation: form.get('observation') || undefined,
    });
  }

  function openPay() {
    setModuleId('');
    setAmount('');
    setMethod('');
    setErrors({});
    setPayOpen(true);
  }

  function closePay() {
    setPayOpen(false);
    setErrors({});
  }

  function applyToAll(price: number | null) {
    savePricing.mutate({ scope: 'all', price });
  }

  function applyToModule(groupModuleId: string, price: number | null) {
    savePricing.mutate({ scope: 'module', groupModuleId, price });
  }

  const hasDiscount =
    data.customPrice != null ||
    (data.moduleSummary as ModuleRow[]).some((m) => m.hasModulePrice);

  return (
    <div>
      <PageHeader
        title={data.fullName}
        subtitle={data.group?.name ?? 'Sin grupo'}
        action={
          <button className="btn-primary" onClick={openPay}>
            <Plus size={16} /> Registrar pago
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Saldo pendiente" value={money(data.totalBalance)} accent="red" />
        <StatTile label="Estado" value={<Badge status={data.status} />} />
        <StatTile label="Celular" value={<span className="text-base">{data.phone ?? '-'}</span>} />
        <StatTile label="Inscripción" value={<span className="text-base">{formatDate(data.enrolledAt)}</span>} />
      </div>

      {data.moduleSummary.length > 0 && (
        <div className="card mb-4 p-4">
          <h3 className="text-sm font-semibold">Valor que paga esta persona</h3>
          <p className="mt-1 text-xs text-muted">
            Si tiene un descuento, escribe aquí cuánto paga por módulo. Déjalo vacío para usar el
            precio del grupo.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="w-40">
              <MoneyInput value={allPrice} onChange={setAllPrice} placeholder="0" />
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={savePricing.isPending}
              onClick={() => applyToAll(allPrice ? parseThousands(allPrice) : null)}
            >
              Aplicar a todos los módulos
            </button>
            {hasDiscount && (
              <button
                type="button"
                className="btn-ghost"
                disabled={savePricing.isPending}
                onClick={() => {
                  setAllPrice('');
                  applyToAll(null);
                }}
              >
                Usar el precio del grupo
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">Módulos</h3>
        <DataTable
          breakpoint="sm"
          rows={data.moduleSummary as ModuleRow[]}
          rowKey={(m) => m.moduleId}
          empty="Sin módulos."
          columns={[
            { header: '#', cell: (m) => m.number },
            { header: 'Módulo', primary: true, cell: (m) => m.name },
            {
              header: 'Visto',
              cell: (m) => (
                <Badge status={m.attended ? 'PRESENT' : 'ABSENT'} label={m.attended ? 'Sí' : 'No'} />
              ),
            },
            {
              header: 'Valor',
              cell: (m) => (
                <div className="flex items-center gap-2">
                  <div className="w-28">
                    <MoneyInput
                      value={modulePrices[m.moduleId] ?? ''}
                      onChange={(v) =>
                        setModulePrices((prev) => ({ ...prev, [m.moduleId]: v }))
                      }
                      placeholder={formatThousands(m.groupPrice)}
                    />
                  </div>
                  {parseThousands(modulePrices[m.moduleId] ?? '') !== m.baseValue && (
                    <button
                      type="button"
                      className="text-xs text-petrol-600 hover:underline"
                      disabled={savePricing.isPending}
                      onClick={() => {
                        const value = modulePrices[m.moduleId];
                        applyToModule(m.moduleId, value ? parseThousands(value) : null);
                      }}
                    >
                      Guardar
                    </button>
                  )}
                  {m.baseValue !== m.groupPrice && (
                    <span className="text-xs text-muted">
                      Grupo: {money(m.groupPrice)}
                    </span>
                  )}
                </div>
              ),
            },
            { header: 'Pagado', cell: (m) => money(m.paid) },
            {
              header: 'Saldo',
              cell: (m) => (
                <span className={m.balance > 0 ? 'font-medium text-red-600' : 'text-emerald-600'}>
                  {m.balance > 0 ? money(m.balance) : 'Al día'}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Historial de pagos</h3>
          <Table columns={['Fecha', 'Módulo', 'Método', 'Valor']} empty={data.payments.length === 0}>
            {data.payments.map((p: any) => (
              <tr key={p.id}>
                <Td>{formatDate(p.paidAt)}</Td>
                <Td>{p.groupModule?.name}</Td>
                <Td>{paymentMethodLabel(p.method)}</Td>
                <Td className="font-medium">{money(p.amount)}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Historial de asistencia</h3>
          <Table columns={['Fecha', 'Módulo', 'Estado']} empty={data.attendances.length === 0}>
            {data.attendances.map((a: any) => (
              <tr key={a.id}>
                <Td>{formatDateTime(a.session?.date)}</Td>
                <Td>{a.session?.groupModule?.name}</Td>
                <Td><Badge status={a.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <Modal open={payOpen} title="Registrar pago" onClose={closePay}>
        <form onSubmit={handlePay} className="space-y-4">
          <Field label="Módulo" error={errors.module}>
            <Select
              value={moduleId}
              onChange={(e) => {
                setModuleId(e.target.value);
                setErrors((prev) => ({ ...prev, module: '' }));
              }}
            >
              <option value="">Selecciona un módulo</option>
              {data.moduleSummary.map((m: any) => (
                <option key={m.moduleId} value={m.moduleId}>
                  {m.number}. {m.name} {m.balance > 0 ? `(saldo ${money(m.balance)})` : '(al día)'}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Valor" error={errors.amount}>
              <MoneyInput
                value={amount}
                onChange={(v) => {
                  setAmount(v);
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0"
              />
            </Field>
            <Field label="Método" error={errors.method}>
              <Select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setErrors((prev) => ({ ...prev, method: '' }));
                }}
              >
                <option value="">Selecciona</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Observación">
            <Textarea name="observation" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={closePay}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={pay.isPending}>
              {pay.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
