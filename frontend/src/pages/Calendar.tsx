import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarDays, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/Form';
import { useAuth } from '../store/auth';
import { sessionLabel, sessionSubtitle } from '../utils/format';
import type { ClassSession, Group, GroupModule, OneDayEvent } from '../types';
import { buildCalendarItems, itemsForDay } from '../components/calendar/types';
import type { CalendarItem } from '../components/calendar/types';
import { CalendarMonthGrid } from '../components/calendar/CalendarMonthGrid';
import { CalendarAgenda } from '../components/calendar/CalendarAgenda';
import { CalendarItemPreview } from '../components/calendar/CalendarItemPreview';
import { DaySheet } from '../components/calendar/DaySheet';
import { SessionFormModal, SessionVariant } from '../components/calendar/SessionFormModal';
import { ModuleFormModal } from '../components/calendar/ModuleFormModal';
import { EventFormModal } from '../components/calendar/EventFormModal';

type SessionFormState = {
  mode: 'create' | 'edit';
  variant: SessionVariant;
  session?: ClassSession;
  defaultDate?: string;
};

export function CalendarPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [cursor, setCursor] = useState(new Date());
  const [mobileView, setMobileView] = useState<'agenda' | 'month'>('agenda');

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [preview, setPreview] = useState<CalendarItem | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState | null>(null);
  const [moduleForm, setModuleForm] = useState<GroupModule | null>(null);
  const [eventForm, setEventForm] = useState<OneDayEvent | null>(null);

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
  const { data: oneDayEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<OneDayEvent[]>('/events')).data,
  });
  const { data: allGroupModules = [] } = useQuery({
    queryKey: ['group-modules'],
    queryFn: async () => (await api.get<GroupModule[]>('/group-modules')).data,
  });
  const moduleDates = useMemo(() => allGroupModules.filter((m) => m.date), [allGroupModules]);

  const items = useMemo(
    () => buildCalendarItems({ sessions, moduleDates, events: oneDayEvents }),
    [sessions, moduleDates, oneDayEvents],
  );

  const createSession = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post('/sessions', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionForm(null);
    },
  });
  const updateSession = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/sessions/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionForm(null);
    },
  });
  const deleteSession = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/sessions/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setPreview(null);
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/group-modules/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-modules'] });
      setModuleForm(null);
    },
  });
  const deleteModule = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/group-modules/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-modules'] });
      setPreview(null);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/events/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEventForm(null);
    },
  });
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/events/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setPreview(null);
    },
  });

  function openItem(item: CalendarItem) {
    setSelectedDay(null);
    setPreview(item);
  }

  function openNewSession(variant: SessionVariant, day?: Date | null) {
    setSelectedDay(null);
    setSessionForm({
      mode: 'create',
      variant,
      defaultDate: day ? format(day, 'yyyy-MM-dd') : undefined,
    });
  }

  function startEdit(item: CalendarItem) {
    setPreview(null);
    if (item.kind === 'module' && item.module) {
      setModuleForm(item.module);
    } else if (item.kind === 'event' && item.event) {
      setEventForm(item.event);
    } else if (item.session) {
      setSessionForm({
        mode: 'edit',
        variant: item.kind === 'other' ? 'other' : 'regular',
        session: item.session,
      });
    }
  }

  function confirmDelete(item: CalendarItem) {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    if (item.kind === 'module') deleteModule.mutate(item.id);
    else if (item.kind === 'event') deleteEvent.mutate(item.id);
    else deleteSession.mutate(item.id);
  }

  function submitSessionForm(payload: Record<string, unknown>) {
    if (!sessionForm) return;
    if (sessionForm.mode === 'create') createSession.mutate(payload);
    else if (sessionForm.session)
      updateSession.mutate({ id: sessionForm.session.id, data: payload });
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
        subtitle="Sesiones, módulos y constelaciones"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => openNewSession('regular')}>
              <Plus size={16} /> Nueva sesión
            </button>
            <button className="btn-ghost" onClick={() => openNewSession('other')}>
              <Sparkles size={16} /> Otro tipo de sesión
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
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

          <div className="flex items-center gap-1 border-b border-line p-2 lg:hidden">
            {(['agenda', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMobileView(mode)}
                className={clsx(
                  'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                  mobileView === mode
                    ? 'bg-petrol-600 text-white'
                    : 'text-muted hover:bg-canvas hover:text-ink',
                )}
              >
                {mode === 'agenda' ? 'Agenda' : 'Mes'}
              </button>
            ))}
          </div>

          <div className={clsx('lg:hidden', mobileView === 'agenda' ? 'block' : 'hidden')}>
            <CalendarAgenda
              cursor={cursor}
              items={items}
              onSelectDay={setSelectedDay}
              onSelectItem={openItem}
            />
          </div>

          <div className={clsx('lg:block', mobileView === 'month' ? 'block' : 'hidden')}>
            <CalendarMonthGrid
              cursor={cursor}
              items={items}
              onSelectDay={setSelectedDay}
              onSelectItem={openItem}
            />
          </div>
        </div>

        <div className="card hidden flex-col p-0 lg:flex">
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
                              {s.place && <span className="truncate">{s.place}</span>}
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

      {selectedDay && (
        <DaySheet
          day={selectedDay}
          items={itemsForDay(items, selectedDay)}
          onSelectItem={openItem}
          onNewSession={() => openNewSession('regular', selectedDay)}
          onNewOther={() => openNewSession('other', selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {preview && (
        <CalendarItemPreview
          item={preview}
          isAdmin={isAdmin}
          onEdit={() => startEdit(preview)}
          onDelete={() => confirmDelete(preview)}
          onClose={() => setPreview(null)}
        />
      )}

      {sessionForm && (
        <SessionFormModal
          open
          mode={sessionForm.mode}
          variant={sessionForm.variant}
          session={sessionForm.session}
          defaultDate={sessionForm.defaultDate}
          groups={groups}
          oneDayEvents={oneDayEvents}
          isPending={createSession.isPending || updateSession.isPending}
          onSubmit={submitSessionForm}
          onClose={() => setSessionForm(null)}
        />
      )}

      <ModuleFormModal
        open={!!moduleForm}
        module={moduleForm}
        isPending={updateModule.isPending}
        onSubmit={(data) => moduleForm && updateModule.mutate({ id: moduleForm.id, data })}
        onClearDate={() =>
          moduleForm && updateModule.mutate({ id: moduleForm.id, data: { date: null } })
        }
        onClose={() => setModuleForm(null)}
      />

      <EventFormModal
        open={!!eventForm}
        event={eventForm}
        isPending={updateEvent.isPending}
        onSubmit={(data) => eventForm && updateEvent.mutate({ id: eventForm.id, data })}
        onClose={() => setEventForm(null)}
      />
    </div>
  );
}
