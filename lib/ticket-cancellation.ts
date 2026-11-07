import type { Ticket } from '@/types/api';
import { minutesBetween } from '@/lib/datetime';

export interface TicketCancellationTimes {
  /** When the ticket was issued */
  createdAt: string;
  /** When the ticket was voided (null for legacy rows without the timestamp) */
  cancelledAt: string | null;
  /** Minutes between issue and cancellation (null when `cancelledAt` is unknown) */
  elapsedMinutes: number | null;
}

/**
 * Issue/void timestamps of a cancelled ticket, used to audit how long the
 * vehicle stayed before the cancellation. Returns null for non-cancelled tickets.
 */
export function getTicketCancellationTimes(ticket: Ticket): TicketCancellationTimes | null {
  if (ticket.status !== 'cancelled') return null;

  return {
    createdAt: ticket.createdAt,
    cancelledAt: ticket.cancelledAt,
    elapsedMinutes: ticket.cancelledAt ? minutesBetween(ticket.createdAt, ticket.cancelledAt) : null,
  };
}
