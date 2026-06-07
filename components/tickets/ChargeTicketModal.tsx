'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KeyOutlined, PrinterOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { PlateEvent, Ticket } from '@/types/api';
import { useChargeTicket, useCancelTicket } from '@/hooks/useTickets';
import { usePlateEvents } from '@/hooks/usePlateEvents';
import { useTaxpayer, usePersonByDni } from '@/hooks/useNubefact';
import { TicketPrintModal } from '@/components/tickets/TicketPrintModal';
import { nestedPanelStyle, colors } from '@/lib/theme';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

dayjs.extend(duration);

const { Text } = Typography;

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z
  .object({
    paymentMethod: z.string().min(1, 'Selecciona un medio de pago'),
    receiptType: z.string().default('vale'),
    discount: z.number().min(0).default(0),
    discountObservation: z.string().optional(),
    customerDni: z.string().optional(),
    customerRuc: z.string().optional(),
    customerBusinessName: z.string().optional(),
    observation: z.string().optional(),
  })
  .refine((d) => d.discount === 0 || !!d.discountObservation?.trim(), {
    message: 'Explica el motivo del descuento',
    path: ['discountObservation'],
  })
  .refine((d) => d.receiptType !== 'boleta' || !!d.customerDni?.trim(), {
    message: 'DNI requerido para boleta',
    path: ['customerDni'],
  })
  .refine((d) => d.receiptType !== 'factura' || !!d.customerRuc?.trim(), {
    message: 'RUC requerido para factura',
    path: ['customerRuc'],
  })
  .refine((d) => d.receiptType !== 'factura' || !!d.customerBusinessName?.trim(), {
    message: 'Razón social requerida',
    path: ['customerBusinessName'],
  });

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ChargeTicketModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function ChargeTicketModal({ ticket, open, onClose }: ChargeTicketModalProps) {
  const chargeTicket = useChargeTicket();
  const cancelTicket = useCancelTicket();
  const { data: plateEvents = [] } = usePlateEvents(ticket?.plate ?? '');

  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { paymentMethod: '', receiptType: 'vale', discount: 0 },
  });

  const receiptType = watch('receiptType');
  const discount = watch('discount') ?? 0;
  const ruc = watch('customerRuc') ?? '';
  const dni = watch('customerDni') ?? '';
  const paymentMethod = watch('paymentMethod');

  const { data: taxpayer, isFetching: rucLoading } = useTaxpayer(ruc);
  const { data: person, isFetching: dniLoading } = usePersonByDni(dni);

  useEffect(() => {
    if (taxpayer?.businessName) setValue('customerBusinessName', taxpayer.businessName);
  }, [taxpayer, setValue]);

  useEffect(() => {
    if (!person) return;
    const fullName = [person.nombres, person.apellidoPaterno, person.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) setValue('customerBusinessName', fullName);
  }, [person, setValue]);

  // Reset on open
  useEffect(() => {
    if (open) {
      reset({ paymentMethod: '', receiptType: 'vale', discount: 0 });
      setCancelMode(false);
      setCancelReason('');
    }
  }, [open, reset]);

  if (!ticket) return null;

  // ── Time calculations ───────────────────────────────────────────────────────
  const entryTime = dayjs(ticket.entryTime);
  const exitTime = dayjs();
  const elapsedMins = exitTime.diff(entryTime, 'minute');
  const elapsedH = Math.floor(elapsedMins / 60);
  const elapsedM = elapsedMins % 60;
  const elapsedStr = `${String(elapsedH).padStart(2, '0')}:${String(elapsedM).padStart(2, '0')}:00`;

  const additionalTotal = ticket.charges?.reduce((s, c) => s + parseFloat(c.amount), 0) ?? 0;
  const baseAmount = parseFloat(ticket.rateAmount);
  const grossAmount = baseAmount + additionalTotal;
  const discountSafe = Math.min(discount, grossAmount);
  const total = Math.max(0, grossAmount - discountSafe);

  // ── Submit (accept only) ────────────────────────────────────────────────────
  const buildPayload = (data: FormData) => ({
    paymentMethod: data.paymentMethod as never,
    receiptType: (data.receiptType || 'vale') as never,
    discount: data.discount ?? 0,
    discountObservation: data.discountObservation?.trim() || null,
    customerDni: data.customerDni?.trim() || null,
    customerRuc: data.customerRuc?.trim() || null,
    customerBusinessName: data.customerBusinessName?.trim() || null,
    observation: data.observation?.trim() || null,
  });

  const handleAccept = handleSubmit(async (data) => {
    const charged = await chargeTicket.mutateAsync({ id: ticket.id, data: buildPayload(data) });
    reset();
    onClose();
    return charged;
  });

  const handlePrintAndAccept = handleSubmit(async (data) => {
    const charged = await chargeTicket.mutateAsync({ id: ticket.id, data: buildPayload(data) });
    reset();
    onClose();
    setPrintTicket(charged);
  });

  const handleCancel = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) return;
    await cancelTicket.mutateAsync({ id: ticket.id, data: { cancelReason: cancelReason.trim() } });
    reset();
    onClose();
  };

  const isPending = chargeTicket.isPending || cancelTicket.isPending;
  const noPaymentMethod = !paymentMethod;

  // ── Event history columns ───────────────────────────────────────────────────
  const eventCols: ColumnsType<PlateEvent> = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'date',
      width: 90,
      render: (v: string) => (
        <Text style={{ fontSize: 11 }}>{dayjs(v).format('DD/MM/YY HH:mm')}</Text>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observation',
      key: 'obs',
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
  ];

  return (
    <>
      <Modal
        title={
          <Text strong style={{ fontSize: 16 }}>
            Cobro de Ticket
          </Text>
        }
        open={open}
        onCancel={() => { reset(); onClose(); }}
        footer={null}
        width={680}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* ── Header: Placa / Vehículo / Llave ─────────────────────────────── */}
        <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Placa:</Text>
            <div
              style={{
                fontFamily: 'monospace', fontWeight: 900, fontSize: 18,
                letterSpacing: 3, color: colors.text, background: '#f4ede5',
                padding: '2px 10px', borderRadius: 6, border: '1px solid #d9cfc4',
              }}
            >
              {ticket.plate}
            </div>
          </Col>
          <Col>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Vehículo:</Text>
            <div
              style={{
                fontWeight: 600, fontSize: 14, color: colors.text, background: '#f4ede5',
                padding: '2px 12px', borderRadius: 6, border: '1px solid #d9cfc4',
              }}
            >
              {ticket.vehicleType?.name ?? '—'}
            </div>
          </Col>
          <Col flex="auto" />
          <Col>
            <Tooltip title={ticket.hasKey ? 'Dejó llave' : 'Sin llave'}>
              <KeyOutlined
                style={{
                  fontSize: 24,
                  color: ticket.hasKey ? '#d97706' : '#d1d5db',
                }}
              />
            </Tooltip>
          </Col>
        </Row>

        {/* ── Ticket summary row ────────────────────────────────────────────── */}
        <div
          style={{
            ...nestedPanelStyle,
            padding: '10px 14px',
            marginBottom: 14,
            overflowX: 'auto',
          }}
        >
          <Row gutter={16} wrap={false}>
            {[
              { label: 'H. Ingreso', value: entryTime.format('DD/MM/YY\nHH:mm:ss') },
              { label: 'H. Salida', value: exitTime.format('DD/MM/YY\nHH:mm:ss') },
              { label: 'Tarifa', value: `s/. ${baseAmount.toFixed(2)}` },
              { label: 'Tiempo', value: elapsedStr },
              {
                label: 'Monto',
                value: `s/. ${grossAmount.toFixed(2)}`,
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <Col key={label} style={{ minWidth: 90, textAlign: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.textMuted, display: 'block' }}>
                  {label}
                </Text>
                <Text
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: accent ? colors.accent : colors.text,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {value}
                </Text>
              </Col>
            ))}

            {/* Descuento inline */}
            <Col style={{ minWidth: 80, textAlign: 'center' }}>
              <Text style={{ fontSize: 10, color: colors.textMuted, display: 'block' }}>
                Descuento
              </Text>
              <Controller
                name="discount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={0}
                    max={grossAmount}
                    step={0.5}
                    size="small"
                    style={{ width: 72, fontWeight: 700 }}
                  />
                )}
              />
            </Col>

            {/* Total */}
            <Col style={{ minWidth: 90, textAlign: 'center' }}>
              <Text style={{ fontSize: 10, color: colors.textMuted, display: 'block' }}>
                TOTAL
              </Text>
              <Text
                style={{
                  fontWeight: 900, fontSize: 18, color: colors.primary,
                }}
              >
                s/. {total.toFixed(2)}
              </Text>
            </Col>
          </Row>
        </div>

        {/* ── No payment method warning ─────────────────────────────────────── */}
        {noPaymentMethod && (
          <Alert
            message="¡Ingrese Medio de Pago!"
            type="warning"
            showIcon
            style={{ marginBottom: 12, fontWeight: 600 }}
          />
        )}

        {/* ── Main form row: left (payment) | right (events) ───────────────── */}
        <Row gutter={16}>
          {/* Left: payment form */}
          <Col xs={24} md={plateEvents.length > 0 ? 13 : 24}>
            <Form layout="vertical" requiredMark={false} size="small">
              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item
                    label="Medio de Pago"
                    validateStatus={errors.paymentMethod ? 'error' : ''}
                    help={errors.paymentMethod?.message}
                  >
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Seleccionar..."
                          options={Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => ({
                            value: k,
                            label: v,
                          }))}
                          style={{ width: '100%' }}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Comprobante">
                    <Controller
                      name="receiptType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={[
                            { value: 'vale', label: 'Vale' },
                            { value: 'boleta', label: 'Boleta' },
                            { value: 'factura', label: 'Factura' },
                          ]}
                          style={{ width: '100%' }}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Boleta → DNI */}
              {receiptType === 'boleta' && (
                <>
                  <Form.Item
                    label="DNI del cliente"
                    validateStatus={errors.customerDni ? 'error' : ''}
                    help={errors.customerDni?.message}
                  >
                    <Controller
                      name="customerDni"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          maxLength={8}
                          placeholder="12345678"
                          suffix={dniLoading ? <Spin size="small" /> : null}
                        />
                      )}
                    />
                  </Form.Item>
                  {person && (
                    <Form.Item label="Cliente">
                      <Input
                        readOnly
                        value={[person.nombres, person.apellidoPaterno, person.apellidoMaterno]
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </Form.Item>
                  )}
                </>
              )}

              {/* Factura → RUC + razón social */}
              {receiptType === 'factura' && (
                <>
                  <Form.Item
                    label="RUC"
                    validateStatus={errors.customerRuc ? 'error' : ''}
                    help={errors.customerRuc?.message}
                  >
                    <Controller
                      name="customerRuc"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          maxLength={11}
                          placeholder="20609471841"
                          suffix={rucLoading ? <Spin size="small" /> : null}
                        />
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Razón Social"
                    validateStatus={errors.customerBusinessName ? 'error' : ''}
                    help={errors.customerBusinessName?.message}
                  >
                    <Controller
                      name="customerBusinessName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Empresa S.A.C." />
                      )}
                    />
                  </Form.Item>
                </>
              )}

              {/* Discount observation */}
              {discount > 0 && (
                <Form.Item
                  label="Motivo del descuento"
                  validateStatus={errors.discountObservation ? 'error' : ''}
                  help={errors.discountObservation?.message}
                >
                  <Controller
                    name="discountObservation"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Ej. Cliente frecuente" />
                    )}
                  />
                </Form.Item>
              )}

              {/* Observation */}
              <Form.Item label="Observación">
                <Controller
                  name="observation"
                  control={control}
                  render={({ field }) => (
                    <Input.TextArea
                      {...field}
                      rows={2}
                      placeholder="Notas adicionales..."
                    />
                  )}
                />
              </Form.Item>
            </Form>
          </Col>

          {/* Right: event history */}
          {plateEvents.length > 0 && (
            <Col xs={24} md={11}>
              <Text style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
                Historial de Eventos
              </Text>
              <Table<PlateEvent>
                columns={eventCols}
                dataSource={plateEvents}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 180 }}
                style={{ marginTop: 6, fontSize: 11 }}
              />
            </Col>
          )}
        </Row>

        {/* ── Cancel mode ──────────────────────────────────────────────────── */}
        {cancelMode && (
          <div style={{ ...nestedPanelStyle, padding: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
              Motivo de anulación
            </Text>
            <Input.TextArea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Mínimo 5 caracteres..."
              style={{ marginTop: 6 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button size="small" onClick={() => setCancelMode(false)}>
                Volver
              </Button>
              <Button
                size="small"
                danger
                type="primary"
                loading={cancelTicket.isPending}
                disabled={cancelReason.trim().length < 5}
                onClick={handleCancel}
              >
                Confirmar Anulación
              </Button>
            </div>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <Row justify="space-between" align="middle">
          {/* Anular — left */}
          <Col>
            {!cancelMode && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => setCancelMode(true)}
                disabled={isPending}
              >
                Anular
              </Button>
            )}
          </Col>

          {/* Aceptar / Imprimir / Cancelar — right */}
          <Col>
            <Row gutter={8} align="middle">
              <Col>
                <Button onClick={() => { reset(); onClose(); }} disabled={isPending}>
                  Cancelar
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  loading={chargeTicket.isPending}
                  disabled={isPending || cancelMode}
                  onClick={handleAccept}
                  style={{ background: colors.primary, borderColor: colors.primary }}
                >
                  Aceptar
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  loading={chargeTicket.isPending}
                  disabled={isPending || cancelMode}
                  onClick={handlePrintAndAccept}
                  style={{ background: '#2563eb', borderColor: '#2563eb' }}
                >
                  Imprimir
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Modal>

      {/* ── Print modal ─────────────────────────────────────────────────────── */}
      <TicketPrintModal
        ticket={printTicket}
        open={!!printTicket}
        onClose={() => setPrintTicket(null)}
      />
    </>
  );
}
