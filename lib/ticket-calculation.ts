/**
 * Client-side mirror of the backend's hour/tolerance calculation
 * (playasystem_backend_nestjs/src/common/utils/ticket-calculation.util.ts).
 *
 * Used ONLY to show the cashier a live, accurate preview while a ticket is
 * still pending (before charging). The backend always recomputes the
 * authoritative amount at charge time using the real server clock — this
 * mirror must stay numerically identical to avoid confusing the cashier
 * with a preview that doesn't match what actually gets charged.
 */

/** Minutes of tolerance before charging the next hour (must match backend). */
export const SYSTEM_TOLERANCE_MINUTES = 10;

/**
 * Calculates the number of chargeable hours for a parking session.
 *
 * Rule: if the remaining minutes after a full hour are within the tolerance
 * window, that extra fraction is NOT charged. Otherwise, it rounds up.
 *
 * Examples (10 min tolerance): 1h10m → 1h · 1h11m → 2h · 2h10m → 2h · 2h11m → 3h
 */
export function calculateChargeableHours(
  totalMinutes: number,
  toleranceMinutes = SYSTEM_TOLERANCE_MINUTES,
): number {
  if (totalMinutes <= 0) return 1;

  const fullHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (remainingMinutes <= toleranceMinutes) {
    return Math.max(1, fullHours);
  }

  return Math.ceil(totalMinutes / 60);
}

/**
 * Calculates the parking fee for a HOUR_FRACTION ticket, given elapsed
 * minutes and the per-hour rate.
 */
export function calculateHourFractionAmount(
  totalMinutes: number,
  ratePerHour: number,
  toleranceMinutes = SYSTEM_TOLERANCE_MINUTES,
): { chargeableHours: number; amount: number } {
  const chargeableHours = calculateChargeableHours(totalMinutes, toleranceMinutes);
  const amount = parseFloat((chargeableHours * ratePerHour).toFixed(2));
  return { chargeableHours, amount };
}

/** Formats a duration in minutes as "Xd Xh Xm", omitting days when 0. */
export function formatDurationMinutes(totalMins: number): string {
  const mins = Math.max(0, Math.floor(totalMins));
  const d = Math.floor(mins / (60 * 24));
  const h = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
