'use client';

import { Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { AccumulatedLateTime, AttendanceRecord, AttendanceStatus, PaginationMeta } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

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

interface AttendanceReportTableProps {
  items: AttendanceRecord[];
  accumulatedLateTime?: AccumulatedLateTime;
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function AttendanceReportTable({
  items,
  accumulatedLateTime,
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
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{ATTENDANCE_STATUS_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Tardanza',
      dataIndex: 'lateMinutes',
      key: 'lateMinutes',
      render: (v: number) =>
        v > 0 ? (
          <Text style={{ color: '#f59e0b' }}>{v} min</Text>
        ) : (
          <Text style={{ color: colors.textSubtle }}>—</Text>
        ),
    },
    {
      title: 'Trabajado',
      dataIndex: 'workedMinutes',
      key: 'workedMinutes',
      render: (v: number) => (v > 0 ? `${v} min` : '—'),
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
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
      {accumulatedLateTime && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}>
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Registros</Text>}
                value={meta?.totalItems ?? items.length}
                valueStyle={{ color: colors.primary, fontSize: 22, fontWeight: 700 }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Tardanza acumulada</Text>}
                value={accumulatedLateTime.formatted}
                valueStyle={{ color: '#ef4444', fontSize: 22, fontWeight: 700 }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ ...cardStyle, padding: '14px 18px' }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Total minutos tarde</Text>}
                value={accumulatedLateTime.totalMinutes}
                suffix=" min"
                valueStyle={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}
              />
            </div>
          </Col>
        </Row>
      )}

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        size="small"
        scroll={{ x: 1000 }}
        style={cardStyle}
      />
    </>
  );
}
