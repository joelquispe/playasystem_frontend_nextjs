'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  KeyOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { useToggleKey } from '@/hooks/useTickets';
import { cardStyle, colors, nestedPanelStyle } from '@/lib/theme';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Text } = Typography;

interface TicketCardProps {
  ticket: Ticket;
  onCharge: (ticket: Ticket) => void;
  onCancel: (ticket: Ticket) => void;
  onAddCharge: (ticket: Ticket) => void;
}

function useElapsedTime(entryTime: string): string {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const mins = dayjs().diff(dayjs(entryTime), 'minute');
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [entryTime]);

  return elapsed;
}

function getElapsedColor(entryTime: string): string {
  const mins = dayjs().diff(dayjs(entryTime), 'minute');
  if (mins < 60) return '#22c55e';
  if (mins < 180) return '#f59e0b';
  return '#ef4444';
}

export function TicketCard({ ticket, onCharge, onCancel, onAddCharge }: TicketCardProps) {
  const elapsed = useElapsedTime(ticket.entryTime);
  const elapsedColor = getElapsedColor(ticket.entryTime);
  const toggleKey = useToggleKey();

  const entryFormatted = dayjs(ticket.entryTime).format('HH:mm');
  const estimatedAmount =
    parseFloat(ticket.rateAmount) > 0 ? `s/. ${parseFloat(ticket.rateAmount).toFixed(2)}` : '—';

  const hasAdditionalCharges = ticket.charges && ticket.charges.length > 0;
  const additionalTotal = ticket.charges?.reduce((sum, c) => sum + parseFloat(c.amount), 0) ?? 0;

  return (
    <Card size="small" style={cardStyle} styles={{ body: { padding: '12px 14px' } }} hoverable>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <Text strong style={{ fontSize: 18, color: colors.text, letterSpacing: 1, fontFamily: 'monospace' }}>
            {ticket.plate}
          </Text>
          <div style={{ marginTop: 2 }}>
            <Tag icon={<CarOutlined />}>{ticket.vehicleType?.name ?? '—'}</Tag>
            {ticket.hasKey && (
              <Tag icon={<KeyOutlined />} color="warning">
                Llave
              </Tag>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: elapsedColor, fontFamily: 'monospace', lineHeight: 1 }}>
            {elapsed}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            <ClockCircleOutlined style={{ marginRight: 3 }} />
            Entrada: {entryFormatted}
          </div>
        </div>
      </div>

      <div
        style={{
          ...nestedPanelStyle,
          padding: '6px 10px',
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          {RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType}
        </Text>
        <Space>
          <Text style={{ fontSize: 13, color: colors.accent, fontWeight: 600 }}>{estimatedAmount}</Text>
          {hasAdditionalCharges && (
            <Tag color="orange" style={{ fontSize: 11 }}>
              +s/. {additionalTotal.toFixed(2)} extra
            </Tag>
          )}
        </Space>
      </div>

      <div style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: 'monospace' }}>
          #{ticket.ticketCode}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSubtle, marginLeft: 8 }}>
          · {ticket.cashier?.username}
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          type="primary"
          size="small"
          icon={<DollarOutlined />}
          onClick={() => onCharge(ticket)}
          style={{ flex: 1, background: colors.accent, borderColor: colors.accent }}
        >
          Cobrar
        </Button>

        <Tooltip title="Agregar cargo">
          <Button size="small" icon={<PlusCircleOutlined />} onClick={() => onAddCharge(ticket)} />
        </Tooltip>

        <Tooltip title={ticket.hasKey ? 'Quitar llave' : 'Marcar con llave'}>
          <Button
            size="small"
            icon={<KeyOutlined />}
            loading={toggleKey.isPending}
            onClick={() => toggleKey.mutate(ticket.id)}
            type={ticket.hasKey ? 'primary' : 'default'}
            style={ticket.hasKey ? { background: '#f59e0b', borderColor: '#f59e0b' } : undefined}
          />
        </Tooltip>

        <Tooltip title="Cancelar ticket">
          <Button size="small" danger icon={<MinusCircleOutlined />} onClick={() => onCancel(ticket)} />
        </Tooltip>
      </div>
    </Card>
  );
}
