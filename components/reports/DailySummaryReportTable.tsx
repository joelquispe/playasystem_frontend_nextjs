'use client';

import { Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { DailySummaryTotals, PaginationMeta, Ticket } from '@/types/api';
import { PAYMENT_METHOD_LABELS, RATE_TYPE_LABELS, TICKET_STATUS_LABELS } from '@/lib/constants';
import { FINANCIAL_LABELS } from '@/lib/financials';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  pending: 'processing',
  paid: 'success',
  cancelled: 'error',
  manual: 'warning',
};

interface DailySummaryReportTableProps {
  items: Ticket[];
  summary?: DailySummaryTotals;
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function DailySummaryReportTable({
  items,
  summary,
  meta,
  loading,
  onPageChange,
}: DailySummaryReportTableProps) {
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
      title: 'Tipo',
      dataIndex: 'rateType',
      key: 'rateType',
      width: 120,
      render: (v: string) => RATE_TYPE_LABELS[v] ?? v,
    },
    {
      title: 'Vehículo',
      key: 'vehicle',
      width: 110,
      render: (_: unknown, r: Ticket) => r.vehicleType?.name ?? '—',
    },
    {
      title: 'H. Ingreso',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 90,
      render: (v: string) => dayjs(v).format('HH:mm:ss'),
    },
    {
      title: 'H. Salida',
      dataIndex: 'exitTime',
      key: 'exitTime',
      width: 90,
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '—'),
    },
    {
      title: 'Tiempo',
      dataIndex: 'totalMinutes',
      key: 'totalMinutes',
      width: 80,
      render: (v: number | null) => (v != null ? `${v} min` : '—'),
    },
    {
      title: 'Tarifa',
      dataIndex: 'rateAmount',
      key: 'rateAmount',
      width: 80,
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Monto Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Descuento',
      dataIndex: 'discount',
      key: 'discount',
      width: 90,
      render: (v: string) =>
        parseFloat(v) > 0 ? <Text type="danger">- s/. {parseFloat(v).toFixed(2)}</Text> : '—',
    },
    {
      title: 'Medio de pago',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 110,
      render: (v: string | null) => (v ? PAYMENT_METHOD_LABELS[v] ?? v : '—'),
    },
    {
      title: 'Obs. descuento',
      dataIndex: 'discountObservation',
      key: 'discountObservation',
      width: 200,
      render: (v: string | null) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{v?.trim() || '—'}</Text>
      ),
    },
    {
      title: 'TOTAL',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 100,
      render: (v: string) => (
        <Text style={{ color: colors.accent, fontWeight: 600 }}>
          s/. {parseFloat(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{TICKET_STATUS_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Observaciones',
      dataIndex: 'observation',
      key: 'observation',
      width: 220,
      render: (v: string | null) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{v ?? '—'}</Text>
      ),
    },
  ];

  const pagination: TablePaginationConfig | false = meta
    ? {
        current: meta.page,
        pageSize: meta.limit,
        total: meta.totalItems,
        showSizeChanger: false,
        onChange: onPageChange,
      }
    : false;

  return (
    <>
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {[
            { label: FINANCIAL_LABELS.grossIncome, value: summary.grossIncome, color: '#16a34a', money: true },
            { label: FINANCIAL_LABELS.discounts, value: summary.discounts, color: '#f59e0b', money: true },
            { label: FINANCIAL_LABELS.expenses, value: summary.expenses, color: '#ef4444', money: true },
            { label: FINANCIAL_LABELS.netExpenses, value: summary.netExpenses, color: '#ef4444', money: true },
            { label: FINANCIAL_LABELS.netIncomeDay, value: summary.netIncome, color: colors.accent, money: true },
            { label: FINANCIAL_LABELS.expectedCash, value: summary.expectedCash, color: '#16a34a', money: true },
            { label: 'Tickets cobrados', value: summary.paidTickets, color: '#3b82f6', money: false },
            { label: 'Tickets anulados', value: summary.cancellationsCount, color: '#ef4444', money: false },
            { label: 'Tickets pendientes', value: summary.pendingTickets, color: '#f59e0b', money: false },
          ].map(({ label, value, color, money }) => (
            <Col key={label} xs={12} sm={8} lg={6} xl={4}>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>}
                  value={value}
                  precision={money ? 2 : 0}
                  prefix={money ? 's/.' : undefined}
                  valueStyle={{ color, fontSize: 22, fontWeight: 700 }}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        size="small"
        scroll={{ x: 1400 }}
        style={cardStyle}
      />
    </>
  );
}
