import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  SCHEDULED: 'bg-petrol-100 text-petrol-700 dark:bg-petrol-500/15 dark:text-petrol-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  WITHDRAWN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  FINISHED: 'bg-petrol-100 text-petrol-700 dark:bg-petrol-500/15 dark:text-petrol-300',
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  FINISHED: 'Finalizado',
  WITHDRAWN: 'Retirado',
  SCHEDULED: 'Programada',
  DONE: 'Realizada',
  CANCELLED: 'Cancelada',
  PRESENT: 'Asistió',
  ABSENT: 'No asistió',
};

export function Badge({ status, label }: { status?: string; label?: string }) {
  const key = status ?? '';
  return (
    <span
      className={clsx(
        'badge',
        STATUS_STYLES[key] ?? 'bg-canvas text-muted',
      )}
    >
      {label ?? LABELS[key] ?? key}
    </span>
  );
}
