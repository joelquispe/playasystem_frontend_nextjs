'use client';

import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  ArrowUpOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { DashboardData } from '@/types/api';

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
    <Card
      size="small"
      style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Text>
          <div style={{ fontSize: 24, fontWeight: 800, color: color ?? '#e0e0e0', marginTop: 4 }}>
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span style={{ fontSize: 14, marginLeft: 4 }}>{suffix}</span>}
          </div>
        </div>
        <div
          style={{
            background: '#242424',
            borderRadius: 8,
            padding: '8px',
            color: color ?? '#888',
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
        <StatCard
          title="Ingresos totales"
          value={data.totalRevenue.toFixed(2)}
          prefix="s/. "
          color="#db2777"
          icon={<DollarOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Tickets cobrados"
          value={data.totalTickets}
          color="#3b82f6"
          icon={<ArrowUpOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Cancelaciones"
          value={data.totalCancelled}
          color="#ef4444"
          icon={<CloseCircleOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Descuentos"
          value={data.totalDiscounts.toFixed(2)}
          prefix="s/. "
          color="#f59e0b"
          icon={<TagOutlined />}
        />
      </Col>

      {/* Payment method breakdown */}
      <Col xs={24}>
        <Card
          size="small"
          title={<Text style={{ color: '#888', fontSize: 12 }}>DESGLOSE POR MÉTODO DE PAGO</Text>}
          style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 12 }}
        >
          <Row gutter={[24, 8]}>
            {Object.entries(data.byPaymentMethod).map(([method, amount]) => (
              <Col key={method} xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
                    {method}
                  </Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#e0e0e0' }}>
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
