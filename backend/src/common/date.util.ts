// Normaliza una fecha "solo día" (YYYY-MM-DD) a mediodía UTC.
// Evita el desfase de un día al mostrarla en zonas horarias negativas (ej. Colombia UTC-5).
export function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
  }
  return new Date(value);
}
