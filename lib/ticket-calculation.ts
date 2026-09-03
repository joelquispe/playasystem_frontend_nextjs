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

export interface HourFractionChargeCutoff {
  chargeType: string;
  appliedAt: string | Date;
}

/**
 * When an overnight (amanecida) charge exists, hour/fraction billing must
 * stop at the moment that charge was applied — not at final payment time.
 */
export function resolveHourFractionExitTime(
  entryTime: Date,
  paymentExitTime: Date,
  charges: HourFractionChargeCutoff[],
): Date {
  const overnightAppliedAt = charges
    .filter((c) => c.chargeType === 'overnight')
    .map((c) => new Date(c.appliedAt))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (overnightAppliedAt.length === 0) {
    return paymentExitTime;
  }

  const earliestOvernight = new Date(
    Math.min(...overnightAppliedAt.map((d) => d.getTime())),
  );

  const entryMs = entryTime.getTime();
  const exitMs = paymentExitTime.getTime();
  const cutoffMs = earliestOvernight.getTime();

  if (cutoffMs <= entryMs) {
    return entryTime;
  }

  return cutoffMs < exitMs ? earliestOvernight : paymentExitTime;
}

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

/** PLAYA-311/312: rate types that use a fixed price, not per-hour. */
export function isFixedRateType(rateType: string): boolean {
  return rateType === 'overnight' || rateType === 'flat' || rateType === 'subscriber';
}

export interface AdditionalChargePreview {
  chargeType: string;
  amount: string | number;
  appliedAt: string | Date;
}

/**
 * Calculates the total for all additional charges at a given exit time.
 *
 * - overnight / flat: fixed amount as stored.
 * - hour_fraction (PLAYA-314): `amount` is the rate per hour; final cost =
 *   rate × chargeable hours elapsed since `appliedAt`.
 */
export function calculateAdditionalChargesTotal(
  charges: AdditionalChargePreview[],
  exitTime: Date,
): { total: number; breakdown: Array<{ charge: AdditionalChargePreview; finalAmount: number }> } {
  let total = 0;
  const breakdown: Array<{ charge: AdditionalChargePreview; finalAmount: number }> = [];

  for (const c of charges) {
    let finalAmount: number;
    if (c.chargeType === 'hour_fraction') {
      const appliedAt = new Date(c.appliedAt);
      const diffMs = Math.max(0, exitTime.getTime() - appliedAt.getTime());
      const totalMinutes = Math.floor(diffMs / 60_000);
      const { amount } = calculateHourFractionAmount(totalMinutes, parseFloat(String(c.amount)));
      finalAmount = amount;
    } else {
      finalAmount = parseFloat(String(c.amount));
    }
    total += finalAmount;
    breakdown.push({ charge: c, finalAmount });
  }

  return { total, breakdown };
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
