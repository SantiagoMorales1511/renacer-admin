import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, Sparkles, Tag, FileText, CalendarDays, Layers } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Badge } from '../ui/Badge';
import { formatDate, money } from '../../utils/format';
import { EVENT_STATUS_LABELS, MODULE_STATUS_LABELS } from '../../utils/format';
import type { CalendarItem } from './types';
import { ITEM_STYLES } from './types';

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0 flex-1 text-ink">{children}</span>
    </div>
  );
}

const KIND_LABELS: Record<CalendarItem['kind'], string> = {
  session: 'Sesión de formación',
  other: 'Otro tipo de sesión',
  module: 'Módulo programado',
  event: 'Constelación de un día',
};

export function CalendarItemPreview({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onClose,
}: {
  item: CalendarItem;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const style = ITEM_STYLES[item.kind];

  function goToDetail() {
    if (item.kind === 'module' && item.module) {
      navigate(`/groups/${item.module.groupId}?tab=modules`);
    } else if (item.kind === 'event') {
      navigate(`/events/${item.id}`);
    } else {
      navigate(`/sessions/${item.id}`);
    }
  }

  const detailLabel =
    item.kind === 'module'
      ? 'Ir al grupo'
      : item.kind === 'session'
        ? 'Ver asistencia'
        : 'Ver detalle';

  return (
    <Sheet open title={item.title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.chip} ${style.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {KIND_LABELS[item.kind]}
          </span>
          {item.status && (
            <Badge
              status={item.status}
              label={
                item.kind === 'event'
                  ? EVENT_STATUS_LABELS[item.status]
                  : item.kind === 'module'
                    ? MODULE_STATUS_LABELS[item.status]
                    : undefined
              }
            />
          )}
        </div>

        <div className="space-y-2.5">
          <InfoRow icon={<CalendarDays size={16} />}>{formatDate(item.date)}</InfoRow>

          {(item.startTime || item.endTime) && (
            <InfoRow icon={<Clock size={16} />}>
              {item.startTime ?? '-'}
              {item.endTime ? ` – ${item.endTime}` : ''}
            </InfoRow>
          )}

          {item.kind !== 'module' && item.session?.place && (
            <InfoRow icon={<MapPin size={16} />}>{item.session.place}</InfoRow>
          )}

          {item.subtitle && (
            <InfoRow icon={item.kind === 'module' ? <Layers size={16} /> : <Sparkles size={16} />}>
              {item.subtitle}
            </InfoRow>
          )}

          {item.kind === 'module' && item.module && (
            <>
              {item.module.program?.name && (
                <InfoRow icon={<Tag size={16} />}>{item.module.program.name}</InfoRow>
              )}
              <InfoRow icon={<Tag size={16} />}>{money(item.module.price)}</InfoRow>
            </>
          )}

          {item.kind === 'event' && item.event && (
            <InfoRow icon={<Users size={16} />}>
              {item.event.attendeesCount} asistentes · {item.event.constellatedCount} constelados
            </InfoRow>
          )}

          {item.kind === 'other' && item.session?.notes && (
            <InfoRow icon={<FileText size={16} />}>{item.session.notes}</InfoRow>
          )}

          {item.kind === 'event' && item.event?.observations && (
            <InfoRow icon={<FileText size={16} />}>{item.event.observations}</InfoRow>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line/60 pt-4">
          <button className="btn-primary" onClick={onEdit}>
            Editar
          </button>
          <button className="btn-ghost" onClick={goToDetail}>
            {detailLabel}
          </button>
          {isAdmin && (
            <button className="btn-ghost text-red-600" onClick={onDelete}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
