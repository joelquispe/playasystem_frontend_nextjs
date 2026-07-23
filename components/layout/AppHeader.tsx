'use client';

import { Avatar, Button, Dropdown, Layout, Modal, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleName, getUserRoleSlug } from '@/lib/roles';
import { useCheckIn, useCheckOut, useTodayAttendance } from '@/hooks/useAttendance';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const isCashier = !!user && !isAdmin && getUserRoleSlug(user) === 'cashier';

  const { data: todayAttendance, isLoading: isAttendanceLoading } =
    useTodayAttendance(isCashier);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const canStartShift =
    isCashier && !isAttendanceLoading && !todayAttendance?.checkedInAt;

  const canEndShift =
    isCashier &&
    !!todayAttendance?.checkedInAt &&
    !todayAttendance?.checkedOutAt;

  const handleStartShift = () => {
    checkIn.mutateAsync(undefined);
  };

  const handleEndShift = () => {
    Modal.confirm({
      title: '¿Terminar turno?',
      content:
        'Se registrará tu hora de salida de asistencia. Esta acción no cierra la caja ni la sesión.',
      okText: 'Terminar turno',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => checkOut.mutateAsync(undefined),
    });
  };

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
      onClick: logout,
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
        {canStartShift && (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={checkIn.isPending}
            onClick={handleStartShift}
          >
            Marcar asistencia
          </Button>
        )}

        {canEndShift && (
          <Button
            danger
            icon={<ClockCircleOutlined />}
            loading={checkOut.isPending}
            onClick={handleEndShift}
          >
            Terminar turno
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
