'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  BarcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
  SearchOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import { ScanStatus } from '@/types/scanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useScanTicket } from '@/hooks/useTickets';
import { ticketsService } from '@/services/tickets.service';
import { RATE_TYPE_LABELS, TICKET_STATUS_LABELS } from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

/** Milliseconds before the result panel auto-dismisses. */
const AUTO_DISMISS_MS = 12_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveScanStatus(ticket: Ticket): ScanStatus {
  switch (ticket.status) {
    case 'pending':   return 'found_pending';
    case 'paid':      return 'found_paid';
    case 'manual':    return 'found_manual';
    case 'cancelled': return 'found_cancelled';
    default:          return 'found_pending';
  }
}

function formatElapsed(entryTime: string): string {
  const mins = dayjs().diff(dayjs(entryTime), 'minute');
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanTicketBarProps {
  /** Called when the operator confirms an action on a found ticket. */
  onTicketFound: (ticket: Ticket, action: 'charge' | 'receipt') => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScanTicketBar({ onTicketFound }: ScanTicketBarProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [plateInput, setPlateInput] = useState('');

  const scanTicket = useScanTicket();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearDismissTimer();
    dismissTimerRef.current = setTimeout(() => {
      setScanStatus('idle');
      setScannedTicket(null);
      setErrorMessage(null);
    }, AUTO_DISMISS_MS);
  }, [clearDismissTimer]);

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  // ── Core scan logic (shared by hardware scanner + manual input) ────────────

  const processCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().replace(/[\r\n]/g, '');
      if (!code) return;

      setScanStatus('scanning');
      setScannedTicket(null);
      setErrorMessage(null);
      clearDismissTimer();

      try {
        const ticket = await scanTicket.mutateAsync(code);
        setScannedTicket(ticket);
        setScanStatus(resolveScanStatus(ticket));
        scheduleDismiss();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

        setScanStatus(status === 404 ? 'not_found' : 'error');
        setErrorMessage(msg ?? (status === 404 ? 'Código no encontrado' : 'Error de conexión'));
        scheduleDismiss();
      }
    },
    [scanTicket, clearDismissTimer, scheduleDismiss],
  );

  // ── Hardware scanner (USB HID keyboard emulation) ─────────────────────────
  useBarcodeScanner({
    onScan: processCode,
    enabled: true,
    minLength: 3,
    captureWhenInputFocused: false,
  });

  // ── Manual code input ─────────────────────────────────────────────────────
  const handleManualScan = () => {
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
    setManualCode('');
  };

  // ── Plate search (for post-payment receipts) ───────────────────────────────
  const handlePlateSearch = async () => {
    const plate = plateInput.trim().toUpperCase();
    if (!plate) return;

    setScanStatus('scanning');
    setScannedTicket(null);
    setErrorMessage(null);
    clearDismissTimer();
    setPlateInput('');

    try {
      const tickets = await ticketsService.getTicketsByPlate(plate);
      const paid = tickets.find((t) => t.status === 'paid' || t.status === 'manual');
      const pending = tickets.find((t) => t.status === 'pending');
      const ticket = paid ?? pending;

      if (!ticket) {
        setScanStatus('not_found');
        setErrorMessage(`Sin tickets activos para la placa ${plate}`);
        scheduleDismiss();
        return;
      }

      setScannedTicket(ticket);
      setScanStatus(resolveScanStatus(ticket));
      scheduleDismiss();
    } catch {
      setScanStatus('error');
      setErrorMessage('Error al buscar tickets por placa');
      scheduleDismiss();
    }
  };

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleAction = (action: 'charge' | 'receipt') => {
    if (!scannedTicket) return;
    clearDismissTimer();
    setScanStatus('idle');
    setScannedTicket(null);
    onTicketFound(scannedTicket, action);
  };

  const handleDismiss = () => {
    clearDismissTimer();
    setScanStatus('idle');
    setScannedTicket(null);
    setErrorMessage(null);
  };

  const isLookingUp = scanStatus === 'scanning';

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          ...cardStyle,
          padding: '12px 16px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        {/* Scanner-active indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#16a34a',
              boxShadow: '0 0 0 2px #bbf7d0',
            }}
          />
          <Text style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>
            Escáner activo
          </Text>
        </div>

        {/* Code input (manual + hardware scanner via onPressEnter) */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
            Código de ticket (QR / manual)
          </Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<BarcodeOutlined style={{ color: colors.textMuted }} />}
              placeholder="Escanear o escribir código..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onPressEnter={handleManualScan}
              size="large"
            />
            <Button
              type="primary"
              size="large"
              loading={isLookingUp}
              onClick={handleManualScan}
              style={{ background: colors.primary, borderColor: colors.primary }}
            >
              Buscar
            </Button>
          </Space.Compact>
        </div>

        {/* Plate search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
            Buscar por placa
          </Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              placeholder="Placa..."
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
              onPressEnter={handlePlateSearch}
              size="large"
              style={{ fontFamily: 'monospace' }}
            />
            <Button size="large" onClick={handlePlateSearch}>
              Buscar
            </Button>
          </Space.Compact>
        </div>
      </div>

      {/* ── Result panel ───────────────────────────────────────────────────── */}
      {scanStatus !== 'idle' && (
        <ScanResultPanel
          status={scanStatus}
          ticket={scannedTicket}
          errorMessage={errorMessage}
          onCharge={() => handleAction('charge')}
          onReceipt={() => handleAction('receipt')}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────

interface ScanResultPanelProps {
  status: ScanStatus;
  ticket: Ticket | null;
  errorMessage: string | null;
  onCharge: () => void;
  onReceipt: () => void;
  onDismiss: () => void;
}

const STATUS_CONFIG: Record<
  ScanStatus,
  { bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  idle: {
    bg: '',
    border: '',
    icon: null,
    label: '',
  },
  scanning: {
    bg: '#fbf7f2',
    border: `1px solid ${colors.cardBorder}`,
    icon: <Spin indicator={<LoadingOutlined spin />} size="small" />,
    label: 'Consultando ticket…',
  },
  found_pending: {
    bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '2px solid #16a34a',
    icon: <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} />,
    label: 'PENDIENTE DE COBRO',
  },
  found_paid: {
    bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: `2px solid ${colors.primary}`,
    icon: <CheckCircleOutlined style={{ color: colors.primary, fontSize: 20 }} />,
    label: 'YA COBRADO',
  },
  found_manual: {
    bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: `2px solid ${colors.primary}`,
    icon: <CheckCircleOutlined style={{ color: colors.primary, fontSize: 20 }} />,
    label: 'COBRO MANUAL',
  },
  found_cancelled: {
    bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    border: '2px solid #dc2626',
    icon: <CloseCircleOutlined style={{ color: '#dc2626', fontSize: 20 }} />,
    label: 'TICKET ANULADO',
  },
  not_found: {
    bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '2px solid #d97706',
    icon: <ExclamationCircleOutlined style={{ color: '#d97706', fontSize: 20 }} />,
    label: 'NO ENCONTRADO',
  },
  error: {
    bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    border: '2px solid #dc2626',
    icon: <WifiOutlined style={{ color: '#dc2626', fontSize: 20 }} />,
    label: 'ERROR DE CONEXIÓN',
  },
};

function ScanResultPanel({
  status,
  ticket,
  errorMessage,
  onCharge,
  onReceipt,
  onDismiss,
}: ScanResultPanelProps) {
  const cfg = STATUS_CONFIG[status];
  const isFound =
    status === 'found_pending' ||
    status === 'found_paid' ||
    status === 'found_manual' ||
    status === 'found_cancelled';

  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 12,
        background: cfg.bg,
        border: cfg.border,
        padding: '16px 20px',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      {/* Dismiss button */}
      {status !== 'scanning' && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            padding: 4,
            lineHeight: 1,
          }}
        >
          <CloseOutlined style={{ fontSize: 14 }} />
        </button>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: status === 'scanning' ? 0 : 12 }}>
        {cfg.icon}
        <Text strong style={{ fontSize: 12, letterSpacing: 1, color: colors.text }}>
          {cfg.label}
        </Text>
      </div>

      {/* Scanning spinner only */}
      {status === 'scanning' && null}

      {/* Ticket details */}
      {isFound && ticket && (
        <>
          {/* Plate — large display */}
          <div
            style={{
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: 36,
              letterSpacing: 6,
              color: '#111',
              background: '#fff',
              borderRadius: 10,
              padding: '6px 20px',
              display: 'inline-block',
              marginBottom: 12,
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {ticket.plate}
          </div>

          {/* Info grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', marginBottom: 14 }}>
            <InfoItem label="Código" value={ticket.ticketCode} mono />
            {ticket.vehicleType && (
              <InfoItem label="Vehículo" value={ticket.vehicleType.name} />
            )}
            <InfoItem
              label="Tarifa"
              value={`s/. ${parseFloat(ticket.rateAmount).toFixed(2)} · ${RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType}`}
            />
            <InfoItem
              label="Ingreso"
              value={dayjs(ticket.entryTime).format('DD/MM/YYYY HH:mm')}
            />
            <InfoItem label="Tiempo" value={formatElapsed(ticket.entryTime)} />
            {ticket.status === 'paid' || ticket.status === 'manual' ? (
              <>
                {ticket.exitTime && (
                  <InfoItem
                    label="Salida"
                    value={dayjs(ticket.exitTime).format('DD/MM/YYYY HH:mm')}
                  />
                )}
                <InfoItem
                  label="Monto cobrado"
                  value={`s/. ${parseFloat(ticket.finalAmount).toFixed(2)}`}
                />
              </>
            ) : null}
            {ticket.status === 'cancelled' && ticket.cancelReason && (
              <InfoItem label="Motivo anulación" value={ticket.cancelReason} />
            )}
            <Tag color={statusTagColor(ticket.status)} style={{ alignSelf: 'center' }}>
              {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Tag>
          </div>

          {/* Action buttons */}
          {status === 'found_pending' && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={onCharge}
              style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
            >
              Cobrar
            </Button>
          )}
          {(status === 'found_paid' || status === 'found_manual') && (
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={onReceipt}
              style={{ background: colors.primary, borderColor: colors.primary, fontWeight: 700 }}
            >
              Emitir Comprobante
            </Button>
          )}
        </>
      )}

      {/* Error / not-found message */}
      {(status === 'not_found' || status === 'error') && errorMessage && (
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{errorMessage}</Text>
      )}
    </div>
  );
}

// ── Micro helper ──────────────────────────────────────────────────────────────

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
        {label}
      </Text>
      <Text strong style={{ fontSize: 13, fontFamily: mono ? 'monospace' : undefined }}>
        {value}
      </Text>
    </div>
  );
}

function statusTagColor(status: string): string {
  switch (status) {
    case 'pending':  return 'blue';
    case 'paid':     return 'green';
    case 'manual':   return 'cyan';
    case 'cancelled': return 'red';
    default:         return 'default';
  }
}
