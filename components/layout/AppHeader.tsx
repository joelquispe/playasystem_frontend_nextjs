'use client';

import { Avatar, Button, Dropdown, Layout, Modal, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleName, getUserRoleSlug } from '@/lib/roles';
import { useCheckIn, useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const workflow = useCashierWorkflow();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const isCashier = workflow.isCashier;

  const handleCheckIn = () => {
    checkIn.mutate(undefined);
  };

  const handleCheckOut = () => {
    Modal.confirm({
      title: '¿Marcar salida de asistencia?',
      content: 'Se registrará tu hora de salida. Después podrás cerrar sesión.',
      okText: 'Marcar salida',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => checkOut.mutateAsync(undefined),
    });
  };

  const handleLogout = () => {
    if (isCashier && workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Turno de caja abierto',
        content:
          'Debes cuadrar la caja y cerrar el turno antes de cerrar sesión. Ve a Caja para finalizar tu jornada.',
        okText: 'Ir a Caja',
        cancelText: 'Cancelar',
        onOk: () => router.push('/cash-register'),
      });
      return;
    }

    if (isCashier && workflow.canCheckOut) {
      Modal.confirm({
        title: 'Salida de asistencia pendiente',
        content:
          'Ya cerraste el turno de caja. Marca tu salida de asistencia antes de cerrar sesión.',
        okText: 'Marcar salida',
        cancelText: 'Cancelar',
        onOk: () => checkOut.mutateAsync(undefined),
      });
      return;
    }

    logout();
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
      onClick: handleLogout,
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
        {isCashier && workflow.canCheckIn && (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={checkIn.isPending}
            onClick={handleCheckIn}
          >
            Marcar asistencia
          </Button>
        )}

        {isCashier && workflow.canCheckOut && (
          <Button
            danger
            icon={<ClockCircleOutlined />}
            loading={checkOut.isPending}
            onClick={handleCheckOut}
          >
            Marcar salida
          </Button>
        )}

        {isCashier && workflow.canCloseShift && (
          <Button
            icon={<WalletOutlined />}
            onClick={() => router.push('/cash-register')}
          >
            Cerrar turno
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
