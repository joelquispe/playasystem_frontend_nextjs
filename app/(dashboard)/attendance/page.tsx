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
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAttendance, useAttendanceSummary } from '@/hooks/useAttendance';
import { useSessions } from '@/hooks/useSessions';
import { useUsers } from '@/hooks/useUsers';
import { AttendanceRecord, AttendanceStatus } from '@/types/api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { SessionCell } from '@/components/attendance/SessionCell';
import { SessionsTable } from '@/components/attendance/SessionsTable';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLOR: Partial<Record<AttendanceStatus, string>> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'error',
  INCOMPLETE: 'orange',
  PENDING: 'default',
  JUSTIFIED: 'blue',
  DAY_OFF: 'default',
};

export default function AttendancePage() {
  const now = dayjs();
  const [tab, setTab] = useState<'attendance' | 'sessions'>('attendance');

  // ── Attendance filters ────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<Dayjs>(now);

  const year = month.year();
  const monthNum = month.month() + 1;

  // ── Sessions filters ──────────────────────────────────────────────────────
  const [sessionUserId, setSessionUserId] = useState<string | undefined>();
  const [sessionActive, setSessionActive] = useState<boolean | undefined>();
  const [sessionRange, setSessionRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [sessionPage, setSessionPage] = useState(1);

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

  const sessionParams = {
    userId: sessionUserId,
    isActive: sessionActive,
    from: sessionRange?.[0]?.format('YYYY-MM-DD'),
    to: sessionRange?.[1]?.format('YYYY-MM-DD'),
    page: sessionPage,
    limit: 20,
  };

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
    refetch: refetchSessions,
  } = useSessions(sessionParams, tab === 'sessions');

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
      title: 'Sesión ingreso',
      key: 'checkInSession',
      width: 140,
      render: (_: unknown, r: AttendanceRecord) => (
        <SessionCell session={r.checkInSession} sessionId={r.checkInSessionId} />
      ),
    },
    {
      title: 'Salida',
      dataIndex: 'checkedOutAt',
      key: 'checkedOutAt',
      render: (v: string | null) =>
        v ? dayjs(v).format('HH:mm') : <Text style={{ color: colors.textSubtle }}>—</Text>,
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
      render: (_: unknown, r: AttendanceRecord) => {
        const v = r.cashRegisters?.[0]?.createdAt;
        return v ? dayjs(v).format('DD/MM HH:mm') : <Text style={{ color: colors.textSubtle }}>—</Text>;
      },
    },
    {
      title: 'Caja cerrada',
      key: 'cashRegisterClosedAt',
      render: (_: unknown, r: AttendanceRecord) => {
        const regs = r.cashRegisters ?? [];
        if (!regs.length || regs.some((c) => !c.closedAt)) {
          return <Text style={{ color: colors.textSubtle }}>—</Text>;
        }
        const closed = regs
          .map((c) => c.closedAt!)
          .sort()
          .at(-1);
        return closed ? dayjs(closed).format('DD/MM HH:mm') : '—';
      },
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
  ];

  return (
    <>
      <PageHeader
        title="Asistencia"
        subtitle={tab === 'attendance' ? month.format('MMMM YYYY') : 'Sesiones de usuarios'}
        extra={
          <Button
            icon={
              <ReloadOutlined
                spin={tab === 'attendance' ? isFetching : sessionsFetching}
              />
            }
            onClick={() =>
              tab === 'attendance' ? refetch() : refetchSessions()
            }
          >
            Actualizar
          </Button>
        }
      />

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as 'attendance' | 'sessions')}
        items={[
          {
            key: 'attendance',
            label: 'Asistencia',
            children: (
              <>
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
                            title={
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                {label}
                              </Text>
                            }
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
                      <Text style={{ color: colors.textMuted }}>
                        No hay registros para este período
                      </Text>
                    }
                    style={{ marginTop: 60 }}
                  />
                ) : (
                  <Table
                    dataSource={records}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    scroll={{ x: 1200 }}
                    style={cardStyle}
                  />
                )}
              </>
            ),
          },
          {
            key: 'sessions',
            label: 'Sesiones',
            children: (
              <>
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
                    value={sessionUserId}
                    onChange={(v) => {
                      setSessionUserId(v);
                      setSessionPage(1);
                    }}
                    options={userOptions}
                    placeholder="Todos los usuarios"
                    style={{ width: 220 }}
                    allowClear
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Estado:</Text>
                  <Select
                    value={
                      sessionActive === undefined
                        ? undefined
                        : sessionActive
                          ? 'active'
                          : 'closed'
                    }
                    onChange={(v) => {
                      setSessionActive(
                        v === undefined ? undefined : v === 'active',
                      );
                      setSessionPage(1);
                    }}
                    allowClear
                    placeholder="Todas"
                    style={{ width: 140 }}
                    options={[
                      { value: 'active', label: 'Activas' },
                      { value: 'closed', label: 'Cerradas' },
                    ]}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Período:</Text>
                  <RangePicker
                    value={sessionRange}
                    onChange={(range) => {
                      setSessionRange(
                        range && range[0] && range[1]
                          ? [range[0], range[1]]
                          : null,
                      );
                      setSessionPage(1);
                    }}
                    format="DD/MM/YYYY"
                    allowClear
                  />
                </div>

                <SessionsTable
                  items={sessionsData?.items ?? []}
                  meta={sessionsData?.meta}
                  loading={sessionsLoading}
                  onPageChange={(page) => setSessionPage(page)}
                />
              </>
            ),
          },
        ]}
      />
    </>
  );
}
