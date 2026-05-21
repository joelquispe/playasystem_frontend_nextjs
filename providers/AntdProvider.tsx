'use client';

import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#db2777',
          colorPrimaryHover: '#ec4899',
          colorBgBase: '#0f0f0f',
          colorBgContainer: '#1a1a1a',
          colorBgElevated: '#242424',
          colorBgLayout: '#0f0f0f',
          colorBorder: '#2d2d2d',
          colorBorderSecondary: '#222222',
          borderRadius: 8,
          fontFamily:
            'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 14,
          colorText: '#e0e0e0',
          colorTextSecondary: '#a0a0a0',
          colorTextDisabled: '#555',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
        },
        components: {
          Layout: {
            siderBg: '#111111',
            headerBg: '#111111',
            bodyBg: '#0f0f0f',
          },
          Menu: {
            darkItemBg: '#111111',
            darkSubMenuItemBg: '#0a0a0a',
            darkItemSelectedBg: '#1f0a14',
            darkItemHoverBg: '#1a1a1a',
          },
          Card: {
            colorBgContainer: '#1a1a1a',
            colorBorderSecondary: '#2d2d2d',
          },
          Table: {
            headerBg: '#1f1f1f',
            rowHoverBg: '#222',
          },
          Modal: {
            contentBg: '#1a1a1a',
            headerBg: '#1a1a1a',
          },
          Drawer: {
            colorBgElevated: '#1a1a1a',
          },
          Input: {
            colorBgContainer: '#242424',
            colorBorder: '#2d2d2d',
            activeBorderColor: '#db2777',
          },
          Select: {
            colorBgContainer: '#242424',
            colorBorder: '#2d2d2d',
          },
          Button: {
            colorPrimary: '#db2777',
            colorPrimaryHover: '#ec4899',
          },
          Tag: {
            colorBgContainer: '#242424',
          },
          Statistic: {
            colorTextDescription: '#a0a0a0',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
