'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Spin } from 'antd';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';

const { Content } = Layout;

const PAGE_TITLES: Record<string, string> = {
  '/tickets': 'Tickets',
  '/cash-register': 'Caja',
  '/clients': 'Clientes',
  '/reports': 'Dashboard',
  '/users': 'Usuarios',
  '/attendance': 'Asistencia',
  '/settings': 'Configuración',
  '/subscribers': 'Abonados',
};

const ADMIN_ROUTES = ['/reports', '/users', '/attendance', '/settings', '/subscribers'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      if (ADMIN_ROUTES.includes(pathname)) {
        router.replace('/tickets');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const title = PAGE_TITLES[pathname] ?? 'Playa ROSE';

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f0f0f' }}>
      <AppSidebar />
      <Layout style={{ background: '#0f0f0f' }}>
        <AppHeader title={title} />
        <Content
          style={{
            padding: '24px',
            background: '#0f0f0f',
            minHeight: 'calc(100vh - 56px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
