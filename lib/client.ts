import type { Client } from '@/types/api';

/**
 * "Es cliente" / tarifa especial frecuente:
 * only when specialRate > 0 AND eventColor is green (Frecuente / Amable).
 */
export function isSpecialFrequentClient(
  client: Pick<Client, 'specialRate' | 'eventColor'> | null | undefined,
): boolean {
  if (!client) return false;
  const rate = Number(client.specialRate);
  return Number.isFinite(rate) && rate > 0 && client.eventColor === 'green';
}
