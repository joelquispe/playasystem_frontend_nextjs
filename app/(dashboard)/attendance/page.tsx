'use client';

import { useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAttendance, useAttendanceSummary } from '@/hooks/useAttendance';
import { useUsers } from '@/hooks/useUsers';
import { AttendanceRecord, AttendanceStatus } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
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

/**
 * Admin attendance list — field mapping updated for AttendanceRecord API.
 * Full UX redesign deferred; only keeps the page compiling against the new hooks.
 */
export default function AttendancePage() {
  const now = dayjs();
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<Dayjs>(now);

  const year = month.year();
  const monthNum = month.month() + 1;

  const { data: users = [] } = useUsers();
  const {
    data: records = [],
    isLoading,
    isFetching,
    refetch,
  } = useAttendance({ userId: selectedUser, year, month: monthNum });

  const { data: summary } = useAttendanceSummary(
    selectedUser ? { userId: selectedUser, year, month: monthNum } : undefined,
  );

  const userOptions = users
    .filter((u) => u.isActive)
    .map((u) => ({ label: u.fullName, value: u.id }));

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
      render: (_: unknown, record: AttendanceRecord) => (
        <Text style={{ color: colors.text }}>{record.user?.fullName ?? '—'}</Text>
      ),
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
        <Tag color={STATUS_COLOR[v] ?? 'default'}>
          {ATTENDANCE_STATUS_LABELS[v] ?? v}
        </Tag>
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
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      render: (v: string | null) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{v ?? '—'}</Text>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Asistencia"
        subtitle={month.format('MMMM YYYY')}
        extra={
          <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
            Actualizar
          </Button>
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Usuario:</Text>
        <Select
          value={selectedUser}
          onChange={setSelectedUser}
          options={userOptions}
          placeholder="Todos los usuarios"
          style={{ width: 220 }}
          allowClear
        />
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Mes:</Text>
        <DatePicker
          picker="month"
          value={month}
          onChange={(v) => v && setMonth(v)}
          format="MMMM YYYY"
          allowClear={false}
        />
      </div>

      {summary && selectedUser && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {[
            { label: 'Días con tardanza', value: summary.lateCount, color: '#f59e0b' },
            {
              label: 'Minutos de tardanza',
              value: summary.totalLateMinutes,
              color: '#ef4444',
              suffix: ' min',
            },
          ].map(({ label, value, color, suffix }) => (
            <Col key={label} xs={12} sm={6}>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>}
                  value={value}
                  suffix={suffix}
                  valueStyle={{ color, fontSize: 24, fontWeight: 700 }}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {isLoading ? (
        <Skeleton active />
      ) : records.length === 0 ? (
        <Empty
          description={
            <Text style={{ color: colors.textMuted }}>No hay registros para este período</Text>
          }
          style={{ marginTop: 60 }}
        />
      ) : (
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          style={cardStyle}
        />
      )}
    </>
  );
}
