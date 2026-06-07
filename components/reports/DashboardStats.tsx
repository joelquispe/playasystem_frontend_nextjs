'use client';

import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  ArrowUpOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { DashboardData } from '@/types/api';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

interface DashboardStatsProps {
  data: DashboardData;
}

function StatCard({
  title,
  value,
  prefix,
  suffix,
  color,
  icon,
}: {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card size="small" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Text>
          <div style={{ fontSize: 24, fontWeight: 800, color: color ?? colors.text, marginTop: 4 }}>
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span style={{ fontSize: 14, marginLeft: 4 }}>{suffix}</span>}
          </div>
        </div>
        <div
          style={{
            background: colors.iconBg,
            borderRadius: 8,
            padding: '8px',
            color: color ?? colors.textMuted,
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DashboardStats({ data }: DashboardStatsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}>
        <StatCard title="Ingresos totales" value={data.totalRevenue.toFixed(2)} prefix="s/. " color={colors.accent} icon={<DollarOutlined />} />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard title="Tickets cobrados" value={data.totalTickets} color="#3b82f6" icon={<ArrowUpOutlined />} />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard title="Cancelaciones" value={data.totalCancelled} color="#ef4444" icon={<CloseCircleOutlined />} />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard title="Descuentos" value={data.totalDiscounts.toFixed(2)} prefix="s/. " color="#f59e0b" icon={<TagOutlined />} />
      </Col>

      <Col xs={24}>
        <Card
          size="small"
          title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>DESGLOSE POR MÉTODO DE PAGO</Text>}
          style={cardStyle}
        >
          <Row gutter={[24, 8]}>
            {Object.entries(data.byPaymentMethod).map(([method, amount]) => (
              <Col key={method} xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>
                    {method}
                  </Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
                    s/. {amount.toFixed(2)}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
