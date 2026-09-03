'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
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
  PlusCircleOutlined,
  ReloadOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCurrentShift, useAddExpense, useCloseShift, useOpenShift } from '@/hooks/useCashRegister';
import { useTickets } from '@/hooks/useTickets';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';
import { useAuth } from '@/providers/AuthProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { CashierWorkflowBanner } from '@/components/cashier/CashierWorkflowBanner';
import { CashRegister } from '@/types/api';
import { formatLimaDateTime } from '@/lib/datetime';
import { cardStyle, colors, highlightPanelStyle, nestedPanelStyle } from '@/lib/theme';

const { Text, Title } = Typography;

// ── Form schema (expense only — closing is a single direct action) ────────────
const expenseSchema = z.object({
  extraExpenses: z.number().min(0, 'Ingresa un monto válido').optional(),
  extraNotes: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

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
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Space style={{ fontSize: 12, color: colors.textMuted }}>
        {icon}
        <span>{label}</span>
      </Space>
      <span style={{ fontSize: 16, fontWeight: 700, color: color ?? colors.text, whiteSpace: 'nowrap' }}>
        {formatted}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CashRegisterPage() {
  const { logout } = useAuth();
  const workflow = useCashierWorkflow();
  const { data: shift, isLoading, isFetching, refetch } = useCurrentShift(workflow.isCashier);
  const { data: pendingTickets = [] } = useTickets('pending');
  const addExpense = useAddExpense();
  const closeShift = useCloseShift();
  const openShift = useOpenShift();

  const [closeNotes, setCloseNotes] = useState('');
  const [unbalancedOpen, setUnbalancedOpen] = useState(false);
  const [balanceNotes, setBalanceNotes] = useState('');
  const [balanceNotesError, setBalanceNotesError] = useState('');
  const [closeResult, setCloseResult] = useState<CashRegister | null>(null);

  const isOpen = !!shift && !shift.closedAt;
  const canOperateClose = workflow.isCheckedIn && workflow.isShiftOpen;

  const confirmPendingTickets = (): Promise<boolean> => {
    if (pendingTickets.length === 0) return Promise.resolve(true);

    return new Promise((resolve) => {
      Modal.confirm({
        title: `${pendingTickets.length} ticket(s) pendiente(s)`,
        content:
          'Aún hay tickets sin cobrar. ¿Deseas cerrar la caja de todas formas?',
        okText: 'Sí, cerrar turno',
        cancelText: 'Cancelar',
        okButtonProps: { danger: true },
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  const handleCloseBalanced = async () => {
    if (!canOperateClose) return;
    const proceed = await confirmPendingTickets();
    if (!proceed) return;

    const result = await closeShift.mutateAsync({
      balanceStatus: 'balanced',
      differenceAmount: 0,
      balanceNotes: null,
      extraNotes: closeNotes || undefined,
    });
    setCloseNotes('');
    setCloseResult(result);
  };

  const openUnbalancedDialog = async () => {
    if (!canOperateClose) return;
    const proceed = await confirmPendingTickets();
    if (!proceed) return;
    setBalanceNotes('');
    setBalanceNotesError('');
    setUnbalancedOpen(true);
  };

  const handleCloseUnbalanced = async () => {
    const note = balanceNotes.trim();
    if (!note) {
      setBalanceNotesError('Ingresa el motivo del descuadre');
      return;
    }
    const result = await closeShift.mutateAsync({
      balanceStatus: 'unbalanced',
      differenceAmount: 0,
      balanceNotes: note,
      extraNotes: closeNotes || undefined,
    });
    setUnbalancedOpen(false);
    setBalanceNotes('');
    setBalanceNotesError('');
    setCloseNotes('');
    setCloseResult(result);
  };

  const handlePostCloseLogout = async () => {
    setCloseResult(null);
    await logout();
  };

  // ── Expense form ────────────────────────────────────────────────────────────
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { extraExpenses: 0, extraNotes: '' },
  });

  const handleExpense = expenseForm.handleSubmit(async (data) => {
    await addExpense.mutateAsync(data);
    expenseForm.reset({ extraExpenses: 0, extraNotes: '' });
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
        <CashierWorkflowBanner />

        {/* PLAYA-304: attendance open but no caja → offer to open one */}
        {workflow.hasOpenSession ? (
          <div
            style={{
              ...cardStyle,
              padding: '40px 24px',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            <WalletOutlined style={{ fontSize: 48, color: colors.primary, marginBottom: 16 }} />
            <Title level={4} style={{ color: colors.text, margin: '0 0 8px' }}>
              No hay turno de caja abierto
            </Title>
            <Text style={{ color: colors.textMuted, display: 'block', marginBottom: 24 }}>
              Tu asistencia está activa. Abre un turno de caja para empezar a cobrar tickets.
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<PlusCircleOutlined />}
              loading={openShift.isPending}
              onClick={() => openShift.mutate()}
              style={{ background: colors.primary, borderColor: colors.primary, minWidth: 200 }}
            >
              Abrir turno de caja
            </Button>
          </div>
        ) : (
          <Empty
            description={
              <Text style={{ color: colors.textMuted }}>
                No hay turno activo. Marca tu asistencia desde la barra superior y luego abre un turno de caja.
              </Text>
            }
            style={{ marginTop: 80 }}
          />
        )}
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
              Turno abierto · {formatLimaDateTime(shift.createdAt)}
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

      <CashierWorkflowBanner />

      {isOpen ? (
        <Row gutter={[20, 20]}>
          {/* ── Columna izquierda: información + agregar gasto ──────────────── */}
          <Col xs={24} lg={13}>
            <div style={{ ...cardStyle, padding: '20px 24px', height: '100%' }}>
              {/* Header row: cajero + fecha + tickets pendientes */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
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

              {/* Ingresos por método de pago */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                <StatTile label="Efectivo" value={shift.cashAmount} color="#22c55e" icon={<WalletOutlined />} />
                <StatTile label="Yape" value={shift.yapeAmount} color="#a855f7" icon={<MobileOutlined />} />
                <StatTile label="Plin" value={shift.plinAmount} color="#3b82f6" icon={<MobileOutlined />} />
                <StatTile label="Tarjeta" value={shift.cardAmount} color="#f59e0b" icon={<BankOutlined />} />
              </div>

              {/* Deducciones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
                <StatTile label="Descuentos" value={shift.discountsTotal} color="#ef4444" prefix="- s/." />
                <StatTile
                  label={`Anulados (${shift.cancellationsCount})`}
                  value={shift.cancellationsTotal}
                  color="#ef4444"
                  prefix="- s/."
                />
                <StatTile label="Gastos de Caja" value={shift.extraExpenses} color="#ef4444" prefix="- s/." />
              </div>

              {/* Total recaudado */}
              <div
                style={{
                  marginTop: 12,
                  ...highlightPanelStyle,
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                  TOTAL RECAUDADO
                </Text>
                <span style={{ fontSize: 26, fontWeight: 900, color: colors.accent, lineHeight: 1 }}>
                  s/. {parseFloat(shift.totalAmount).toFixed(2)}
                </span>
              </div>

              {/* Agregar gasto — mini formulario compacto */}
              <div style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                  AGREGAR GASTO
                </Text>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Controller
                    name="extraExpenses"
                    control={expenseForm.control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        step={0.5}
                        style={{ width: 130 }}
                        prefix="s/."
                        placeholder="Monto"
                        size="large"
                      />
                    )}
                  />
                  <Controller
                    name="extraNotes"
                    control={expenseForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Descripción (ej. materiales de limpieza)"
                        size="large"
                        style={{ flex: 1, minWidth: 180 }}
                      />
                    )}
                  />
                  <Button
                    type="primary"
                    size="large"
                    loading={addExpense.isPending}
                    onClick={handleExpense}
                    style={{ background: colors.primary, borderColor: colors.primary }}
                  >
                    Registrar
                  </Button>
                </div>
                {expenseForm.formState.errors.extraExpenses && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {expenseForm.formState.errors.extraExpenses.message}
                  </Text>
                )}
              </div>
            </div>
          </Col>

          {/* ── Columna derecha: cerrar caja (directo) ──────────────────────── */}
          <Col xs={24} lg={11}>
            <div
              style={{
                ...cardStyle,
                padding: '20px 24px',
                height: '100%',
                border: '1px solid #fca5a5',
              }}
            >
              <Title level={5} style={{ margin: '0 0 4px', color: '#dc2626' }}>
                Cerrar Turno
              </Title>
              <Text style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 16 }}>
                {dayjs().format('DD [de] MMMM [de] YYYY · HH:mm')}
              </Text>

              {/* Total reference */}
              <div
                style={{
                  ...nestedPanelStyle,
                  padding: '14px 18px',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 12, display: 'block' }}>
                  Total generado del turno
                </Text>
                <span style={{ fontSize: 32, fontWeight: 900, color: colors.text }}>
                  s/. {parseFloat(shift.totalAmount).toFixed(2)}
                </span>
              </div>

              <Text style={{ color: colors.textMuted, fontSize: 13, display: 'block', marginBottom: 6 }}>
                Datos extra (opcional)
              </Text>
              <Input.TextArea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={3}
                placeholder="Observaciones generales del turno..."
                style={{ marginBottom: 20 }}
              />

              <Text style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 10 }}>
                {canOperateClose
                  ? 'Revisa los montos antes de continuar. Cerrar el turno no cierra la asistencia.'
                  : 'Necesitas asistencia marcada y turno de caja abierto para cuadrar.'}
              </Text>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  block
                  icon={<CheckCircleOutlined />}
                  loading={closeShift.isPending}
                  disabled={!canOperateClose}
                  onClick={handleCloseBalanced}
                  style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 600 }}
                >
                  Sí Cuadra
                </Button>
                <Button
                  danger
                  type="primary"
                  size="large"
                  shape="round"
                  block
                  icon={<WarningOutlined />}
                  loading={closeShift.isPending}
                  disabled={!canOperateClose}
                  onClick={openUnbalancedDialog}
                  style={{ fontWeight: 600 }}
                >
                  No Cuadra
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        shift.closedAt && (
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <Tag color={shift.balanceStatus === 'balanced' ? 'success' : 'warning'}>
                {shift.balanceStatus === 'balanced' ? 'Cuadrado ✓' : 'Descuadrado'}
              </Tag>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                Total: s/. {parseFloat(shift.totalAmount).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Cerrado el {formatLimaDateTime(shift.closedAt)}
              </Text>
            </div>
          </div>
        )
      )}

      {/* ── Dialog: motivo de descuadre (balanceNotes) ───────────────────────── */}
      <Modal
        title="Caja no cuadra"
        open={unbalancedOpen}
        onCancel={() => {
          if (closeShift.isPending) return;
          setUnbalancedOpen(false);
          setBalanceNotesError('');
        }}
        centered
        destroyOnHidden
        okText="Confirmar descuadre"
        cancelText="Cancelar"
        okButtonProps={{
          danger: true,
          loading: closeShift.isPending,
          icon: <WarningOutlined />,
        }}
        onOk={handleCloseUnbalanced}
      >
        <Text style={{ color: colors.textMuted, display: 'block', marginBottom: 8 }}>
          Indica el motivo del descuadre. Esta nota se guardará en el cierre del turno.
        </Text>
        <Input.TextArea
          value={balanceNotes}
          onChange={(e) => {
            setBalanceNotes(e.target.value);
            if (balanceNotesError) setBalanceNotesError('');
          }}
          rows={4}
          placeholder="Ej. Faltan s/. 20 en efectivo, sobró en Yape..."
          status={balanceNotesError ? 'error' : undefined}
          autoFocus
        />
        {balanceNotesError && (
          <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
            {balanceNotesError}
          </Text>
        )}
      </Modal>

      {/* ── Modal de confirmación tras cerrar caja ───────────────────────────── */}
      <Modal
        open={!!closeResult}
        onCancel={() => setCloseResult(null)}
        closable
        maskClosable={false}
        centered
        footer={[
          <Button key="later" onClick={() => setCloseResult(null)}>
            Continuar
          </Button>,
          <Button
            key="logout"
            type="primary"
            danger
            onClick={handlePostCloseLogout}
            style={{ fontWeight: 600 }}
          >
            Cerrar sesión
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
          <CheckCircleOutlined style={{ fontSize: 56, color: '#22c55e' }} />
          <Title level={4} style={{ margin: '12px 0 4px', color: colors.text }}>
            ¡Turno de caja cerrado!
          </Title>
          {closeResult && (
            <>
              <Text style={{ fontSize: 22, fontWeight: 800, color: colors.accent, display: 'block', margin: '8px 0' }}>
                s/. {parseFloat(closeResult.totalAmount).toFixed(2)}
              </Text>
              <Tag color={closeResult.balanceStatus === 'balanced' ? 'success' : 'warning'}>
                {closeResult.balanceStatus === 'balanced' ? 'Cuadrado' : 'Descuadrado'}
              </Tag>
            </>
          )}
          <Text style={{ display: 'block', marginTop: 16, color: colors.textMuted }}>
            El turno de caja quedó cerrado. Tu asistencia sigue activa — marca tu salida
            desde la barra superior cuando termines la jornada.
          </Text>
        </div>
      </Modal>
    </>
  );
}
