'use client';

import { Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { AttendanceRecord, AttendanceStatus, PaginationMeta } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { formatLimaDateTime, formatMinutesHHMM } from '@/lib/datetime';
import { cardStyle, colors } from '@/lib/theme';
import { AttendanceTimeCell } from '@/components/attendance/AttendanceTimeCell';

const { Text } = Typography;

const STATUS_COLOR: Partial<Record<AttendanceStatus, string>> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'error',
  INCOMPLETE: 'orange',
  PENDING: 'default',
  JUSTIFIED: 'blue',
  DAY_OFF: 'default',
};

/** Status label; late arrivals include the tardiness measured against the user's schedule. */
function statusLabel(r: AttendanceRecord): string {
  const label = ATTENDANCE_STATUS_LABELS[r.status] ?? r.status;
  return r.lateMinutes > 0 ? `${label} · ${formatMinutesHHMM(r.lateMinutes)}` : label;
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
      key: 'checkedInAt',
      render: (_: unknown, r: AttendanceRecord) => (
        <AttendanceTimeCell time={r.checkedInAt} session={r.checkInSession} />
      ),
    },
    {
      title: 'Salida',
      key: 'checkedOutAt',
      render: (_: unknown, r: AttendanceRecord) => (
        <AttendanceTimeCell time={r.checkedOutAt} session={r.checkOutSession} />
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
      render: (v: AttendanceStatus, r: AttendanceRecord) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{statusLabel(r)}</Tag>
      ),
    },
    {
      title: 'Trabajado',
      dataIndex: 'workedMinutes',
      key: 'workedMinutes',
      render: (v: number) => (v > 0 ? formatMinutesHHMM(v) : '—'),
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
