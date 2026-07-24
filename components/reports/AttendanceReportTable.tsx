'use client';

import { Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { AttendanceRecord, AttendanceStatus, PaginationMeta } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

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
    // {
    //   title: 'Notas',
    //   dataIndex: 'notes',
    //   key: 'notes',
    //   render: (v: string | null) => (
    //     <Text style={{ color: colors.textMuted, fontSize: 12 }}>{v ?? '—'}</Text>
    //   ),
    // },
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
      scroll={{ x: 900 }}
      style={cardStyle}
    />
  );
}
