'use client';

import { Avatar, Button, Dropdown, Layout, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleName, getUserRoleSlug } from '@/lib/roles';
import { useCheckIn } from '@/hooks/useAttendance';
import { useOpenShift } from '@/hooks/useCashRegister';
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
  const openShift = useOpenShift();

  const isCashier = workflow.isCashier;

  /**
   * PLAYA-302: Attendance buttons are ONLY here in the AppHeader.
   * CashierWorkflowBanner no longer shows attendance actions.
   */
  const showCheckIn = isCashier && workflow.canCheckIn;
  const showCheckOut = isCashier && workflow.canCheckOut;

  /**
   * PLAYA-304: Show "Abrir caja" when attendance is open but no shift is open.
   * This covers both "just checked in" and "shift was already closed today".
   */
  const showOpenShift = isCashier && workflow.canOpenShift;

  /**
   * Show "Cuadrar caja" shortcut when caja has activity.
   */
  const showCloseCash = isCashier && workflow.canCloseShift;

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 160 }}>
          <div style={{ fontWeight: 600, color: '#2f3639' }}>{user?.fullName}</div>
          <div style={{ fontSize: 12, color: '#65767d' }}>@{user?.username}</div>
        </div>
      ),
      disabled: true,
    },
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

        {showCheckOut && (
          <Button
            danger
            icon={<ClockCircleOutlined />}
            loading={isPending}
            onClick={requestCheckOut}
          >
            Marcar salida
          </Button>
        )}

        {/* ── Caja shortcuts ────────────────────────────────────────────── */}
        {showOpenShift && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            loading={openShift.isPending}
            onClick={() => openShift.mutate()}
            style={{ background: '#0d9488', borderColor: '#0d9488' }}
          >
            Abrir caja
          </Button>
        )}

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
          <Button type="text" style={{ padding: 4, height: 'auto' }}>
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{ background: '#2f6d73', cursor: 'pointer' }}
            />
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
