'use client';

import { Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { CashRegisterReportItem, CashRegisterReportSummary, PaginationMeta } from '@/types/api';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

interface CashRegisterReportTableProps {
  items: CashRegisterReportItem[];
  summary?: CashRegisterReportSummary;
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
}

function money(v: string | number): string {
  return `s/. ${Number(v).toFixed(2)}`;
}

export function CashRegisterReportTable({
  items,
  summary,
  meta,
  loading,
  onPageChange,
}: CashRegisterReportTableProps) {
  const columns: ColumnsType<CashRegisterReportItem> = [
    {
      title: 'Fecha',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      fixed: 'left',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Cajero',
      key: 'cashier',
      width: 140,
      render: (_: unknown, r: CashRegisterReportItem) => r.cashier?.fullName ?? '—',
    },
    { title: 'Efectivo', dataIndex: 'cashAmount', key: 'cashAmount', width: 90, render: money },
    { title: 'Yape', dataIndex: 'yapeAmount', key: 'yapeAmount', width: 90, render: money },
    { title: 'Plin', dataIndex: 'plinAmount', key: 'plinAmount', width: 90, render: money },
    { title: 'Tarjeta', dataIndex: 'cardAmount', key: 'cardAmount', width: 90, render: money },
    { title: 'Descuentos', dataIndex: 'discountsTotal', key: 'discountsTotal', width: 100, render: money },
    {
      title: 'Anulaciones',
      key: 'cancellations',
      width: 130,
      render: (_: unknown, r: CashRegisterReportItem) =>
        `${r.cancellationsCount} (${money(r.cancellationsTotal)})`,
    },
    {
      title: 'Tickets Procesados',
      dataIndex: 'ticketsCount',
      key: 'ticketsCount',
      width: 90,
      align: 'center',
    },
    { title: 'Gastos/Caja', dataIndex: 'extraExpenses', key: 'extraExpenses', width: 100, render: money },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (v: string) => (
        <Text style={{ color: colors.accent, fontWeight: 600 }}>{money(v)}</Text>
      ),
    },
    {
      title: 'Estado Cuadre',
      dataIndex: 'balanceStatus',
      key: 'balanceStatus',
      width: 110,
      render: (v: string | null) =>
        v ? (
          <Tag color={v === 'balanced' ? 'success' : 'error'}>
            {v === 'balanced' ? 'Sí Cuadra' : 'No Cuadra'}
          </Tag>
        ) : (
          <Tag>Abierto</Tag>
        ),
    },
    {
      title: 'Observación',
      dataIndex: 'balanceNotes',
      key: 'balanceNotes',
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
            { label: 'Ingreso del período', value: summary.totalRevenue, color: '#16a34a' },
            { label: 'Tickets Anulados', value: summary.totalCancellationsCount, color: '#ef4444' },
            { label: 'Monto Anulado', value: summary.totalCancellationsAmount, color: '#ef4444' },
            { label: 'Descuentos', value: summary.totalDiscounts, color: '#f59e0b' },
            { label: 'Gastos de caja', value: summary.totalExpenses, color: '#ef4444' },
            { label: 'Tickets Procesados', value: summary.totalTicketsCount, color: colors.primary },
          ].map(({ label, value, color }) => (
            <Col key={label} xs={12} sm={8} md={4}>
              <div style={{ ...cardStyle, padding: '12px 16px' }}>
                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>}
                  value={value}
                  precision={label.includes('Tickets') ? 0 : 2}
                  prefix={label.includes('Tickets') ? undefined : 's/.'}
                  valueStyle={{ color, fontSize: 18, fontWeight: 700 }}
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
        scroll={{ x: 1300 }}
        style={cardStyle}
      />
    </>
  );
}
