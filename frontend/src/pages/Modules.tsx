import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Ban, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { money, formatDate, PROGRAM_TYPE_LABELS, MODULE_STATUS_LABELS } from '../utils/format';
import type { GroupModule, ProgramType } from '../types';

interface TreeGroup {
  id: string;
  name: string;
  modules: GroupModule[];
}

interface TreeProgram {
  id: string;
  name: string;
  type: ProgramType;
  groups: TreeGroup[];
}

export function ModulesPage() {
  const queryClient = useQueryClient();
  const [programFilter, setProgramFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GroupModule | null>(null);
  const [targetGroup, setTargetGroup] = useState<TreeGroup | null>(null);

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['group-modules-tree'],
    queryFn: async () => (await api.get<TreeProgram[]>('/group-modules/tree')).data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['group-modules-tree'] });
    queryClient.invalidateQueries({ queryKey: ['group'] });
  };

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return (await api.patch(`/group-modules/${editing.id}`, payload)).data;
      return (await api.post('/group-modules', { ...payload, groupId: targetGroup?.id })).data;
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setTargetGroup(null);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (m: GroupModule) =>
      (await api.patch(`/group-modules/${m.id}`, { status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })).data,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/group-modules/${id}`)).data,
    onSuccess: invalidate,
    onError: (err: any) => alert(err?.response?.data?.message ?? 'No se pudo eliminar el módulo.'),
  });

  const filtered = useMemo(() => {
    return tree
      .filter((p) => !programFilter || p.id === programFilter)
      .map((p) => ({
        ...p,
        groups: p.groups.filter((g) => !groupFilter || g.id === groupFilter),
      }));
  }, [tree, programFilter, groupFilter]);

  const groupOptions = useMemo(() => {
    const programs = programFilter ? tree.filter((p) => p.id === programFilter) : tree;
    return programs.flatMap((p) => p.groups);
  }, [tree, programFilter]);

  function toggle(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openNew(group: TreeGroup) {
    setEditing(null);
    setTargetGroup(group);
    setOpen(true);
  }

  function openEdit(m: GroupModule) {
    setEditing(m);
    setTargetGroup(null);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      name: form.get('name'),
      moduleNumber: Number(form.get('moduleNumber')),
      price: Number(form.get('price')) || 0,
      date: form.get('date') ? form.get('date') : null,
      description: form.get('description') || undefined,
      status: form.get('status'),
    });
  }

  function canDelete(m: GroupModule) {
    const c = m.counts;
    return !c || (c.sessions === 0 && c.payments === 0 && c.attendances === 0);
  }

  const nextNumber = editing
    ? editing.moduleNumber
    : (targetGroup?.modules.length ?? 0) + 1;

  return (
    <div>
      <PageHeader
        title="Módulos"
        subtitle="Módulos por grupo, organizados por formación"
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Formación">
          <Select
            value={programFilter}
            onChange={(e) => { setProgramFilter(e.target.value); setGroupFilter(''); }}
          >
            <option value="">Todas</option>
            {tree.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Grupo">
          <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="">Todos</option>
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
        {(programFilter || groupFilter) && (
          <button
            className="btn-ghost"
            onClick={() => { setProgramFilter(''); setGroupFilter(''); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-muted">No hay formaciones con módulos.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((program) => {
            const programCollapsed = collapsed[program.id];
            return (
              <div key={program.id} className="card overflow-hidden">
                <button
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-canvas"
                  onClick={() => toggle(program.id)}
                >
                  {programCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span className="font-semibold">{program.name}</span>
                  <span className="ml-2 text-xs text-muted">{PROGRAM_TYPE_LABELS[program.type]}</span>
                  <span className="ml-auto text-xs text-muted">
                    {program.groups.length} {program.groups.length === 1 ? 'grupo' : 'grupos'}
                  </span>
                </button>

                {!programCollapsed && (
                  <div className="border-t border-line/60">
                    {program.groups.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-muted">Este programa no tiene grupos.</p>
                    ) : (
                      program.groups.map((group) => {
                        const key = `g_${group.id}`;
                        const groupCollapsed = collapsed[key];
                        return (
                          <div key={group.id} className="border-t border-line/60 first:border-t-0">
                            <div className="flex items-center gap-2 bg-canvas/40 px-4 py-2.5 pl-4 sm:pl-8">
                              <button
                                className="flex flex-1 items-center gap-2 text-left"
                                onClick={() => toggle(key)}
                              >
                                {groupCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                <span className="text-sm font-medium">{group.name}</span>
                                <span className="ml-2 text-xs text-muted">
                                  {group.modules.length} {group.modules.length === 1 ? 'módulo' : 'módulos'}
                                </span>
                              </button>
                              <button className="btn-ghost text-xs" onClick={() => openNew(group)}>
                                <Plus size={14} /> Módulo
                              </button>
                            </div>

                            {!groupCollapsed && (
                              <div className="overflow-x-auto px-3 pb-3 pl-6 sm:px-4 sm:pl-12">
                                {group.modules.length === 0 ? (
                                  <p className="py-3 text-sm text-muted">Sin módulos.</p>
                                ) : (
                                  <table className="w-full min-w-[440px] text-sm">
                                    <tbody className="divide-y divide-line/40">
                                      {group.modules.map((m) => (
                                        <tr key={m.id} className={m.status === 'INACTIVE' ? 'opacity-60' : undefined}>
                                          <td className="w-10 py-2 text-muted">{m.moduleNumber}</td>
                                          <td className="py-2 font-medium">{m.name}</td>
                                          <td className="py-2 text-muted">{m.date ? formatDate(m.date) : '-'}</td>
                                          <td className="py-2">{money(m.price)}</td>
                                          <td className="py-2">
                                            <Badge status={m.status} label={MODULE_STATUS_LABELS[m.status]} />
                                          </td>
                                          <td className="py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                              <button
                                                className="rounded-lg p-1.5 text-muted hover:bg-canvas"
                                                title="Editar"
                                                onClick={() => openEdit(m)}
                                              >
                                                <Pencil size={15} />
                                              </button>
                                              <button
                                                className="rounded-lg p-1.5 text-muted hover:bg-canvas"
                                                title={m.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                                                onClick={() => toggleStatus.mutate(m)}
                                              >
                                                <Ban size={15} />
                                              </button>
                                              <button
                                                className={clsx(
                                                  'rounded-lg p-1.5',
                                                  canDelete(m)
                                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                                                    : 'cursor-not-allowed text-muted/40',
                                                )}
                                                title={canDelete(m) ? 'Eliminar' : 'No se puede eliminar: tiene registros asociados'}
                                                disabled={!canDelete(m)}
                                                onClick={() => { if (confirm(`¿Eliminar ${m.name}?`)) remove.mutate(m.id); }}
                                              >
                                                <Trash2 size={15} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Editar módulo' : `Agregar módulo${targetGroup ? ` a ${targetGroup.name}` : ''}`}
        onClose={() => { setOpen(false); setEditing(null); setTargetGroup(null); }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Número">
              <Input name="moduleNumber" type="number" min={1} defaultValue={nextNumber} required />
            </Field>
            <Field label="Precio">
              <Input name="price" type="number" min={0} defaultValue={editing?.price ?? 300000} />
            </Field>
          </div>
          <Field label="Nombre">
            <Input name="name" defaultValue={editing?.name ?? `Módulo ${nextNumber}`} required />
          </Field>
          <Field label="Fecha (sábado)">
            <Input name="date" type="date" defaultValue={editing?.date?.slice(0, 10) ?? ''} />
          </Field>
          <Field label="Descripción">
            <Textarea name="description" defaultValue={editing?.description ?? ''} />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={editing?.status ?? 'ACTIVE'}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setEditing(null); setTargetGroup(null); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
