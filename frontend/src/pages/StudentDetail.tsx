import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Table, Td } from '../components/ui/Table';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StatTile } from '../components/ui/Card';
import { money, formatDate, formatDateTime, labelize, PAYMENT_METHODS } from '../utils/format';

export function StudentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => (await api.get(`/students/${id}`)).data,
  });

  const pay = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payments', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      setPayOpen(false);
    },
  });

  if (isLoading || !data) return <p className="text-muted">Cargando...</p>;

  function handlePay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    pay.mutate({
      studentId: id,
      groupId: data.groupId || undefined,
      groupModuleId: form.get('groupModuleId'),
      amount: Number(form.get('amount')),
      method: form.get('method'),
      observation: form.get('observation') || undefined,
    });
  }

  return (
    <div>
      <PageHeader
        title={data.fullName}
        subtitle={data.group?.name ?? 'Sin grupo'}
        action={
          <button className="btn-primary" onClick={() => setPayOpen(true)}>
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

      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">Módulos</h3>
        <DataTable
          breakpoint="sm"
          rows={data.moduleSummary as any[]}
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
                <Td>{labelize(p.method)}</Td>
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

      <Modal open={payOpen} title="Registrar pago" onClose={() => setPayOpen(false)}>
        <form onSubmit={handlePay} className="space-y-4">
          <Field label="Módulo">
            <Select name="groupModuleId" required defaultValue="">
              <option value="" disabled>Selecciona un módulo</option>
              {data.moduleSummary.map((m: any) => (
                <option key={m.moduleId} value={m.moduleId}>
                  {m.number}. {m.name} {m.balance > 0 ? `(saldo ${money(m.balance)})` : '(al día)'}
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
          <Field label="Observación">
            <Textarea name="observation" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setPayOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={pay.isPending}>
              {pay.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
