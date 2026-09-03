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
  Popconfirm,
  Row,
  Select,
  Spin,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloseCircleOutlined,
  KeyOutlined,
  PrinterOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { PlateEvent, Ticket } from '@/types/api';
import {
  useChargeTicket,
  useCancelTicket,
  useRemoveAdditionalCharge,
} from '@/hooks/useTickets';
import { usePlateEvents } from '@/hooks/usePlateEvents';
import { useTaxpayer, usePersonByDni } from '@/hooks/useNubefact';
import { formatDniDisplayName } from '@/services/identity.service';
import { printTicketDirectly } from '@/lib/print-ticket';
import { nestedPanelStyle, colors } from '@/lib/theme';
import { PAYMENT_METHOD_LABELS, RATE_TYPE_LABELS } from '@/lib/constants';
import {
  calculateHourFractionAmount,
  formatDurationMinutes,
  resolveHourFractionExitTime,
  isFixedRateType,
  calculateAdditionalChargesTotal,
} from '@/lib/ticket-calculation';

dayjs.extend(duration);

const { Text } = Typography;

/**
 * If an "amanecida" (overnight) charge was applied less than this many
 * minutes ago, the cashier gets a warning before combining it with hours —
 * the customer may have just returned and not actually used the overnight
 * service (see business rule: cashier should confirm before charging both).
 */
const RECENT_OVERNIGHT_WARNING_MINUTES = 60;

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
  const removeCharge = useRemoveAdditionalCharge();
  const { data: plateEvents = [] } = usePlateEvents(ticket?.plate ?? '');

  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Live "now" — ticks while the modal is open so the previewed amount
  // stays accurate as time passes (e.g. crossing an hour/tolerance boundary
  // while the cashier is filling out the form).
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(dayjs()), 15_000);
    return () => clearInterval(id);
  }, [open]);

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
    const fullName = formatDniDisplayName(person);
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
  const exitTime = now;
  const elapsedMins = Math.max(0, exitTime.diff(entryTime, 'minute'));
  const elapsedStr = formatDurationMinutes(elapsedMins);

  const additionalCharges = ticket.charges ?? [];
  const isFixed = isFixedRateType(ticket.rateType);
  const ratePerHour = parseFloat(ticket.rateAmount);

  // PLAYA-311/312: Fixed-rate tickets (overnight, flat, subscriber) charge a
  // single fixed amount regardless of time elapsed.
  let hourAmount: number;
  let chargeableHours: number;
  let stoppedByOvernight: boolean;
  let hourFractionMins: number;
  let hourFractionStr: string;

  if (isFixed) {
    hourAmount = ratePerHour;
    chargeableHours = 1;
    stoppedByOvernight = false;
    hourFractionMins = elapsedMins;
    hourFractionStr = elapsedStr;
  } else {
    const hourFractionExitTime = dayjs(
      resolveHourFractionExitTime(
        entryTime.toDate(),
        exitTime.toDate(),
        additionalCharges,
      ),
    );
    hourFractionMins = Math.max(0, hourFractionExitTime.diff(entryTime, 'minute'));
    hourFractionStr = formatDurationMinutes(hourFractionMins);
    stoppedByOvernight =
      additionalCharges.some((c) => c.chargeType === 'overnight') &&
      hourFractionExitTime.isBefore(exitTime);

    const calc = calculateHourFractionAmount(hourFractionMins, ratePerHour);
    hourAmount = calc.amount;
    chargeableHours = calc.chargeableHours;
  }

  // PLAYA-313/314: H/F additional charges = rate × elapsed since appliedAt.
  const { total: additionalTotal, breakdown: additionalBreakdown } =
    calculateAdditionalChargesTotal(additionalCharges, exitTime.toDate());

  const grossAmount = hourAmount + additionalTotal;
  const discountSafe = Math.min(discount, grossAmount);
  const total = Math.max(0, grossAmount - discountSafe);

  // ── "Amanecida" applied too recently — warn before combining with hours ────
  const recentOvernightCharges = additionalCharges.filter(
    (c) =>
      c.chargeType === 'overnight' &&
      now.diff(dayjs(c.appliedAt), 'minute') < RECENT_OVERNIGHT_WARNING_MINUTES,
  );

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
    printTicketDirectly(charged);
  });

  const handleCancel = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) return;
    await cancelTicket.mutateAsync({ id: ticket.id, data: { cancelReason: cancelReason.trim() } });
    reset();
    onClose();
  };

  const handleRemoveCharge = (chargeId: string) => {
    removeCharge.mutate({ id: ticket.id, chargeId });
  };

  const isPending = chargeTicket.isPending || cancelTicket.isPending || removeCharge.isPending;
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
    <style>{`
      @keyframes chargeTicketKeyPulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.28), 0 4px 14px rgba(194, 65, 12, 0.35); }
        50% { box-shadow: 0 0 0 7px rgba(234, 88, 12, 0.18), 0 4px 18px rgba(194, 65, 12, 0.5); }
      }
      .charge-ticket-has-key {
        animation: chargeTicketKeyPulse 1.6s ease-in-out infinite;
      }
    `}</style>
    <Modal
        title={
          <Text strong style={{ fontSize: 16 }}>
            Cobro de Ticket
          </Text>
        }
        open={open}
        onCancel={() => { reset(); onClose(); }}
        footer={null}
        width={960}
        styles={{ body: { padding: '16px 24px' } }}
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
            <div
              className={ticket.hasKey ? 'charge-ticket-has-key' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: ticket.hasKey ? '8px 16px' : '4px 10px',
                borderRadius: ticket.hasKey ? 10 : 8,
                border: ticket.hasKey ? '2px solid #c2410c' : '2px solid #d1d5db',
                background: ticket.hasKey
                  ? 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)'
                  : '#f3f4f6',
                boxShadow: ticket.hasKey
                  ? '0 0 0 3px rgba(234, 88, 12, 0.28), 0 4px 14px rgba(194, 65, 12, 0.35)'
                  : 'none',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              <KeyOutlined
                style={{
                  fontSize: ticket.hasKey ? 22 : 18,
                  color: ticket.hasKey ? '#fff' : '#9ca3af',
                }}
              />
              <Text
                style={{
                  fontSize: ticket.hasKey ? 14 : 12,
                  fontWeight: 800,
                  letterSpacing: ticket.hasKey ? 0.4 : 0,
                  color: ticket.hasKey ? '#fff' : '#6b7280',
                  whiteSpace: 'nowrap',
                  textTransform: ticket.hasKey ? 'uppercase' : 'none',
                }}
              >
                {ticket.hasKey ? '¡Dejó llave!' : 'Sin llave'}
              </Text>
            </div>
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
              {
                label: stoppedByOvernight ? 'Tiempo H/F' : 'Tiempo',
                value: stoppedByOvernight ? hourFractionStr : elapsedStr,
              },
              ...(stoppedByOvernight
                ? [{ label: 'Tiempo total', value: elapsedStr }]
                : []),
              ...(isFixed
                ? [{ label: 'Tarifa fija', value: `s/. ${hourAmount.toFixed(2)}` }]
                : [
                    {
                      label: stoppedByOvernight
                        ? 'Horas cobradas (hasta amanecida)'
                        : 'Horas cobradas',
                      value: `${chargeableHours}h × s/.${ratePerHour.toFixed(2)}`,
                    },
                    {
                      label: 'Monto Horas',
                      value: `s/. ${hourAmount.toFixed(2)}`,
                    },
                  ]),
              ...(additionalTotal > 0
                ? [
                    {
                      label: 'Cargos Adic.',
                      value: `s/. ${additionalTotal.toFixed(2)}`,
                    },
                  ]
                : []),
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

        {/* ── Additional charges breakdown (amanecida, hora/fracción extra) ──── */}
        {additionalCharges.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
              Cargos Adicionales
            </Text>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {additionalCharges.map((c) => {
                const breakdown = additionalBreakdown.find((b) => b.charge === c);
                const finalAmount = breakdown?.finalAmount ?? parseFloat(c.amount);
                const isHourly = c.chargeType === 'hour_fraction';
                const appliedMins = isHourly
                  ? Math.max(0, exitTime.diff(dayjs(c.appliedAt), 'minute'))
                  : 0;
                return (
                <div
                  key={c.id}
                  style={{
                    ...nestedPanelStyle,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>
                      {RATE_TYPE_LABELS[c.chargeType] ?? c.chargeType}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>
                      desde {dayjs(c.appliedAt).format('DD/MM HH:mm')}
                    </Text>
                    {isHourly && (
                      <Text style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>
                        · tarifa s/.{parseFloat(c.amount).toFixed(2)}/h
                        · {formatDurationMinutes(appliedMins)}
                      </Text>
                    )}
                    {c.notes && (
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>
                        · {c.notes}
                      </Text>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: colors.accent }}>
                      s/. {finalAmount.toFixed(2)}
                    </Text>
                    {!cancelMode && (
                      <Popconfirm
                        title="¿Quitar este cargo adicional?"
                        okText="Sí, quitar"
                        cancelText="No"
                        onConfirm={() => handleRemoveCharge(c.id)}
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<CloseCircleOutlined />}
                          loading={removeCharge.isPending}
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent "amanecida" warning ──────────────────────────────────────── */}
        {recentOvernightCharges.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Cargo de amanecida aplicado hace poco"
            description="El vehículo salió a los pocos minutos de activarse la amanecida. Si el cliente no llegó a usar el servicio de toda la noche, considere quitar el cargo (arriba) y cobrar únicamente las horas consumidas."
          />
        )}

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
          <Col xs={24} md={plateEvents.length > 0 ? 14 : 24}>
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

              {/* Boleta → DNI (opcional; sin DNI se emite como CLIENTE VARIOS) */}
              {receiptType === 'boleta' && (
                <>
                  <Form.Item
                    label={
                      <span>
                        DNI del cliente{' '}
                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: 400 }}>
                          (opcional — sin DNI se emite como CLIENTE VARIOS)
                        </Text>
                      </span>
                    }
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
                          placeholder="12345678  (dejar vacío para CLIENTE VARIOS)"
                          suffix={dniLoading ? <Spin size="small" /> : null}
                        />
                      )}
                    />
                  </Form.Item>
                  {person && (
                    <Form.Item label="Cliente">
                      <Input
                        readOnly
                        value={formatDniDisplayName(person)}
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
              <Form.Item label="Eventos">
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
            <Col xs={24} md={10}>
              <Text style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
                Historial de Eventos
              </Text>
              <Table<PlateEvent>
                columns={eventCols}
                dataSource={plateEvents}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 260 }}
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
    </>
  );
}
