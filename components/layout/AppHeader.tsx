'use client';

import { Avatar, Button, Dropdown, Layout, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 160 }}>
          <div style={{ fontWeight: 600, color: '#e0e0e0' }}>{user?.fullName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>@{user?.username}</div>
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
        background: '#111111',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e1e1e',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Text
        strong
        style={{ fontSize: 16, color: '#e0e0e0', letterSpacing: '-0.3px' }}
      >
        {title}
      </Text>

      <Space>
        <Tag
          color={user?.role === 'admin' ? 'volcano' : 'geekblue'}
          style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}
        >
          {user?.role}
        </Tag>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <Button type="text" style={{ padding: 4, height: 'auto' }}>
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{ background: '#db2777', cursor: 'pointer' }}
            />
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
