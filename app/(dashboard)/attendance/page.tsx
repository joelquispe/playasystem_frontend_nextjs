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
  Space,
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
import { Attendance, AttendanceStatus } from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';

const { Text } = Typography;

const STATUS_MAP: Record<AttendanceStatus, { label: string; color: string }> = {
  on_time: { label: 'A tiempo', color: 'success' },
  late: { label: 'Tardanza', color: 'warning' },
  absent: { label: 'Ausente', color: 'error' },
};

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

  const columns: ColumnsType<Attendance> = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Usuario',
      key: 'user',
      render: (_: unknown, record: Attendance) => (
        <Text style={{ color: '#e0e0e0' }}>{record.user?.fullName}</Text>
      ),
    },
    {
      title: 'Entrada',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (v: string) => dayjs(v).format('HH:mm'),
    },
    {
      title: 'Salida',
      dataIndex: 'logoutTime',
      key: 'logoutTime',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm') : <Text style={{ color: '#555' }}>—</Text>),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v: AttendanceStatus) => {
        const { label, color } = STATUS_MAP[v] ?? { label: v, color: 'default' };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Tardanza',
      dataIndex: 'tardinessMinutes',
      key: 'tardinessMinutes',
      render: (v: number) =>
        v > 0 ? (
          <Text style={{ color: '#f59e0b' }}>{v} min</Text>
        ) : (
          <Text style={{ color: '#555' }}>—</Text>
        ),
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      render: (v: string | null) => <Text style={{ color: '#888', fontSize: 12 }}>{v ?? '—'}</Text>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Asistencia"
        subtitle={month.format('MMMM YYYY')}
        extra={
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
            style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
          >
            Actualizar
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Text style={{ color: '#888', fontSize: 13 }}>Usuario:</Text>
        <Select
          value={selectedUser}
          onChange={setSelectedUser}
          options={userOptions}
          placeholder="Todos los usuarios"
          style={{ width: 220 }}
          allowClear
        />
        <Text style={{ color: '#888', fontSize: 13 }}>Mes:</Text>
        <DatePicker
          picker="month"
          value={month}
          onChange={(v) => v && setMonth(v)}
          format="MMMM YYYY"
          style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}
          allowClear={false}
        />
      </div>

      {/* Summary row */}
      {summary && selectedUser && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {[
            { label: 'Días con tardanza', value: summary.lateCount, color: '#f59e0b' },
            {
              label: 'Minutos de tardanza',
              value: summary.totalTardinessMinutes,
              color: '#ef4444',
              suffix: ' min',
            },
          ].map(({ label, value, color, suffix }) => (
            <Col key={label} xs={12} sm={6}>
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2d2d2d',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <Statistic
                  title={<Text style={{ color: '#888', fontSize: 12 }}>{label}</Text>}
                  value={value}
                  suffix={suffix}
                  valueStyle={{ color, fontSize: 24, fontWeight: 700 }}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Table */}
      {isLoading ? (
        <Skeleton active />
      ) : records.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#666' }}>No hay registros para este período</Text>}
          style={{ marginTop: 60 }}
        />
      ) : (
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          style={{ background: '#1a1a1a', borderRadius: 12 }}
        />
      )}
    </>
  );
}
