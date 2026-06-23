import { useMemo } from 'react';
import { endOfMonth, format, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import type { CalendarItem } from './types';
import { ITEM_STYLES, groupItemsByDay } from './types';

export function CalendarAgenda({
  cursor,
  items,
  onSelectDay,
  onSelectItem,
}: {
  cursor: Date;
  items: CalendarItem[];
  onSelectDay: (day: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
}) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const groups = useMemo(() => {
    const monthItems = items.filter((i) => {
      const d = new Date(i.date);
      return d >= monthStart && d <= monthEnd && isSameMonth(d, cursor);
    });
    return groupItemsByDay(monthItems);
  }, [items, monthStart.getTime(), monthEnd.getTime()]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <CalendarDays size={32} className="mb-3 text-muted/40" />
        <p className="text-sm font-medium text-ink">Sin eventos este mes</p>
        <p className="mt-1 text-xs text-muted">Toca un día en el calendario para agregar uno</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line/40">
      {groups.map((group) => {
        const today = isToday(group.date);
        return (
          <div key={group.date.toISOString()} className="px-3 py-3">
            <button
              type="button"
              onClick={() => onSelectDay(group.date)}
              className="mb-2 flex w-full items-center gap-3 text-left"
            >
              <span
                className={clsx(
                  'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg',
                  today
                    ? 'bg-petrol-50 text-petrol-700 dark:bg-petrol-900/30'
                    : 'bg-canvas',
                )}
              >
                <span className="text-[10px] font-semibold uppercase text-muted">
                  {format(group.date, 'EEE', { locale: es })}
                </span>
                <span
                  className={clsx(
                    'text-base font-bold leading-none',
                    today ? 'text-petrol-600 dark:text-petrol-300' : 'text-ink',
                  )}
                >
                  {format(group.date, 'd')}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  {format(group.date, "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="block text-xs text-muted">
                  {group.items.length} {group.items.length === 1 ? 'evento' : 'eventos'}
                </span>
              </span>
              <Plus size={18} className="shrink-0 text-muted" />
            </button>

            <ul className="space-y-2 pl-14">
              {group.items.map((item) => {
                const style = ITEM_STYLES[item.kind];
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="flex w-full items-center gap-3 rounded-lg bg-canvas p-2.5 text-left transition-colors hover:bg-line/40"
                    >
                      <span className={clsx('h-2 w-2 shrink-0 rounded-full', style.dot)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {item.title}
                        </span>
                        {(item.startTime || item.subtitle) && (
                          <span className="block truncate text-xs text-muted">
                            {[item.startTime, item.subtitle].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
