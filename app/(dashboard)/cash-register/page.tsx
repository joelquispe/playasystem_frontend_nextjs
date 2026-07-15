'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MobileOutlined,
  ReloadOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCurrentShift, useAddExpense, useCloseShift } from '@/hooks/useCashRegister';
import { useTickets } from '@/hooks/useTickets';
import { PageHeader } from '@/components/ui/PageHeader';
import { cardStyle, colors, highlightPanelStyle, nestedPanelStyle } from '@/lib/theme';

const { Text, Title } = Typography;

// ── Form schemas ──────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  extraExpenses: z.number().min(0, 'Ingresa un monto válido').optional(),
  extraNotes: z.string().optional(),
});

const closeSchema = z
  .object({
    balanceStatus: z.enum(['balanced', 'unbalanced']),
    differenceAmount: z.number().default(0),
    balanceNotes: z.string().optional(),
    extraNotes: z.string().optional(),
  })
  .refine((d) => d.balanceStatus !== 'unbalanced' || !!d.balanceNotes?.trim(), {
    message: 'Explica el motivo del descuadre',
    path: ['balanceNotes'],
  });

type ExpenseForm = z.infer<typeof expenseSchema>;
type CloseForm = z.infer<typeof closeSchema>;

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({
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
  /** Pass "" to show raw number, "- s/." for deductions, default "s/." */
  prefix?: string;
}) {
  const formatted =
    prefix === ''
      ? String(typeof value === 'number' ? value : parseFloat(value))
      : `${prefix} ${typeof value === 'number' ? value.toFixed(2) : parseFloat(value).toFixed(2)}`;

  return (
    <div
      style={{
        ...nestedPanelStyle,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Space style={{ fontSize: 11, color: colors.textMuted }}>
        {icon}
        <span>{label}</span>
      </Space>
      <span style={{ fontSize: 18, fontWeight: 700, color: color ?? colors.text }}>
        {formatted}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CashRegisterPage() {
  const { data: shift, isLoading, isFetching, refetch } = useCurrentShift();
  const { data: pendingTickets = [] } = useTickets('pending');
  const addExpense = useAddExpense();
  const closeShift = useCloseShift();

  const isOpen = !!shift && !shift.closedAt;

  // ── Expense form ────────────────────────────────────────────────────────────
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { extraExpenses: 0, extraNotes: '' },
  });

  const handleExpense = expenseForm.handleSubmit(async (data) => {
    await addExpense.mutateAsync(data);
    expenseForm.reset({ extraExpenses: 0, extraNotes: '' });
  });

  // ── Close shift form ────────────────────────────────────────────────────────
  const closeForm = useForm<CloseForm>({
    resolver: zodResolver(closeSchema) as never,
    defaultValues: { balanceStatus: 'balanced', differenceAmount: 0 },
  });

  const balanceStatus = closeForm.watch('balanceStatus');

  const handleClose = closeForm.handleSubmit(async (data) => {
    await closeShift.mutateAsync({
      balanceStatus: data.balanceStatus,
      differenceAmount: data.differenceAmount,
      balanceNotes: data.balanceNotes || null,
      extraNotes: data.extraNotes,
    });
    closeForm.reset({ balanceStatus: 'balanced', differenceAmount: 0 });
  });

  // ── Loading / empty states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <PageHeader title="Caja" subtitle="Turno actual" />
        <Skeleton active style={{ ...cardStyle, padding: 24 }} />
      </>
    );
  }

  if (!shift) {
    return (
      <>
        <PageHeader title="Caja" subtitle="Turno actual" />
        <Empty
          description={
            <Text style={{ color: colors.textMuted }}>No se encontró turno activo para este usuario</Text>
          }
          style={{ marginTop: 80 }}
        />
      </>
    );
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Caja"
        subtitle={
          isOpen ? (
            <Tag color="green" style={{ fontWeight: 600 }}>
              Turno abierto · {dayjs(shift.createdAt).format('DD/MM/YYYY HH:mm')}
            </Tag>
          ) : (
            <Tag color="default" style={{ fontWeight: 600 }}>
              Turno cerrado
            </Tag>
          )
        }
        extra={
          <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
            Actualizar
          </Button>
        }
      />

      {/* ── Section 1: Resumen del turno ────────────────────────────────────── */}
      <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: 20 }}>

        {/* Header row: cajero + fecha + tickets pendientes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text style={{ color: colors.textMuted, fontSize: 11, display: 'block', letterSpacing: 0.5 }}>
              CAJERO
            </Text>
            <Text strong style={{ color: colors.text, fontSize: 15 }}>{shift.cashier?.fullName}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 10 }}>{shift.shiftDate}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: '#f59e0b' }} />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              <strong style={{ color: '#f59e0b', fontSize: 16 }}>{pendingTickets.length}</strong>
              {' '}tickets pendientes
            </Text>
          </div>
        </div>

        {/* ── BLOQUE A: INGRESOS ─────────────────────────────────────────────── */}
        <Text style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
          INGRESOS POR MÉTODO DE PAGO
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          <StatTile label="Efectivo" value={shift.cashAmount} color="#22c55e" icon={<WalletOutlined />} />
          <StatTile label="Yape" value={shift.yapeAmount} color="#a855f7" icon={<MobileOutlined />} />
          <StatTile label="Plin" value={shift.plinAmount} color="#3b82f6" icon={<MobileOutlined />} />
          <StatTile label="Tarjeta" value={shift.cardAmount} color="#f59e0b" icon={<BankOutlined />} />
        </div>

        {/* ── Separator con etiqueta "menos" ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: colors.divider }} />
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>
            DEDUCCIONES
          </Text>
          <div style={{ flex: 1, height: 1, background: colors.divider }} />
        </div>

        {/* ── BLOQUE B: DEDUCCIONES ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <StatTile label="Descuentos" value={shift.discountsTotal} color="#ef4444" prefix="- s/." />
          <StatTile
            label={`Cancelaciones (${shift.cancellationsCount})`}
            value={shift.cancellationsTotal}
            color="#ef4444"
            prefix="- s/."
          />
          <StatTile label="Gastos extra" value={shift.extraExpenses} color="#ef4444" prefix="- s/." />
        </div>

        {/* ── BLOQUE C: TOTAL (resultado) ────────────────────────────────────── */}
        <div
          style={{
            marginTop: 16,
            ...highlightPanelStyle,
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <Text style={{ color: colors.textMuted, fontSize: 11, display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>
              = TOTAL RECAUDADO
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Efectivo + Yape + Plin + Tarjeta
            </Text>
          </div>
          <span style={{ fontSize: 34, fontWeight: 900, color: colors.accent, lineHeight: 1 }}>
            s/. {parseFloat(shift.totalAmount).toFixed(2)}
          </span>
        </div>

        {/* Closed shift status */}
        {!isOpen && shift.closedAt && (
          <div
            style={{
              marginTop: 14,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Tag color={shift.balanceStatus === 'balanced' ? 'success' : 'warning'}>
              {shift.balanceStatus === 'balanced' ? 'Cuadrado ✓' : 'Descuadrado'}
            </Tag>
            {parseFloat(shift.differenceAmount) !== 0 && (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                Diferencia: s/. {parseFloat(shift.differenceAmount).toFixed(2)}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              Cerrado el {dayjs(shift.closedAt).format('DD/MM/YYYY [a las] HH:mm')}
            </Text>
          </div>
        )}

        {shift.extraNotes && (
          <div
            style={{
              marginTop: 12,
              ...nestedPanelStyle,
              padding: '8px 12px',
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {shift.extraNotes}
          </div>
        )}
      </div>

      {/* ── Section 2 & 3: Actions (only when shift is open) ────────────────── */}
      {isOpen && (
        <Row gutter={[20, 20]}>
          {/* ── Agregar Gasto ─────────────────────────────────────────────── */}
          <Col xs={24} md={12}>
            <div style={{ ...cardStyle, padding: '20px 24px', height: '100%' }}>
              <Title level={5} style={{ margin: '0 0 16px', color: colors.text }}>
                Agregar Gasto
              </Title>

              <Form layout="vertical" requiredMark={false}>
                <Form.Item
                  label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Monto (s/.)</Text>}
                  validateStatus={expenseForm.formState.errors.extraExpenses ? 'error' : ''}
                  help={expenseForm.formState.errors.extraExpenses?.message}
                  style={{ marginBottom: 12 }}
                >
                  <Controller
                    name="extraExpenses"
                    control={expenseForm.control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        step={0.5}
                        style={{ width: '100%' }}
                        prefix="s/."
                        placeholder="0.00"
                        size="large"
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Descripción</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="extraNotes"
                    control={expenseForm.control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        rows={3}
                        placeholder="Ej. Compra de materiales de limpieza..."
                      />
                    )}
                  />
                </Form.Item>
              </Form>

              <Button
                type="primary"
                size="large"
                block
                loading={addExpense.isPending}
                onClick={handleExpense}
                style={{ background: colors.primary, borderColor: colors.primary }}
              >
                Registrar Gasto
              </Button>
            </div>
          </Col>

          {/* ── Cerrar Turno ──────────────────────────────────────────────── */}
          <Col xs={24} md={12}>
            <div
              style={{
                ...cardStyle,
                padding: '20px 24px',
                height: '100%',
                border: `1px solid #fca5a5`,
              }}
            >
              <Title level={5} style={{ margin: '0 0 4px', color: '#dc2626' }}>
                Cerrar Turno
              </Title>
              <Text style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 16 }}>
                Revisa los montos antes de cerrar. Esta acción no se puede deshacer.
              </Text>

              {/* Total reference */}
              <div
                style={{
                  ...nestedPanelStyle,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Total en sistema</Text>
                <Text strong style={{ color: colors.accent, fontSize: 20 }}>
                  s/. {parseFloat(shift.totalAmount).toFixed(2)}
                </Text>
              </div>

              <Form layout="vertical" requiredMark={false}>
                <Form.Item
                  label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Estado del cuadre</Text>}
                  style={{ marginBottom: 12 }}
                >
                  <Controller
                    name="balanceStatus"
                    control={closeForm.control}
                    render={({ field }) => (
                      <Radio.Group {...field} size="large">
                        <Radio.Button value="balanced">
                          <CheckCircleOutlined style={{ color: '#22c55e', marginRight: 4 }} />
                          Cuadrado
                        </Radio.Button>
                        <Radio.Button value="unbalanced">
                          <WarningOutlined style={{ color: '#f59e0b', marginRight: 4 }} />
                          Descuadrado
                        </Radio.Button>
                      </Radio.Group>
                    )}
                  />
                </Form.Item>

                {balanceStatus === 'unbalanced' && (
                  <>
                    <Form.Item
                      label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Diferencia (s/.)</Text>}
                      help="Positivo = sobrante · negativo = faltante"
                      style={{ marginBottom: 12 }}
                    >
                      <Controller
                        name="differenceAmount"
                        control={closeForm.control}
                        render={({ field }) => (
                          <InputNumber {...field} style={{ width: '100%' }} prefix="s/." />
                        )}
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Motivo del descuadre</Text>}
                      validateStatus={closeForm.formState.errors.balanceNotes ? 'error' : ''}
                      help={closeForm.formState.errors.balanceNotes?.message}
                      style={{ marginBottom: 12 }}
                    >
                      <Controller
                        name="balanceNotes"
                        control={closeForm.control}
                        render={({ field }) => (
                          <Input.TextArea
                            {...field}
                            rows={2}
                            placeholder="Explica el motivo del descuadre..."
                          />
                        )}
                      />
                    </Form.Item>
                  </>
                )}

                <Form.Item
                  label={<Text style={{ color: colors.textMuted, fontSize: 13 }}>Notas del turno</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="extraNotes"
                    control={closeForm.control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        rows={2}
                        placeholder="Observaciones generales del turno..."
                      />
                    )}
                  />
                </Form.Item>
              </Form>

              <Divider style={{ margin: '0 0 14px', borderColor: '#fca5a5' }} />

              <Button
                danger
                type="primary"
                size="large"
                block
                loading={closeShift.isPending}
                onClick={handleClose}
              >
                Cerrar Turno Definitivamente
              </Button>
            </div>
          </Col>
        </Row>
      )}
    </>
  );
}
