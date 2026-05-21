'use client';

import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  BankOutlined,
  ClockCircleOutlined,
  MobileOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { CashRegister } from '@/types/api';

const { Text, Title } = Typography;

interface ShiftSummaryCardProps {
  shift: CashRegister;
}

function AmountStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#111',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Space style={{ fontSize: 12, color: '#666' }}>
        {icon}
        <span>{label}</span>
      </Space>
      <span style={{ fontSize: 20, fontWeight: 700, color: color ?? '#e0e0e0' }}>
        s/. {parseFloat(value).toFixed(2)}
      </span>
    </div>
  );
}

export function ShiftSummaryCard({ shift }: ShiftSummaryCardProps) {
  const isOpen = shift.balanceStatus === null;

  return (
    <Card
      title={
        <Space>
          <Title level={5} style={{ margin: 0, color: '#e0e0e0' }}>
            Turno del día {shift.shiftDate}
          </Title>
          <Tag color={isOpen ? 'processing' : 'default'}>
            {isOpen ? 'Abierto' : 'Cerrado'}
          </Tag>
        </Space>
      }
      style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
    >
      {/* Total */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0a10, #2d1020)',
          border: '1px solid #5c1030',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Text style={{ color: '#888', fontSize: 12 }}>TOTAL RECAUDADO</Text>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#db2777', marginTop: 2 }}>
            s/. {parseFloat(shift.totalAmount).toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: '#666', fontSize: 11 }}>Cajero</Text>
          <div style={{ color: '#e0e0e0', fontWeight: 600 }}>{shift.cashier?.fullName}</div>
        </div>
      </div>

      {/* Payment breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <AmountStat
          label="Efectivo"
          value={shift.cashAmount}
          color="#22c55e"
          icon={<WalletOutlined />}
        />
        <AmountStat
          label="Yape"
          value={shift.yapeAmount}
          color="#a855f7"
          icon={<MobileOutlined />}
        />
        <AmountStat
          label="Plin"
          value={shift.plinAmount}
          color="#3b82f6"
          icon={<MobileOutlined />}
        />
        <AmountStat
          label="Tarjeta"
          value={shift.cardAmount}
          color="#f59e0b"
          icon={<BankOutlined />}
        />
      </div>

      {/* Deductions */}
      <Row gutter={12}>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Text style={{ fontSize: 11, color: '#666' }}>Descuentos</Text>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>
              - s/. {parseFloat(shift.discountsTotal).toFixed(2)}
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Text style={{ fontSize: 11, color: '#666' }}>Cancelaciones</Text>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>
              {shift.cancellationsCount} (s/. {parseFloat(shift.cancellationsTotal).toFixed(2)})
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Text style={{ fontSize: 11, color: '#666' }}>Gastos extra</Text>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>
              - s/. {parseFloat(shift.extraExpenses).toFixed(2)}
            </div>
          </div>
        </Col>
      </Row>

      {shift.extraNotes && (
        <div
          style={{
            marginTop: 12,
            background: '#111',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            color: '#888',
          }}
        >
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          {shift.extraNotes}
        </div>
      )}

      {!isOpen && (
        <div
          style={{
            marginTop: 12,
            background: '#0c1a0c',
            border: '1px solid #1a4a1a',
            borderRadius: 6,
            padding: '8px 12px',
          }}
        >
          <Space>
            <Tag color={shift.balanceStatus === 'balanced' ? 'success' : 'warning'}>
              {shift.balanceStatus === 'balanced' ? 'Cuadrado' : 'Descuadrado'}
            </Tag>
            {parseFloat(shift.differenceAmount) !== 0 && (
              <Text style={{ fontSize: 12, color: '#888' }}>
                Diferencia: s/. {parseFloat(shift.differenceAmount).toFixed(2)}
              </Text>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
}
