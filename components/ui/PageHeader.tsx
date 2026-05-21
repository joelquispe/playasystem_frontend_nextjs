'use client';

import { Divider, Typography } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
      }}
    >
      <div>
        <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
          {title}
        </Title>
        {subtitle && (
          <Text style={{ color: '#666', fontSize: 13 }}>{subtitle}</Text>
        )}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}
