import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Sparkles, ChevronRight } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import type { CalendarItem } from './types';
import { ITEM_STYLES } from './types';

export function DaySheet({
  day,
  items,
  onSelectItem,
  onNewSession,
  onNewOther,
  onClose,
}: {
  day: Date;
  items: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
  onNewSession: () => void;
  onNewOther: () => void;
  onClose: () => void;
}) {
  const title = format(day, "EEEE d 'de' MMMM", { locale: es });

  return (
    <Sheet open title={title.charAt(0).toUpperCase() + title.slice(1)} onClose={onClose}>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="rounded-lg bg-canvas px-4 py-6 text-center text-sm text-muted">
            Sin eventos este día
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const style = ITEM_STYLES[item.kind];
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="flex w-full items-center gap-3 rounded-lg bg-canvas p-3 text-left transition-colors hover:bg-line/40"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
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
        )}

        <div className="flex flex-col gap-2 border-t border-line/60 pt-4">
          <button className="btn-primary justify-center" onClick={onNewSession}>
            <Plus size={16} /> Nueva sesión de formación
          </button>
          <button className="btn-ghost justify-center" onClick={onNewOther}>
            <Sparkles size={16} /> Agregar otro tipo de sesión
          </button>
        </div>
      </div>
    </Sheet>
  );
}
