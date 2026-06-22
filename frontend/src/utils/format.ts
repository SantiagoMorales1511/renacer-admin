import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function money(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value?: string | Date | null, pattern = "d MMM yyyy"): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, "d MMM yyyy, h:mm a", { locale: es });
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'h:mm a', { locale: es });
}

export const PAYMENT_METHODS = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
  'NEQUI',
  'DAVIPLATA',
  'OTRO',
] as const;

export const EXPENSE_CATEGORIES = [
  'SALON',
  'ASISTENTE',
  'PUBLICIDAD',
  'MATERIALES',
  'TRANSPORTE',
  'REFRIGERIOS',
  'OFICINA',
  'OTRO',
] as const;

export function labelize(value: string): string {
  if (!value) return '';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function sessionLabel(session: {
  title?: string | null;
  group?: { name: string } | null;
}): string {
  return session.group?.name ?? session.title ?? 'Sesión';
}

export function sessionSubtitle(session: {
  groupModule?: { name: string } | null;
  oneDayEvent?: { title: string } | null;
}): string | null {
  return session.groupModule?.name ?? session.oneDayEvent?.title ?? null;
}

export const MODULE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  TRAINING_CONSTELLATIONS: 'Formación en Constelaciones',
  BIODECODING_CERTIFICATION: 'Biodescodificación',
  ONE_DAY_CONSTELLATION_EVENT: 'Constelaciones de un día',
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  DONE: 'Realizado',
  CANCELLED: 'Cancelado',
};

export const EVENT_PAYMENT_TYPE_LABELS: Record<string, string> = {
  ASISTENTE: 'Asistente',
  CONSTELACION: 'Constelación',
  OTRO: 'Otro',
};

export const EVENT_PAYMENT_TYPES = ['ASISTENTE', 'CONSTELACION', 'OTRO'] as const;

export const ATTENDANCE_MATRIX_LABELS: Record<string, string> = {
  ASISTIO_PAGO: 'Asistió y pagó',
  ASISTIO_NO_PAGO: 'Asistió y no pagó',
  NO_ASISTIO_PAGO: 'No asistió y pagó',
  NO_ASISTIO_NO_PAGO: 'No asistió y no pagó',
  SIN_REGISTRO: '—',
};
