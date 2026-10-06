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

/**
 * System-wide duration format `HH:MM` (e.g. 155 → "02:35").
 * Hours are not wrapped at 24 (e.g. 1570 → "26:10").
 */
export function formatMinutesHHMM(totalMinutes: number | null | undefined): string {
  const mins = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
