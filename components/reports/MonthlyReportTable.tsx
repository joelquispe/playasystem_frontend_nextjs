'use client';

import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CashRegister } from '@/types/api';
import { PAYMENT_METHOD_LABELS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

interface MonthlyReportTableProps {
  shifts: CashRegister[];
  loading?: boolean;
}

export function MonthlyReportTable({ shifts, loading }: MonthlyReportTableProps) {
  const columns: ColumnsType<CashRegister> = [
    {
      title: 'Fecha',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Cajero',
      key: 'cashier',
      render: (_: unknown, r: CashRegister) => r.cashier?.fullName ?? '—',
    },
    {
      title: 'Asistencia',
      key: 'attendance',
      width: 110,
      render: (_: unknown, r: CashRegister) => {
        const status = r.attendance?.status;
        if (!status) return <Tag>Sin marca</Tag>;
        const color =
          status === 'PRESENT'
            ? 'success'
            : status === 'LATE'
              ? 'warning'
              : status === 'ABSENT' || status === 'INCOMPLETE'
                ? 'error'
                : 'default';
        return <Tag color={color}>{ATTENDANCE_STATUS_LABELS[status] ?? status}</Tag>;
      },
    },
    {
      title: 'Tardanza',
      key: 'lateMinutes',
      width: 90,
      render: (_: unknown, r: CashRegister) => {
        const mins = r.attendance?.lateMinutes ?? 0;
        return mins > 0 ? (
          <Text type="danger">{mins} min</Text>
        ) : (
          <Text type="secondary">0</Text>
        );
      },
    },
    {
      title: 'Efectivo',
      dataIndex: 'cashAmount',
      key: 'cashAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Yape',
      dataIndex: 'yapeAmount',
      key: 'yapeAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Plin',
      dataIndex: 'plinAmount',
      key: 'plinAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Tarjeta',
      dataIndex: 'cardAmount',
      key: 'cardAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Descuentos',
      dataIndex: 'discountsTotal',
      key: 'discountsTotal',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Anulados',
      key: 'cancellations',
      render: (_: unknown, r: CashRegister) =>
        `${r.cancellationsCount} (s/. ${parseFloat(r.cancellationsTotal).toFixed(2)})`,
    },
    {
      title: 'Gastos',
      dataIndex: 'extraExpenses',
      key: 'extraExpenses',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: string) => (
        <Text style={{ color: '#db2777', fontWeight: 600 }}>
          s/. {parseFloat(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Cuadre',
      dataIndex: 'balanceStatus',
      key: 'balanceStatus',
      render: (v: string | null) =>
        v ? (
          <Tag color={v === 'balanced' ? 'success' : 'error'}>
            {v === 'balanced' ? 'Cuadra' : 'No cuadra'}
          </Tag>
        ) : (
          <Tag>Abierto</Tag>
        ),
    },
  ];

  const total = shifts.reduce((s, r) => s + parseFloat(r.totalAmount || '0'), 0);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textMuted }}>
          {shifts.length} turnos cerrados · Total:{' '}
          <Text strong style={{ color: '#db2777' }}>
            s/. {total.toFixed(2)}
          </Text>
        </Text>
      </div>
      <Table
        dataSource={shifts}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        size="small"
        scroll={{ x: 1100 }}
        style={cardStyle}
      />
    </>
  );
}
