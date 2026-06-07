'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  CarOutlined,
  DollarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function makeItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
): MenuItem {
  return { key, icon, label };
}

/** Cajero: solo operaciones (tickets → cobro → caja) y clientes */
const cashierItems: MenuItem[] = [
  makeItem(<Link href="/tickets">Tickets</Link>, '/tickets', <CarOutlined />),
  makeItem(<Link href="/cash-register">Caja</Link>, '/cash-register', <DollarOutlined />),
  makeItem(<Link href="/clients">Clientes</Link>, '/clients', <UserOutlined />),
];

/** Admin: acceso completo */
const adminItems: MenuItem[] = [
  makeItem(<Link href="/tickets">Tickets</Link>, '/tickets', <CarOutlined />),
  makeItem(<Link href="/cash-register">Caja</Link>, '/cash-register', <DollarOutlined />),
  makeItem(<Link href="/clients">Clientes</Link>, '/clients', <UserOutlined />),
  makeItem(<Link href="/subscribers">Abonados</Link>, '/subscribers', <IdcardOutlined />),
  makeItem(<Link href="/reports">Reportes</Link>, '/reports', <BarChartOutlined />),
  makeItem(<Link href="/users">Usuarios</Link>, '/users', <TeamOutlined />),
  makeItem(<Link href="/roles">Roles</Link>, '/roles', <SafetyCertificateOutlined />),
  makeItem(<Link href="/attendance">Asistencia</Link>, '/attendance', <CalendarOutlined />),
  makeItem(<Link href="/settings">Configuración</Link>, '/settings', <SettingOutlined />),
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const items = isAdmin ? adminItems : cashierItems;
  const selectedKey = pathname;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      trigger={null}
      width={220}
      collapsedWidth={64}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background: '#fbf7f2',
        borderRight: '1px solid #d9cfc4',
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid #d9cfc4',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #2f6d73, #6f8f94)',
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <span
            style={{
              color: '#2f3639',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            Playa <span style={{ color: '#2f6d73' }}>ROSE</span>
          </span>
        )}
      </div>

      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '0 16px',
          cursor: 'pointer',
          color: '#65767d',
          borderBottom: '1px solid #d9cfc4',
        }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        style={{ background: '#fbf7f2', border: 'none', marginTop: 8 }}
      />
    </Sider>
  );
}
