'use client';

import { useState } from 'react';
import { Col, Modal, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  BankOutlined,
  ClockCircleOutlined,
  MobileOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CashRegisterReportItem, CashRegisterReportSummary, PaginationMeta } from '@/types/api';
import { formatLimaDateTime } from '@/lib/datetime';
import { cardStyle, colors, highlightPanelStyle, nestedPanelStyle } from '@/lib/theme';

const { Text } = Typography;

interface CashRegisterReportTableProps {
  items: CashRegisterReportItem[];
  summary?: CashRegisterReportSummary;
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
}

function money(v: string | number): string {
  return `s/. ${Number(v).toFixed(2)}`;
}

function noteText(v: string | null | undefined): string {
  return v?.trim() ? v : '—';
}

function balanceStatusTag(v: string | null) {
  if (!v) return <Tag>Abierto</Tag>;
  return (
    <Tag color={v === 'balanced' ? 'success' : 'error'}>
      {v === 'balanced' ? 'Sí Cuadra' : 'No Cuadra'}
    </Tag>
  );
}

function DetailAmount({
  label,
  value,
  color,
  icon,
  prefix = 's/.',
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  prefix?: string;
}) {
  const formatted =
    prefix === ''
      ? String(value)
      : `${prefix} ${Number(value).toFixed(2)}`;

  return (
    <div
      style={{
        ...nestedPanelStyle,
        padding: '10px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color ?? colors.text, whiteSpace: 'nowrap' }}>
        {formatted}
      </span>
    </div>
  );
}

function NoteBlock({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | null;
  tone: 'warn' | 'muted';
}) {
  const hasValue = !!value?.trim();
  const bg = tone === 'warn' ? '#fff7ed' : colors.nestedBgMuted;
  const border = tone === 'warn' ? '#fdba74' : colors.cardBorder;
  const titleColor = tone === 'warn' ? '#c2410c' : colors.textMuted;

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: titleColor,
          display: 'block',
          marginBottom: 6,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: hasValue ? colors.text : colors.textSubtle,
          fontSize: 13,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}
      >
        {noteText(value)}
      </Text>
    </div>
  );
}

function ShiftDetailContent({ shift }: { shift: CashRegisterReportItem }) {
  const isBalanced = shift.balanceStatus === 'balanced';
  const isUnbalanced = shift.balanceStatus === 'unbalanced';
  const headerBg = isUnbalanced
    ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
    : isBalanced
      ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
      : 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
  const headerBorder = isUnbalanced ? '#fca5a5' : isBalanced ? '#86efac' : colors.cardBorder;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: headerBg,
          border: `1px solid ${headerBorder}`,
          borderRadius: 12,
          padding: '16px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Text style={{ fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, display: 'block' }}>
              CAJERO
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <UserOutlined style={{ color: colors.primary }} />
              <Text strong style={{ fontSize: 17, color: colors.text }}>
                {shift.cashier?.fullName ?? '—'}
              </Text>
            </div>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, display: 'block' }}>
              Turno · {dayjs(shift.shiftDate).format('DD [de] MMMM YYYY')}
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            {balanceStatusTag(shift.balanceStatus)}
            <div style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {shift.closedAt
                ? `Cerrado ${formatLimaDateTime(shift.closedAt)}`
                : `Abierto ${formatLimaDateTime(shift.createdAt)}`}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            letterSpacing: 0.8,
            display: 'block',
            marginBottom: 8,
          }}
        >
          INGRESOS
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          <DetailAmount label="Efectivo" value={shift.cashAmount} color="#16a34a" icon={<WalletOutlined />} />
          <DetailAmount label="Yape" value={shift.yapeAmount} color="#a855f7" icon={<MobileOutlined />} />
          <DetailAmount label="Plin" value={shift.plinAmount} color="#3b82f6" icon={<MobileOutlined />} />
          <DetailAmount label="Tarjeta" value={shift.cardAmount} color="#f59e0b" icon={<BankOutlined />} />
        </div>
      </div>

      <div>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            letterSpacing: 0.8,
            display: 'block',
            marginBottom: 8,
          }}
        >
          DEDUCCIONES
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          <DetailAmount label="Descuentos" value={shift.discountsTotal} color="#ef4444" prefix="- s/." />
          <DetailAmount
            label={`Anulados (${shift.cancellationsCount})`}
            value={shift.cancellationsTotal}
            color="#ef4444"
            prefix="- s/."
          />
          <DetailAmount label="Gastos de caja" value={shift.extraExpenses} color="#ef4444" prefix="- s/." />
          <DetailAmount label="Tickets" value={shift.ticketsCount ?? 0} color={colors.primary} prefix="" />
        </div>
      </div>

      <div
        style={{
          ...highlightPanelStyle,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: colors.textMuted }}>
            TOTAL RECAUDADO
          </Text>
          {Number(shift.differenceAmount) !== 0 && (
            <Text style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Diferencia: {money(shift.differenceAmount)}
            </Text>
          )}
        </div>
        <span style={{ fontSize: 28, fontWeight: 900, color: colors.accent, lineHeight: 1 }}>
          {money(shift.totalAmount)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {(isUnbalanced || !!shift.balanceNotes?.trim()) && (
          <NoteBlock title="Nota de descuadre" value={shift.balanceNotes} tone="warn" />
        )}
        <NoteBlock title="Datos extra" value={shift.extraNotes} tone="muted" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          paddingTop: 4,
          borderTop: `1px solid ${colors.divider}`,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.textSubtle }}>
          Apertura: {formatLimaDateTime(shift.createdAt)}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSubtle }}>
          Cierre: {shift.closedAt ? formatLimaDateTime(shift.closedAt) : '—'}
        </Text>
      </div>
    </div>
  );
}

export function CashRegisterReportTable({
  items,
  summary,
  meta,
  loading,
  onPageChange,
}: CashRegisterReportTableProps) {
  const [selected, setSelected] = useState<CashRegisterReportItem | null>(null);

  const columns: ColumnsType<CashRegisterReportItem> = [
    {
      title: 'Fecha',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      fixed: 'left',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Cajero',
      key: 'cashier',
      width: 140,
      render: (_: unknown, r: CashRegisterReportItem) => r.cashier?.fullName ?? '—',
    },
    { title: 'Efectivo', dataIndex: 'cashAmount', key: 'cashAmount', width: 90, render: money },
    { title: 'Yape', dataIndex: 'yapeAmount', key: 'yapeAmount', width: 90, render: money },
    { title: 'Plin', dataIndex: 'plinAmount', key: 'plinAmount', width: 90, render: money },
    { title: 'Tarjeta', dataIndex: 'cardAmount', key: 'cardAmount', width: 90, render: money },
    { title: 'Descuentos', dataIndex: 'discountsTotal', key: 'discountsTotal', width: 100, render: money },
    {
      title: 'Anulaciones',
      key: 'cancellations',
      width: 130,
      render: (_: unknown, r: CashRegisterReportItem) =>
        `${r.cancellationsCount} (${money(r.cancellationsTotal)})`,
    },
    {
      title: 'Tickets Procesados',
      dataIndex: 'ticketsCount',
      key: 'ticketsCount',
      width: 90,
      align: 'center',
    },
    { title: 'Gastos/Caja', dataIndex: 'extraExpenses', key: 'extraExpenses', width: 100, render: money },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (v: string) => (
        <Text style={{ color: colors.accent, fontWeight: 600 }}>{money(v)}</Text>
      ),
    },
    {
      title: 'Estado Cuadre',
      dataIndex: 'balanceStatus',
      key: 'balanceStatus',
      width: 110,
      render: (v: string | null) => balanceStatusTag(v),
    },
    {
      title: 'Nota balance',
      dataIndex: 'balanceNotes',
      key: 'balanceNotes',
      width: 180,
      ellipsis: true,
      render: (v: string | null) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{noteText(v)}</Text>
      ),
    },
    {
      title: 'Datos extra',
      dataIndex: 'extraNotes',
      key: 'extraNotes',
      width: 180,
      ellipsis: true,
      render: (v: string | null) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{noteText(v)}</Text>
      ),
    },
  ];

  const pagination: TablePaginationConfig | false = meta
    ? {
        current: meta.page,
        pageSize: meta.limit,
        total: meta.totalItems,
        showSizeChanger: false,
        onChange: onPageChange,
      }
    : false;

  return (
    <>
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {[
            { label: 'Ingreso del período', value: summary.totalRevenue, color: '#16a34a' },
            { label: 'Tickets Anulados', value: summary.totalCancellationsCount, color: '#ef4444' },
            { label: 'Monto Anulado', value: summary.totalCancellationsAmount, color: '#ef4444' },
            { label: 'Descuentos', value: summary.totalDiscounts, color: '#f59e0b' },
            { label: 'Gastos de caja', value: summary.totalExpenses, color: '#ef4444' },
            { label: 'Tickets Procesados', value: summary.totalTicketsCount, color: colors.primary },
          ].map(({ label, value, color }) => (
            <Col key={label} xs={12} sm={8} md={4}>
              <div style={{ ...cardStyle, padding: '12px 16px' }}>
                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>}
                  value={value}
                  precision={label.includes('Tickets') ? 0 : 2}
                  prefix={label.includes('Tickets') ? undefined : 's/.'}
                  valueStyle={{ color, fontSize: 18, fontWeight: 700 }}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        size="small"
        scroll={{ x: 1600 }}
        style={cardStyle}
        onRow={(record) => ({
          onClick: () => setSelected(record),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title={null}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={560}
        destroyOnHidden
        centered
        styles={{
          body: {
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: 20,
            overflow: 'hidden',
          },
        }}
      >
        {selected && (
          <>
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ fontSize: 16, color: colors.text }}>
                Detalle del turno
              </Text>
            </div>
            <ShiftDetailContent shift={selected} />
          </>
        )}
      </Modal>
    </>
  );
}
