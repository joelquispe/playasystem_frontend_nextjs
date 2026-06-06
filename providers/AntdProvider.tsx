'use client';

import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2f6d73',
          colorPrimaryHover: '#3e7f86',
          colorPrimaryActive: '#255a5f',
          colorBgBase: '#f3eee8',
          colorBgContainer: '#fbf7f2',
          colorBgElevated: '#fffdfb',
          colorBgLayout: '#f3eee8',
          colorBorder: '#d9cfc4',
          colorBorderSecondary: '#e8dfd6',
          borderRadius: 10,
          fontFamily:
            'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 14,
          colorText: '#2f3639',
          colorTextSecondary: '#65767d',
          colorTextDisabled: '#99a6ab',
          colorSuccess: '#4c8f5a',
          colorWarning: '#d39a3f',
          colorError: '#c4605c',
          colorInfo: '#4f87a8',
        },
        components: {
          Layout: {
            siderBg: '#fbf7f2',
            headerBg: '#fbf7f2',
            bodyBg: '#f3eee8',
          },
          Menu: {
            itemBg: '#fbf7f2',
            itemColor: '#3f4c52',
            itemSelectedBg: '#dde9e9',
            itemSelectedColor: '#255a5f',
            itemHoverBg: '#edf2ee',
            itemHoverColor: '#2f6d73',
            subMenuItemBg: '#f7f1eb',
          },
          Card: {
            colorBgContainer: '#fffdfb',
            colorBorderSecondary: '#e8dfd6',
          },
          Table: {
            headerBg: '#f4ede5',
            rowHoverBg: '#f5f8f6',
          },
          Modal: {
            contentBg: '#fffdfb',
            headerBg: '#fffdfb',
          },
          Drawer: {
            colorBgElevated: '#fffdfb',
          },
          Input: {
            colorBgContainer: '#fffdfb',
            colorBorder: '#d9cfc4',
            activeBorderColor: '#2f6d73',
            hoverBorderColor: '#7ea0a5',
          },
          Select: {
            colorBgContainer: '#fffdfb',
            colorBorder: '#d9cfc4',
          },
          Button: {
            colorPrimary: '#2f6d73',
            colorPrimaryHover: '#3e7f86',
            colorPrimaryActive: '#255a5f',
          },
          Tag: {
            colorBgContainer: '#edf3f1',
          },
          Statistic: {
            colorTextDescription: '#65767d',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
