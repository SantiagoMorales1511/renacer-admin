import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function money(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatThousands(value: string | number): string {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function todayInput(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateInputValue(value: string): string {
  const date = parseISO(value);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
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

export const PAYMENT_METHODS = ['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'TARJETA'] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  NEQUI: 'Nequi',
  TARJETA: 'Tarjeta de crédito',
};

export function paymentMethodLabel(method?: string | null): string {
  if (!method) return '-';
  return PAYMENT_METHOD_LABELS[method] ?? labelize(method);
}

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

export function normalizeText(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(search: string, ...fields: (string | null | undefined)[]): boolean {
  const term = normalizeText(search).trim();
  if (!term) return true;
  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return term.split(/\s+/).every((word) => haystack.includes(word));
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
