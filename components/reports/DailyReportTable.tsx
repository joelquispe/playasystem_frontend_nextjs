'use client';

import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, FilePdfOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import {
  PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  RECEIPT_TYPE_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  pending: 'processing',
  paid: 'success',
  cancelled: 'error',
  manual: 'warning',
};

interface DailyReportTableProps {
  tickets: Ticket[];
  loading?: boolean;
  onDetail?: (ticket: Ticket) => void;
}

export function DailyReportTable({ tickets, loading, onDetail }: DailyReportTableProps) {
  const columns: ColumnsType<Ticket> = [
    {
      title: 'Placa',
      dataIndex: 'plate',
      key: 'plate',
      fixed: 'left',
      width: 90,
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', color: colors.text }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Vehículo',
      key: 'vehicle',
      width: 110,
      render: (_: unknown, r: Ticket) => r.vehicleType?.name ?? '—',
    },
    {
      title: 'Ingreso',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 80,
      render: (v: string) => dayjs(v).format('HH:mm:ss'),
    },
    {
      title: 'Salida',
      dataIndex: 'exitTime',
      key: 'exitTime',
      width: 80,
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '—'),
    },
    {
      title: 'Tarifa',
      dataIndex: 'rateType',
      key: 'rateType',
      width: 120,
      render: (v: string) => RATE_TYPE_LABELS[v] ?? v,
    },
    {
      title: 'Total',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 90,
      render: (v: string) => (
        <Text style={{ color: colors.accent, fontWeight: 600 }}>
          s/. {parseFloat(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Descuento',
      dataIndex: 'discount',
      key: 'discount',
      width: 90,
      render: (v: string) =>
        parseFloat(v) > 0 ? (
          <Text type="danger">- s/. {parseFloat(v).toFixed(2)}</Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Pago',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 90,
      render: (v: string | null) => (v ? PAYMENT_METHOD_LABELS[v] ?? v : '—'),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{TICKET_STATUS_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Comprobante',
      key: 'receipt',
      width: 160,
      render: (_: unknown, r: Ticket) => {
        const type = r.receiptType;
        if (!type || type === 'vale') {
          return <Tag>Vale</Tag>;
        }
        return (
          <Space size={4}>
            <Tag color={type === 'factura' ? 'blue' : 'green'}>
              {RECEIPT_TYPE_LABELS[type] ?? type}
            </Tag>
            {r.nubefactEnlace && (
              <Tooltip title="Ver en NubeFact">
                <a href={r.nubefactEnlace} target="_blank" rel="noopener noreferrer">
                  <Button type="text" size="small" icon={<LinkOutlined />} />
                </a>
              </Tooltip>
            )}
            {r.nubefactPdfUrl && (
              <Tooltip title="Descargar PDF">
                <a href={r.nubefactPdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="text" size="small" icon={<FilePdfOutlined style={{ color: '#dc2626' }} />} />
                </a>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Cliente',
      key: 'customer',
      width: 160,
      render: (_: unknown, r: Ticket) => {
        const name = r.customerBusinessName;
        const doc = r.customerRuc
          ? `RUC ${r.customerRuc}`
          : r.customerDni
          ? `DNI ${r.customerDni}`
          : null;
        if (!name && !doc) return '—';
        return (
          <Space direction="vertical" size={0}>
            {name && <Text style={{ fontSize: 12 }}>{name}</Text>}
            {doc && <Text style={{ fontSize: 11, color: colors.textMuted }}>{doc}</Text>}
          </Space>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_: unknown, r: Ticket) =>
        onDetail ? (
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onDetail(r)}
              style={{ color: colors.primary }}
            />
          </Tooltip>
        ) : null,
    },
  ];

  const total = tickets.reduce((s, t) => s + parseFloat(t.finalAmount || '0'), 0);
  const paidCount = tickets.filter((t) => t.status === 'paid' || t.status === 'manual').length;
  const receiptCount = tickets.filter(
    (t) => t.receiptType === 'boleta' || t.receiptType === 'factura',
  ).length;

  return (
    <>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        <Text style={{ color: colors.textMuted }}>
          {tickets.length} tickets ·{' '}
          <Text strong style={{ color: colors.text }}>{paidCount} cobrados</Text>
        </Text>
        <Text style={{ color: colors.textMuted }}>
          Total:{' '}
          <Text strong style={{ color: colors.accent }}>
            s/. {total.toFixed(2)}
          </Text>
        </Text>
        {receiptCount > 0 && (
          <Text style={{ color: colors.textMuted }}>
            Comprobantes electrónicos:{' '}
            <Text strong style={{ color: colors.primary }}>{receiptCount}</Text>
          </Text>
        )}
      </div>
      <Table
        dataSource={tickets}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="small"
        scroll={{ x: 1100 }}
        style={cardStyle}
      />
    </>
  );
}
