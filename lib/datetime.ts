const LIMA_TZ = 'America/Lima';

/**
 * Formats a UTC ISO date/time for display in Peru (America/Lima).
 * Example: "23/07/2026, 16:37"
 */
export function formatLimaDateTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('es-PE', {
    timeZone: LIMA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}
