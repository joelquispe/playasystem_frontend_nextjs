'use client';

import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import { PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

interface DailyReportTableProps {
  tickets: Ticket[];
  loading?: boolean;
}

export function DailyReportTable({ tickets, loading }: DailyReportTableProps) {
  const columns: ColumnsType<Ticket> = [
    {
      title: 'Placa',
      dataIndex: 'plate',
      key: 'plate',
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', color: colors.text }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Vehículo',
      key: 'vehicle',
      render: (_: unknown, r: Ticket) => r.vehicleType?.name ?? '—',
    },
    {
      title: 'Ingreso',
      dataIndex: 'entryTime',
      key: 'entryTime',
      render: (v: string) => dayjs(v).format('HH:mm:ss'),
    },
    {
      title: 'Salida',
      dataIndex: 'exitTime',
      key: 'exitTime',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '—'),
    },
    {
      title: 'Tarifa',
      dataIndex: 'rateAmount',
      key: 'rateAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (v: string) => (
        <Text style={{ color: '#db2777', fontWeight: 600 }}>
          s/. {parseFloat(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Descuento',
      dataIndex: 'discount',
      key: 'discount',
      render: (v: string) =>
        parseFloat(v) > 0 ? `s/. ${parseFloat(v).toFixed(2)}` : '—',
    },
    {
      title: 'Pago',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (v: string | null) => (v ? PAYMENT_METHOD_LABELS[v] ?? v : '—'),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag>{TICKET_STATUS_LABELS[v] ?? v}</Tag>,
    },
    {
      title: 'Tipo',
      dataIndex: 'rateType',
      key: 'rateType',
      render: (v: string) => RATE_TYPE_LABELS[v] ?? v,
    },
  ];

  const total = tickets.reduce((s, t) => s + parseFloat(t.finalAmount || '0'), 0);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textMuted }}>
          {tickets.length} tickets · Total:{' '}
          <Text strong style={{ color: '#db2777' }}>
            s/. {total.toFixed(2)}
          </Text>
        </Text>
      </div>
      <Table
        dataSource={tickets}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        size="small"
        scroll={{ x: 900 }}
        style={cardStyle}
      />
    </>
  );
}
