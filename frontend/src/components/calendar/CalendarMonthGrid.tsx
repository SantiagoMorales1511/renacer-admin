import { useMemo } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import clsx from 'clsx';
import type { CalendarItem } from './types';
import { ITEM_STYLES, itemsForDay } from './types';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_VISIBLE = 3;

export function CalendarMonthGrid({
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

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      }),
    [monthStart.getTime(), monthEnd.getTime()],
  );

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line/60 bg-canvas/60">
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
          const dayItems = itemsForDay(items, day);
          const inMonth = isSameMonth(day, cursor);
          const todayCell = isToday(day);
          const weekend = isWeekend(day);
          const overflow = dayItems.length - MAX_VISIBLE;

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDay(day);
                }
              }}
              className={clsx(
                'group relative min-h-[72px] cursor-pointer border-b border-r border-line/60 p-1.5 text-left transition-colors last:border-r-0 sm:min-h-[104px] sm:p-2',
                !inMonth && 'bg-canvas/40',
                inMonth && weekend && 'bg-canvas/30',
                inMonth && !weekend && 'bg-surface',
                'hover:bg-petrol-50/40 dark:hover:bg-petrol-900/20',
              )}
            >
              <div className="mb-1 flex items-center justify-between sm:mb-1.5">
                <span
                  className={clsx(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-7 sm:w-7 sm:text-sm',
                    todayCell && 'bg-petrol-600 text-white shadow-sm',
                    !todayCell && inMonth && 'text-ink group-hover:text-petrol-700',
                    !todayCell && !inMonth && 'text-muted/50',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayItems.length > 0 && inMonth && (
                  <span className="hidden rounded-full bg-petrol-100 px-1.5 py-0.5 text-[10px] font-semibold text-petrol-700 dark:bg-petrol-500/20 dark:text-petrol-300 sm:inline">
                    {dayItems.length}
                  </span>
                )}
              </div>

              {dayItems.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:hidden">
                  {dayItems.slice(0, 4).map((item) => (
                    <span
                      key={item.key}
                      className={clsx('h-1.5 w-1.5 rounded-full', ITEM_STYLES[item.kind].dot)}
                    />
                  ))}
                </div>
              )}

              <div className="hidden space-y-1 sm:block">
                {dayItems.slice(0, MAX_VISIBLE).map((item) => {
                  const style = ITEM_STYLES[item.kind];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                      className={clsx(
                        'flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors',
                        style.chip,
                      )}
                      title={item.subtitle ? `${item.title} · ${item.subtitle}` : item.title}
                    >
                      <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={clsx(
                            'block truncate text-[11px] font-medium leading-tight',
                            style.text,
                          )}
                        >
                          {item.title}
                        </span>
                        {item.startTime && (
                          <span className={clsx('block truncate text-[10px]', style.time)}>
                            {item.startTime}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(day);
                    }}
                    className="px-1 text-[10px] font-medium text-muted hover:text-ink"
                  >
                    +{overflow} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
