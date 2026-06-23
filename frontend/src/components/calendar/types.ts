import { isSameDay } from 'date-fns';
import type { ClassSession, GroupModule, OneDayEvent } from '../../types';
import { sessionLabel, sessionSubtitle } from '../../utils/format';

export type CalendarItemKind = 'session' | 'other' | 'module' | 'event';

export interface CalendarItem {
  key: string;
  id: string;
  kind: CalendarItemKind;
  date: string;
  title: string;
  subtitle?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  session?: ClassSession;
  module?: GroupModule;
  event?: OneDayEvent;
}

export const ITEM_STYLES: Record<
  CalendarItemKind,
  { dot: string; chip: string; text: string; time: string }
> = {
  session: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/50',
    text: 'text-sky-900 dark:text-sky-100',
    time: 'text-sky-600/80 dark:text-sky-300/70',
  },
  other: {
    dot: 'bg-gold-500',
    chip: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/25 dark:hover:bg-amber-900/40',
    text: 'text-amber-900 dark:text-amber-100',
    time: 'text-amber-700/80 dark:text-amber-300/70',
  },
  module: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/25 dark:hover:bg-emerald-900/40',
    text: 'text-emerald-900 dark:text-emerald-100',
    time: 'text-emerald-700/80 dark:text-emerald-300/70',
  },
  event: {
    dot: 'bg-petrol-500',
    chip: 'bg-petrol-50 hover:bg-petrol-100 dark:bg-petrol-500/12 dark:hover:bg-petrol-500/20',
    text: 'text-petrol-900 dark:text-petrol-100',
    time: 'text-petrol-600/80 dark:text-petrol-300/70',
  },
};

function isOtherSession(s: ClassSession) {
  return !s.groupId && !!s.title;
}

export function buildCalendarItems({
  sessions,
  moduleDates,
  events,
}: {
  sessions: ClassSession[];
  moduleDates: GroupModule[];
  events: OneDayEvent[];
}): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const s of sessions) {
    items.push({
      key: `session-${s.id}`,
      id: s.id,
      kind: isOtherSession(s) ? 'other' : 'session',
      date: s.date,
      title: sessionLabel(s),
      subtitle: sessionSubtitle(s),
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      session: s,
    });
  }

  for (const m of moduleDates) {
    if (!m.date) continue;
    items.push({
      key: `module-${m.id}`,
      id: m.id,
      kind: 'module',
      date: m.date,
      title: m.name,
      subtitle: m.group?.name ?? null,
      status: m.status,
      module: m,
    });
  }

  const linkedEventIds = new Set(
    sessions.map((s) => s.oneDayEventId).filter(Boolean) as string[],
  );
  for (const ev of events) {
    if (linkedEventIds.has(ev.id)) continue;
    items.push({
      key: `event-${ev.id}`,
      id: ev.id,
      kind: 'event',
      date: ev.date,
      title: ev.title,
      subtitle: ev.program?.name ?? 'Constelación de un día',
      status: ev.status,
      event: ev,
    });
  }

  return items;
}

function compareItems(a: CalendarItem, b: CalendarItem) {
  const byDate = +new Date(a.date) - +new Date(b.date);
  if (byDate !== 0) return byDate;
  return (a.startTime ?? '').localeCompare(b.startTime ?? '');
}

export function itemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  return items.filter((i) => isSameDay(new Date(i.date), day)).sort(compareItems);
}

export function groupItemsByDay(items: CalendarItem[]): { date: Date; items: CalendarItem[] }[] {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const day = new Date(item.date);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map.values())
    .map((group) => ({ date: new Date(group[0].date), items: group.sort(compareItems) }))
    .sort((a, b) => +a.date - +b.date);
}
