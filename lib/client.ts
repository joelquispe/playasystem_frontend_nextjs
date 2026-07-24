import type { Client } from '@/types/api';

function specialRateValue(
  client: Pick<Client, 'specialRate'> | null | undefined,
): number {
  if (!client) return 0;
  const rate = Number(client.specialRate);
  return Number.isFinite(rate) ? rate : 0;
}

/** Cliente con tarifa especial configurada (specialRate > 0). */
export function hasSpecialRate(
  client: Pick<Client, 'specialRate'> | null | undefined,
): boolean {
  return specialRateValue(client) > 0;
}

/** Cliente frecuente / amable (eventColor green). */
export function isFrequentClient(
  client: Pick<Client, 'eventColor'> | null | undefined,
): boolean {
  return client?.eventColor === 'green';
}

/**
 * Tarifa especial + frecuente: specialRate > 0 AND eventColor green.
 * Used when both conditions apply (purple special-rate card).
 */
export function isSpecialFrequentClient(
  client: Pick<Client, 'specialRate' | 'eventColor'> | null | undefined,
): boolean {
  return hasSpecialRate(client) && isFrequentClient(client);
}

/** Monto de tarifa especial, o null si no aplica. */
export function getSpecialRateAmount(
  client: Pick<Client, 'specialRate'> | null | undefined,
): number | null {
  const rate = specialRateValue(client);
  return rate > 0 ? rate : null;
}

/** Mostrar card lateral: abonado, tarifa especial o frecuente. */
export function shouldShowClientCard(
  client: Pick<Client, 'specialRate' | 'eventColor'> | null | undefined,
): boolean {
  return hasSpecialRate(client) || isFrequentClient(client);
}
