'use client';

import { Descriptions, Divider, Modal, Space, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  LinkOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import {
  PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  RECEIPT_TYPE_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/constants';
import { colors, nestedPanelStyle } from '@/lib/theme';

const { Text } = Typography;

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_TAG: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'processing', icon: <ClockCircleOutlined /> },
  paid: { color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'error', icon: <StopOutlined /> },
  manual: { color: 'warning', icon: <FileDoneOutlined /> },
};

export function TicketDetailModal({ ticket, open, onClose }: TicketDetailModalProps) {
  if (!ticket) return null;

  const statusMeta = STATUS_TAG[ticket.status] ?? { color: 'default', icon: <CloseCircleOutlined /> };
  const hasCustomer =
    ticket.customerDni ||
    ticket.customerRuc ||
    ticket.customerBusinessName ||
    ticket.customerFirstName;
  const hasNubefact = ticket.nubefactEnlace || ticket.nubefactPdfUrl;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <Space>
          <Text strong style={{ color: colors.text, fontSize: 16 }}>
            Detalle del Ticket
          </Text>
          <Text
            style={{
              fontFamily: 'monospace',
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            #{ticket.ticketCode}
          </Text>
        </Space>
      }
      centered
    >
      {/* ── Status ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Tag icon={statusMeta.icon} color={statusMeta.color} style={{ fontSize: 13, padding: '2px 10px' }}>
          {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
        </Tag>
      </div>

      {/* ── Vehicle & Time ────────────────────────────────────────── */}
      <Descriptions
        size="small"
        column={2}
        bordered
        labelStyle={{ color: colors.textMuted, fontWeight: 500 }}
        contentStyle={{ color: colors.text }}
      >
        <Descriptions.Item label="Placa" span={1}>
          <Text strong style={{ fontFamily: 'monospace', fontSize: 15 }}>
            {ticket.plate}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Vehículo" span={1}>
          {ticket.vehicleType?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="H. Ingreso" span={1}>
          {dayjs(ticket.entryTime).format('DD/MM/YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="H. Salida" span={1}>
          {ticket.exitTime ? dayjs(ticket.exitTime).format('DD/MM/YYYY HH:mm') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Tiempo total" span={1}>
          {ticket.totalMinutes != null ? `${ticket.totalMinutes} min` : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Cajero" span={1}>
          {ticket.cashier?.fullName ?? ticket.cashier?.username ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      {/* ── Amounts ───────────────────────────────────────────────── */}
      <Divider style={{ margin: '14px 0' }} />
      <Descriptions
        size="small"
        column={3}
        bordered
        labelStyle={{ color: colors.textMuted, fontWeight: 500 }}
        contentStyle={{ color: colors.text }}
      >
        <Descriptions.Item label="Tarifa" span={1}>
          <Space direction="vertical" size={0}>
            <span>{RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType}</span>
            <Text style={{ color: colors.accent, fontWeight: 600 }}>
              s/. {parseFloat(ticket.rateAmount).toFixed(2)}
            </Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Monto base" span={1}>
          s/. {parseFloat(ticket.totalAmount).toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Descuento" span={1}>
          {parseFloat(ticket.discount) > 0 ? (
            <Text type="danger">- s/. {parseFloat(ticket.discount).toFixed(2)}</Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Monto final" span={1}>
          <Text strong style={{ color: colors.accent, fontSize: 15 }}>
            s/. {parseFloat(ticket.finalAmount).toFixed(2)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Método de pago" span={1}>
          {ticket.paymentMethod ? (PAYMENT_METHOD_LABELS[ticket.paymentMethod] ?? ticket.paymentMethod) : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Comprobante" span={1}>
          {ticket.receiptType ? (RECEIPT_TYPE_LABELS[ticket.receiptType] ?? ticket.receiptType) : '—'}
        </Descriptions.Item>
      </Descriptions>

      {/* ── Discount observation ──────────────────────────────────── */}
      {ticket.discountObservation && (
        <div style={{ ...nestedPanelStyle, padding: '8px 12px', marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            <strong>Obs. descuento:</strong> {ticket.discountObservation}
          </Text>
        </div>
      )}

      {/* ── Observation ───────────────────────────────────────────── */}
      {ticket.observation && (
        <div style={{ ...nestedPanelStyle, padding: '8px 12px', marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            <strong>Observación:</strong> {ticket.observation}
          </Text>
        </div>
      )}

      {/* ── Additional charges ────────────────────────────────────── */}
      {(ticket.charges?.length ?? 0) > 0 && (
        <>
          <Divider style={{ margin: '14px 0' }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Cargos adicionales</Text>
          </Divider>
          <div style={{ ...nestedPanelStyle, padding: '8px 12px' }}>
            {ticket.charges.map((c) => (
              <div key={c.id} style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                · <strong>{c.chargeType}</strong>: s/. {parseFloat(c.amount).toFixed(2)}
                {c.notes ? <span style={{ color: colors.textMuted }}> — {c.notes}</span> : null}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Customer data ─────────────────────────────────────────── */}
      {hasCustomer && (
        <>
          <Divider style={{ margin: '14px 0' }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Datos del cliente</Text>
          </Divider>
          <Descriptions
            size="small"
            column={2}
            bordered
            labelStyle={{ color: colors.textMuted, fontWeight: 500 }}
            contentStyle={{ color: colors.text }}
          >
            {ticket.customerDni && (
              <Descriptions.Item label="DNI">{ticket.customerDni}</Descriptions.Item>
            )}
            {ticket.customerRuc && (
              <Descriptions.Item label="RUC">{ticket.customerRuc}</Descriptions.Item>
            )}
            {ticket.customerBusinessName && (
              <Descriptions.Item label="Nombre / Razón social" span={2}>
                {ticket.customerBusinessName}
              </Descriptions.Item>
            )}
            {ticket.customerAddress && (
              <Descriptions.Item label="Dirección" span={2}>
                {ticket.customerAddress}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}

      {/* ── NubeFact links ────────────────────────────────────────── */}
      {hasNubefact && (
        <>
          <Divider style={{ margin: '14px 0' }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Comprobante electrónico</Text>
          </Divider>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {ticket.nubefactEnlace && (
              <a href={ticket.nubefactEnlace} target="_blank" rel="noopener noreferrer">
                <LinkOutlined style={{ marginRight: 6 }} />
                Ver en NubeFact
              </a>
            )}
            {ticket.nubefactPdfUrl && (
              <a href={ticket.nubefactPdfUrl} target="_blank" rel="noopener noreferrer">
                <LinkOutlined style={{ marginRight: 6 }} />
                Descargar PDF
              </a>
            )}
            {ticket.nubefactXmlUrl && (
              <a href={ticket.nubefactXmlUrl} target="_blank" rel="noopener noreferrer">
                <LinkOutlined style={{ marginRight: 6 }} />
                Descargar XML
              </a>
            )}
          </Space>
        </>
      )}
    </Modal>
  );
}
