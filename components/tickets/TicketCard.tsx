'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
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
    parseFloat(ticket.rateAmount) > 0
      ? `s/. ${parseFloat(ticket.rateAmount).toFixed(2)}`
      : '—';

  const hasAdditionalCharges = ticket.charges && ticket.charges.length > 0;
  const additionalTotal = ticket.charges?.reduce((sum, c) => sum + parseFloat(c.amount), 0) ?? 0;

  return (
    <Card
      size="small"
      style={{
        background: '#1a1a1a',
        border: '1px solid #2d2d2d',
        borderRadius: 12,
        transition: 'border-color 0.2s',
      }}
      styles={{ body: { padding: '12px 14px' } }}
      hoverable
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <Text
            strong
            style={{ fontSize: 18, color: '#fff', letterSpacing: 1, fontFamily: 'monospace' }}
          >
            {ticket.plate}
          </Text>
          <div style={{ marginTop: 2 }}>
            <Tag
              icon={<CarOutlined />}
              style={{ fontSize: 11, background: '#242424', border: '1px solid #333', color: '#bbb' }}
            >
              {ticket.vehicleType?.name ?? '—'}
            </Tag>
            {ticket.hasKey && (
              <Tag
                icon={<KeyOutlined />}
                style={{ fontSize: 11, background: '#1c1207', border: '1px solid #784c00', color: '#f59e0b' }}
              >
                Llave
              </Tag>
            )}
          </div>
        </div>

        {/* Elapsed time badge */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: elapsedColor,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            {elapsed}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            <ClockCircleOutlined style={{ marginRight: 3 }} />
            Entrada: {entryFormatted}
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div
        style={{
          background: '#111',
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 12, color: '#888' }}>
          {RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType}
        </Text>
        <Space>
          <Text style={{ fontSize: 13, color: '#db2777', fontWeight: 600 }}>
            {estimatedAmount}
          </Text>
          {hasAdditionalCharges && (
            <Tag color="orange" style={{ fontSize: 11 }}>
              +s/. {additionalTotal.toFixed(2)} extra
            </Tag>
          )}
        </Space>
      </div>

      {/* Ticket code */}
      <div style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
          #{ticket.ticketCode}
        </Text>
        <Text style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>
          · {ticket.cashier?.username}
        </Text>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          type="primary"
          size="small"
          icon={<DollarOutlined />}
          onClick={() => onCharge(ticket)}
          style={{ flex: 1, background: '#db2777', borderColor: '#db2777' }}
        >
          Cobrar
        </Button>

        <Tooltip title="Agregar cargo">
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => onAddCharge(ticket)}
            style={{ background: '#242424', border: '1px solid #333' }}
          />
        </Tooltip>

        <Tooltip title={ticket.hasKey ? 'Quitar llave' : 'Marcar con llave'}>
          <Button
            size="small"
            icon={<KeyOutlined />}
            loading={toggleKey.isPending}
            onClick={() => toggleKey.mutate(ticket.id)}
            style={{
              background: ticket.hasKey ? '#1c1207' : '#242424',
              border: `1px solid ${ticket.hasKey ? '#784c00' : '#333'}`,
              color: ticket.hasKey ? '#f59e0b' : '#888',
            }}
          />
        </Tooltip>

        <Tooltip title="Cancelar ticket">
          <Button
            size="small"
            danger
            icon={<MinusCircleOutlined />}
            onClick={() => onCancel(ticket)}
            style={{ background: '#2a0f0f', border: '1px solid #5c1717' }}
          />
        </Tooltip>
      </div>
    </Card>
  );
}
