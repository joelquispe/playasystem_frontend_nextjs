'use client';

import { Typography } from 'antd';
import dayjs from 'dayjs';
import type { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { calculateAdditionalChargesTotal } from '@/lib/ticket-calculation';
import { colors, nestedPanelStyle } from '@/lib/theme';

const { Text } = Typography;

interface TicketChargesListProps {
  ticket: Ticket;
}

/**
 * Billing end of a ticket: exit time when charged, void time when cancelled,
 * otherwise "now" (still parked). Hour/fraction charges are priced up to it.
 */
function resolveChargesEndTime(ticket: Ticket): Date {
  const end = ticket.exitTime ?? ticket.cancelledAt;
  return end ? new Date(end) : new Date();
}

/** Read-only breakdown of a ticket's additional charges (amanecida, hora/fracción extra). */
export function TicketChargesList({ ticket }: TicketChargesListProps) {
  const charges = ticket.charges ?? [];
  if (charges.length === 0) return null;

  const { total, breakdown } = calculateAdditionalChargesTotal(charges, resolveChargesEndTime(ticket));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {charges.map((c, index) => {
        const finalAmount = breakdown[index]?.finalAmount ?? parseFloat(c.amount);
        const isHourly = c.chargeType === 'hour_fraction';
        const appliedBy = c.appliedBy?.fullName ?? c.appliedBy?.username;

        return (
          <div
            key={c.id}
            style={{
              ...nestedPanelStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '6px 12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: 600 }}>
                {RATE_TYPE_LABELS[c.chargeType] ?? c.chargeType}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Aplicado {dayjs(c.appliedAt).format('DD/MM/YYYY HH:mm')}
                {appliedBy ? ` · por ${appliedBy}` : ''}
                {isHourly ? ` · tarifa s/. ${parseFloat(c.amount).toFixed(2)}/h` : ''}
              </Text>
              {c.notes && (
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{c.notes}</Text>
              )}
            </div>
            <Text style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.accent }}>
              s/. {finalAmount.toFixed(2)}
            </Text>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingRight: 12 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Total cargos adicionales:</Text>
        <Text strong style={{ fontSize: 13, color: colors.accent }}>
          s/. {total.toFixed(2)}
        </Text>
      </div>
    </div>
  );
}
