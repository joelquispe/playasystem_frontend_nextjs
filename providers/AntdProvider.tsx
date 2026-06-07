'use client';

import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import { colors } from '@/lib/theme';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: colors.primary,
          colorPrimaryHover: '#3e7f86',
          colorPrimaryActive: '#255a5f',
          colorBgBase: colors.contentBg,
          colorBgContainer: colors.cardBg,
          colorBgElevated: colors.contentBg,
          colorBgLayout: colors.contentBg,
          colorBorder: colors.cardBorder,
          colorBorderSecondary: colors.divider,
          borderRadius: 10,
          fontFamily:
            'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 14,
          colorText: colors.text,
          colorTextSecondary: colors.textMuted,
          colorTextDisabled: '#99a6ab',
          colorSuccess: '#4c8f5a',
          colorWarning: '#d39a3f',
          colorError: '#c4605c',
          colorInfo: '#4f87a8',
        },
        components: {
          Layout: {
            siderBg: colors.sidebarBg,
            headerBg: colors.sidebarBg,
            bodyBg: colors.contentBg,
          },
          Menu: {
            itemBg: colors.sidebarBg,
            itemColor: '#3f4c52',
            itemSelectedBg: '#dde9e9',
            itemSelectedColor: '#255a5f',
            itemHoverBg: '#edf2ee',
            itemHoverColor: colors.primary,
            subMenuItemBg: colors.cardBg,
          },
          Card: {
            colorBgContainer: colors.cardBg,
            colorBorderSecondary: colors.divider,
          },
          Table: {
            headerBg: colors.nestedBgMuted,
            rowHoverBg: '#f5f8f6',
            colorBgContainer: colors.cardBg,
          },
          Modal: {
            contentBg: colors.contentBg,
            headerBg: colors.contentBg,
          },
          Drawer: {
            colorBgElevated: colors.contentBg,
          },
          Input: {
            colorBgContainer: colors.contentBg,
            colorBorder: colors.cardBorder,
            activeBorderColor: colors.primary,
            hoverBorderColor: '#7ea0a5',
          },
          Select: {
            colorBgContainer: colors.contentBg,
            colorBorder: colors.cardBorder,
          },
          Button: {
            colorPrimary: colors.primary,
            colorPrimaryHover: '#3e7f86',
            colorPrimaryActive: '#255a5f',
            defaultBg: colors.cardBg,
            defaultBorderColor: colors.cardBorder,
          },
          Tag: {
            colorBgContainer: colors.iconBg,
          },
          Statistic: {
            colorTextDescription: colors.textMuted,
          },
          Skeleton: {
            colorFill: colors.nestedBgMuted,
            colorFillContent: colors.divider,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
