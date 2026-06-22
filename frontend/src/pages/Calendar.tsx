import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarDays, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { PageHeader, Field, Input, Select, Textarea } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { formatDate, sessionLabel, sessionSubtitle } from '../utils/format';
import type { ClassSession, Group, GroupModule, OneDayEvent } from '../types';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_VISIBLE_SESSIONS = 2;

function isOtherSession(s: ClassSession) {
  return !s.groupId && !!s.title;
}

export function CalendarPage() {
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', format(monthStart, 'yyyy-MM')],
    queryFn: async () =>
      (
        await api.get<ClassSession[]>('/sessions', {
          params: {
            from: format(startOfWeek(monthStart), 'yyyy-MM-dd'),
            to: format(endOfWeek(monthEnd), 'yyyy-MM-dd'),
          },
        })
      ).data,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/groups')).data,
  });
  const { data: modules = [] } = useQuery({
    queryKey: ['group', selectedGroupId, 'modules'],
    queryFn: async () => (await api.get<GroupModule[]>(`/groups/${selectedGroupId}/modules`)).data,
    enabled: !!selectedGroupId,
  });
  const { data: oneDayEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<OneDayEvent[]>('/events')).data,
  });
  const { data: allGroupModules = [] } = useQuery({
    queryKey: ['group-modules'],
    queryFn: async () => (await api.get<GroupModule[]>('/group-modules')).data,
  });
  const moduleDates = useMemo(() => allGroupModules.filter((m) => m.date), [allGroupModules]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      }),
    [monthStart.getTime(), monthEnd.getTime()],
  );

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/sessions', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpen(false);
    },
  });

  const createOther = useMutation({
    mutationFn: async (payload: any) => (await api.post('/sessions', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOtherOpen(false);
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      groupId: form.get('groupId'),
      groupModuleId: form.get('groupModuleId'),
      date: form.get('date'),
      startTime: form.get('startTime') || undefined,
      endTime: form.get('endTime') || undefined,
      place: form.get('place') || undefined,
    });
  }

  function handleOtherSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const eventId = form.get('oneDayEventId');
    createOther.mutate({
      title: form.get('title'),
      date: form.get('date'),
      startTime: form.get('startTime') || undefined,
      endTime: form.get('endTime') || undefined,
      place: form.get('place') || undefined,
      notes: form.get('notes') || undefined,
      oneDayEventId: eventId && eventId !== '' ? eventId : undefined,
    });
  }

  const upcoming = [...sessions]
    .filter((s) => new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 6);

  const monthSessions = sessions.filter((s) => isSameMonth(new Date(s.date), cursor)).length;

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Sesiones de clase por grupo y módulo"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Nueva sesión
            </button>
            <button className="btn-ghost" onClick={() => setOtherOpen(true)}>
              <Sparkles size={16} /> Agregar otro tipo de sesión
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {format(cursor, 'yyyy', { locale: es })}
              </p>
              <h2 className="text-xl font-semibold capitalize text-ink">
                {format(cursor, 'MMMM', { locale: es })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted sm:inline">
                {monthSessions} {monthSessions === 1 ? 'sesión' : 'sesiones'} este mes
              </span>
              <div className="flex items-center rounded-lg border border-line bg-canvas p-0.5">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
                  onClick={() => setCursor(addMonths(cursor, -1))}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-petrol-600 transition-colors hover:bg-surface dark:text-lavender-300"
                  onClick={() => setCursor(new Date())}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
                  onClick={() => setCursor(addMonths(cursor, 1))}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-canvas/60">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={clsx(
                  'py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide',
                  i >= 5 ? 'text-muted/70' : 'text-muted',
                )}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), day));
              const dayModules = moduleDates.filter((m) => isSameDay(new Date(m.date!), day));
              const inMonth = isSameMonth(day, cursor);
              const todayCell = isToday(day);
              const weekend = isWeekend(day);
              const overflow = daySessions.length - MAX_VISIBLE_SESSIONS;

              return (
                <div
                  key={day.toISOString()}
                  className={clsx(
                    'group relative min-h-[96px] border-b border-r border-line p-2 transition-colors last:border-r-0',
                    !inMonth && 'bg-canvas/40',
                    inMonth && weekend && 'bg-canvas/30',
                    inMonth && !weekend && 'bg-surface',
                    'hover:bg-petrol-50/40 dark:hover:bg-petrol-900/20',
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={clsx(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                        todayCell && 'bg-petrol-600 text-white shadow-sm',
                        !todayCell && inMonth && 'text-ink group-hover:text-petrol-700',
                        !todayCell && !inMonth && 'text-muted/50',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {daySessions.length + dayModules.length > 0 && inMonth && (
                      <span className="rounded-full bg-lavender-100 px-1.5 py-0.5 text-[10px] font-semibold text-lavender-700 dark:bg-lavender-900/50 dark:text-lavender-200">
                        {daySessions.length + dayModules.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {daySessions.slice(0, MAX_VISIBLE_SESSIONS).map((s) => {
                      const other = isOtherSession(s);
                      const subtitle = sessionSubtitle(s);
                      return (
                      <Link
                        key={s.id}
                        to={`/sessions/${s.id}`}
                        className={clsx(
                          'group/event flex items-start gap-1.5 rounded-md px-1.5 py-1 transition-colors',
                          other
                            ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/25 dark:hover:bg-amber-900/40'
                            : 'bg-lavender-50 hover:bg-lavender-100 dark:bg-lavender-900/30 dark:hover:bg-lavender-900/50',
                        )}
                        title={subtitle ? `${sessionLabel(s)} · ${subtitle}` : sessionLabel(s)}
                      >
                        <span
                          className={clsx(
                            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                            other ? 'bg-gold-500' : 'bg-lavender-500',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={clsx(
                              'block truncate text-[11px] font-medium leading-tight',
                              other
                                ? 'text-amber-900 dark:text-amber-100'
                                : 'text-lavender-900 dark:text-lavender-100',
                            )}
                          >
                            {sessionLabel(s)}
                          </span>
                          {s.startTime && (
                            <span
                              className={clsx(
                                'block truncate text-[10px]',
                                other
                                  ? 'text-amber-700/80 dark:text-amber-300/70'
                                  : 'text-lavender-600/80 dark:text-lavender-300/70',
                              )}
                            >
                              {s.startTime}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                    })}
                    {overflow > 0 && (
                      <p className="px-1 text-[10px] font-medium text-muted">
                        +{overflow} más
                      </p>
                    )}
                    {dayModules.slice(0, MAX_VISIBLE_SESSIONS).map((m) => (
                      <Link
                        key={m.id}
                        to={`/groups/${m.groupId}?tab=modules`}
                        className="group/event flex items-start gap-1.5 rounded-md bg-emerald-50 px-1.5 py-1 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/25 dark:hover:bg-emerald-900/40"
                        title={`${m.group?.name ?? ''} · ${m.name}`}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium leading-tight text-emerald-900 dark:text-emerald-100">
                            {m.name}
                          </span>
                          {m.group?.name && (
                            <span className="block truncate text-[10px] text-emerald-700/80 dark:text-emerald-300/70">
                              {m.group.name}
                            </span>
                          )}
                        </span>
                      </Link>
                    ))}
                    {dayModules.length > MAX_VISIBLE_SESSIONS && (
                      <p className="px-1 text-[10px] font-medium text-muted">
                        +{dayModules.length - MAX_VISIBLE_SESSIONS} módulos
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card flex flex-col p-0">
          <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-petrol-50 text-petrol-600 dark:bg-petrol-900/50 dark:text-lavender-200">
              <CalendarDays size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Próximas clases</h3>
              <p className="text-xs text-muted">{upcoming.length} programadas</p>
            </div>
          </div>

          <div className="flex-1 p-3">
            {upcoming.length === 0 ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-line px-4 py-8 text-center">
                <CalendarDays size={28} className="mb-2 text-muted/40" />
                <p className="text-sm font-medium text-ink">Sin clases próximas</p>
                <p className="mt-1 text-xs text-muted">Crea una sesión para empezar</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((s, i) => {
                  const sessionDate = new Date(s.date);
                  const isNext = i === 0;

                  return (
                    <li key={s.id}>
                      <Link
                        to={`/sessions/${s.id}`}
                        className={clsx(
                          'group/item flex gap-3 rounded-lg border p-3 transition-all',
                          isNext
                            ? 'border-petrol-200 bg-petrol-50/60 hover:border-petrol-300 dark:border-petrol-800 dark:bg-petrol-900/30'
                            : 'border-line hover:border-petrol-200 hover:bg-canvas dark:hover:border-petrol-800',
                        )}
                      >
                        <div className="flex shrink-0 flex-col items-center">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {format(sessionDate, 'MMM', { locale: es })}
                          </span>
                          <span
                            className={clsx(
                              'text-lg font-bold leading-none',
                              isNext ? 'text-petrol-600 dark:text-lavender-300' : 'text-ink',
                            )}
                          >
                            {format(sessionDate, 'd')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 border-l border-line pl-3">
                          <p className="truncate text-sm font-medium text-ink group-hover/item:text-petrol-700 dark:group-hover/item:text-lavender-200">
                            {sessionLabel(s)}
                          </p>
                          {sessionSubtitle(s) && (
                            <p className="truncate text-xs text-muted">{sessionSubtitle(s)}</p>
                          )}
                          {(s.startTime || s.place) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                              {s.startTime && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={11} />
                                  {s.startTime}
                                  {s.endTime ? ` – ${s.endTime}` : ''}
                                </span>
                              )}
                              {s.place && (
                                <span className="truncate">{s.place}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal open={open} title="Nueva sesión" onClose={() => { setOpen(false); setSelectedGroupId(''); }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Grupo">
            <Select
              name="groupId"
              required
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="" disabled>Selecciona</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Módulo">
            <Select name="groupModuleId" required defaultValue="" disabled={!selectedGroupId}>
              <option value="" disabled>{selectedGroupId ? 'Selecciona' : 'Elige un grupo primero'}</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.moduleNumber}. {m.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Fecha">
              <Input name="date" type="date" required />
            </Field>
            <Field label="Inicio">
              <Input name="startTime" type="time" />
            </Field>
            <Field label="Fin">
              <Input name="endTime" type="time" />
            </Field>
          </div>
          <Field label="Lugar">
            <Input name="place" placeholder="Salón A" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Guardando...' : 'Crear sesión'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={otherOpen} title="Agregar otro tipo de sesión" onClose={() => setOtherOpen(false)}>
        <form onSubmit={handleOtherSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Para actividades que no son clase de formación: constelaciones, talleres especiales u otros eventos.
          </p>
          <Field label="Título">
            <Input name="title" required placeholder="Ej: Constelación, taller especial, evento" />
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Fecha">
              <Input name="date" type="date" required />
            </Field>
            <Field label="Inicio">
              <Input name="startTime" type="time" />
            </Field>
            <Field label="Fin">
              <Input name="endTime" type="time" />
            </Field>
          </div>
          <Field label="Lugar">
            <Input name="place" placeholder="Salón A" />
          </Field>
          <Field label="Observaciones">
            <Textarea name="notes" />
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
