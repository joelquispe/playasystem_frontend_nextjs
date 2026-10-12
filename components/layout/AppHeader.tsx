'use client';

import { Avatar, Button, Dropdown, Layout, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleName, getUserRoleSlug } from '@/lib/roles';
import { useCheckIn } from '@/hooks/useAttendance';
import { useCashierSession } from '@/hooks/useCashierSession';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { workflow, requestLogout, requestCheckOut, isPending } = useCashierSession();
  const checkIn = useCheckIn();

  const isCashier = workflow.isCashier;

  /**
   * PLAYA-302: Attendance buttons are ONLY here in the AppHeader.
   * CashierWorkflowBanner no longer shows attendance actions.
   *
   * Check-in / check-out send the Bearer JWT; the backend reads `sid`
   * and stores it on attendance_records.check_in_session_id /
   * check_out_session_id (session opened at login).
   */
  const showCheckIn = isCashier && workflow.canCheckIn;

  /**
   * "Marcar salida" lives in the user menu (not next to caja buttons) to
   * avoid accidental clicks; it still asks for confirmation.
   * "Abrir caja" is owned by CashierWorkflowBanner / Caja page (single action).
   */
  const showCheckOut = isCashier && workflow.hasOpenSession;
  const checkedInAt = workflow.attendance?.checkedInAt;

  /**
   * Show "Cuadrar caja" shortcut when caja has activity.
   */
  const showCloseCash = isCashier && workflow.canCloseShift;

  const checkOutItems: NonNullable<MenuProps['items']> = showCheckOut
    ? [
        { type: 'divider' },
        {
          key: 'check-out',
          icon: <ClockCircleOutlined />,
          label: 'Marcar salida de asistencia',
          disabled: isPending,
          onClick: requestCheckOut,
        },
      ]
    : [];

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 180 }}>
          <div style={{ fontWeight: 600, color: '#2f3639' }}>{user?.fullName}</div>
          <div style={{ fontSize: 12, color: '#65767d' }}>@{user?.username}</div>
        </div>
      ),
      disabled: true,
    },
    ...checkOutItems,
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      danger: true,
      onClick: requestLogout,
    },
  ];

  return (
    <Header
      style={{
        background: '#fbf7f2',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #d9cfc4',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Text
        strong
        style={{ fontSize: 16, color: '#2f3639', letterSpacing: '-0.3px' }}
      >
        {title}
      </Text>

      <Space>
        {/* ── Attendance (PLAYA-302: only here) ─────────────────────────── */}
        {showCheckIn && (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={checkIn.isPending}
            onClick={() => checkIn.mutate(undefined)}
          >
            Marcar asistencia
          </Button>
        )}

        {showCheckOut && checkedInAt && (
          <Tag icon={<ClockCircleOutlined />} color="green" style={{ marginInlineEnd: 0 }}>
            Entrada {dayjs(checkedInAt).format('HH:mm')}
          </Tag>
        )}

        {/* ── Caja shortcut ─────────────────────────────────────────────── */}
        {showCloseCash && (
          <Button
            icon={<WalletOutlined />}
            onClick={() => router.push('/cash-register')}
          >
            Cuadrar caja
          </Button>
        )}

        <Tag
          color={user && getUserRoleSlug(user) === 'admin' ? 'volcano' : 'geekblue'}
          style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}
        >
          {user ? getUserRoleName(user) : ''}
        </Tag>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <Button
            type="text"
            aria-label={`Usuario: ${user?.fullName ?? ''}`}
            style={{ padding: '4px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{ background: '#2f6d73', cursor: 'pointer' }}
            />
            {user?.fullName && (
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <span style={{ fontSize: 10, color: '#65767d' }}>
                  {isCashier ? 'Cajero' : 'Usuario'}
                </span>
                <span
                  style={{
                    fontSize: 13, fontWeight: 700, color: '#2f3639',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {user.fullName}
                </span>
              </span>
            )}
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
