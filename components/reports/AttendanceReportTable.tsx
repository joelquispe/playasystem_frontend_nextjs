'use client';

import { Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { AttendanceRecord, AttendanceStatus, PaginationMeta } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { formatLimaDateTime } from '@/lib/datetime';
import { cardStyle, colors } from '@/lib/theme';
import { SessionCell } from '@/components/attendance/SessionCell';

const { Text } = Typography;

const STATUS_COLOR: Partial<Record<AttendanceStatus, string>> = {
  PRESENT: 'success',
  LATE: 'success',
  ABSENT: 'error',
  INCOMPLETE: 'orange',
  PENDING: 'default',
  JUSTIFIED: 'blue',
  DAY_OFF: 'default',
};

/** Display label — LATE is shown as Presente (tardiness UI omitted). */
function statusLabel(status: AttendanceStatus): string {
  if (status === 'LATE') return ATTENDANCE_STATUS_LABELS.PRESENT ?? 'Presente';
  return ATTENDANCE_STATUS_LABELS[status] ?? status;
}

/**
 * PLAYA-308: a worker is a "cajero" only if at least one of their registers
 * had real activity (was closed or collected money).
 */
function workedInCaja(r: AttendanceRecord): boolean {
  return (r.cashRegisters ?? []).some((c) => (c as { hasActivity?: boolean }).hasActivity);
}

function resolveCashOpen(r: AttendanceRecord): string | null {
  if (!workedInCaja(r)) return null;
  if (r.cashRegisterOpenedAt) return r.cashRegisterOpenedAt;
  const first = (r.cashRegisters ?? []).find((c) => (c as { hasActivity?: boolean }).hasActivity);
  return first?.createdAt ?? null;
}

function resolveCashClose(r: AttendanceRecord): string | null {
  if (!workedInCaja(r)) return null;
  if (r.cashRegisterClosedAt) return r.cashRegisterClosedAt;
  const regs = (r.cashRegisters ?? []).filter(
    (c) => (c as { hasActivity?: boolean }).hasActivity,
  );
  if (regs.length === 0 || regs.some((c) => !c.closedAt)) return null;
  return regs.reduce((latest, c) => {
    if (!c.closedAt) return latest;
    if (!latest || c.closedAt > latest) return c.closedAt;
    return latest;
  }, null as string | null);
}

interface AttendanceReportTableProps {
  items: AttendanceRecord[];
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function AttendanceReportTable({
  items,
  meta,
  loading,
  onPageChange,
}: AttendanceReportTableProps) {
  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Fecha',
      dataIndex: 'attendanceDate',
      key: 'attendanceDate',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Usuario',
      key: 'user',
      render: (_: unknown, r: AttendanceRecord) => (
        <Text style={{ color: colors.text }}>{r.user?.fullName ?? '—'}</Text>
      ),
    },
    {
      title: 'Entrada esperada',
      dataIndex: 'expectedEntryAt',
      key: 'expectedEntryAt',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm') : '—'),
    },
    {
      title: 'Entrada',
      dataIndex: 'checkedInAt',
      key: 'checkedInAt',
      render: (v: string | null) =>
        v ? dayjs(v).format('HH:mm') : <Text style={{ color: colors.textSubtle }}>—</Text>,
    },
    {
      title: 'Salida',
      dataIndex: 'checkedOutAt',
      key: 'checkedOutAt',
      render: (v: string | null) =>
        v ? dayjs(v).format('HH:mm') : <Text style={{ color: colors.textSubtle }}>—</Text>,
    },
    {
      title: 'Sesión ingreso',
      key: 'checkInSession',
      width: 140,
      render: (_: unknown, r: AttendanceRecord) => (
        <SessionCell session={r.checkInSession} sessionId={r.checkInSessionId} />
      ),
    },
    {
      title: 'Sesión salida',
      key: 'checkOutSession',
      width: 140,
      render: (_: unknown, r: AttendanceRecord) => (
        <SessionCell session={r.checkOutSession} sessionId={r.checkOutSessionId} />
      ),
    },
    {
      title: 'Caja abierta',
      key: 'cashRegisterOpenedAt',
      width: 150,
      render: (_: unknown, r: AttendanceRecord) => {
        const v = resolveCashOpen(r);
        return v ? (
          <Text style={{ fontSize: 12 }}>{formatLimaDateTime(v)}</Text>
        ) : (
          <Text style={{ color: colors.textSubtle }}>—</Text>
        );
      },
    },
    {
      title: 'Caja cerrada',
      key: 'cashRegisterClosedAt',
      width: 150,
      render: (_: unknown, r: AttendanceRecord) => {
        const v = resolveCashClose(r);
        return v ? (
          <Text style={{ fontSize: 12 }}>{formatLimaDateTime(v)}</Text>
        ) : (
          <Text style={{ color: colors.textSubtle }}>—</Text>
        );
      },
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v: AttendanceStatus) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{statusLabel(v)}</Tag>
      ),
    },
    {
      title: 'Trabajado',
      dataIndex: 'workedMinutes',
      key: 'workedMinutes',
      render: (v: number) => (v > 0 ? `${v} min` : '—'),
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
  );
}
