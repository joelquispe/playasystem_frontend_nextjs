'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Tag,
  Typography,
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SearchOutlined,
  SmileOutlined,
  TruckOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useVehicles, useSetVehicleDefaultRate } from '@/hooks/useVehicles';
import { useRates } from '@/hooks/useRates';
import { useCreateTicket } from '@/hooks/useTickets';
import { useClientByPlate } from '@/hooks/useClients';
import { useActiveSubscriberByPlate } from '@/hooks/useSubscribers';
import { Client, Rate, RateType, Subscriber, Ticket, VehicleType } from '@/types/api';
import { TicketPrintModal } from '@/components/tickets/TicketPrintModal';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import {
  formatRateOption,
  getDefaultHourRate,
  getVehicleRates,
  pickDefaultRate,
} from '@/lib/vehicles';
import { cardStyle, colors } from '@/lib/theme';

const { Text, Title } = Typography;

// ── Vehicle icon map ──────────────────────────────────────────────────────────
const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  moto: <ThunderboltOutlined />,
  auto: <CarOutlined />,
  suv: <CarOutlined />,
  pickup_large: <TruckOutlined />,
  truck: <TruckOutlined />,
  van: <TruckOutlined />,
};

// ── Event colour → emoji ──────────────────────────────────────────────────────
const EVENT_FACE: Record<string, React.ReactNode> = {
  green: <SmileOutlined style={{ color: '#16a34a', fontSize: 28 }} />,
  red: <WarningOutlined style={{ color: '#dc2626', fontSize: 28 }} />,
  white: <SmileOutlined style={{ color: '#6b7280', fontSize: 28 }} />,
};

// ── Search step ───────────────────────────────────────────────────────────────
type Step = 'idle' | 'ready';

interface SistemaEntryPanelProps {
  onTicketCreated?: () => void;
}

export function SistemaEntryPanel({ onTicketCreated }: SistemaEntryPanelProps) {
  const { data: vehicles = [] } = useVehicles();
  const createTicket = useCreateTicket();
  const setVehicleDefaultRate = useSetVehicleDefaultRate();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [plate, setPlate] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | undefined>();
  const [specialRateType, setSpecialRateType] = useState<RateType | null>(null);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);
  const plateInputRef = useRef<InputRef>(null);

  const normalizedPlate = plate.trim().toUpperCase();
  const isPlateReady = normalizedPlate.length >= 3;

  // ── Background queries (auto-fetch while typing) ──────────────────────────
  const { data: foundClient, isFetching: fetchingClient } = useClientByPlate(normalizedPlate);
  const { data: foundSubscriber, isFetching: fetchingSubscriber } = useActiveSubscriberByPlate(normalizedPlate);
  const isFetching = fetchingClient || fetchingSubscriber;

  // ── Derived vehicle ───────────────────────────────────────────────────────
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  // ── Rates for selected vehicle / special types ────────────────────────────
  const isHourMode = !!selectedVehicleId && !specialRateType;

  const { data: hourFractionRates = [] } = useRates(
    selectedVehicleId ?? undefined,
    'hour_fraction',
    { enabled: isHourMode },
  );
  const { data: overnightRates = [] } = useRates(undefined, 'overnight', {
    enabled: specialRateType === 'overnight',
  });
  const { data: flatRates = [] } = useRates(undefined, 'flat', {
    enabled: specialRateType === 'flat',
  });
  const { data: subscriberRates = [] } = useRates(undefined, 'subscriber');

  const vehicleHourRates = useMemo(() => {
    if (hourFractionRates.length > 0) return hourFractionRates;
    return getVehicleRates(selectedVehicle, 'hour_fraction');
  }, [hourFractionRates, selectedVehicle]);

  // ── Auto-sync selectedRateId when pool changes ────────────────────────────
  useEffect(() => {
    if (specialRateType || !selectedVehicleId) return;
    if (vehicleHourRates.length === 0) { setSelectedRateId(undefined); return; }
    setSelectedRateId((cur) => {
      if (cur && vehicleHourRates.some((r) => r.id === cur)) return cur;
      return pickDefaultRate(vehicleHourRates)?.id;
    });
  }, [selectedVehicleId, specialRateType, vehicleHourRates]);

  useEffect(() => {
    if (!specialRateType) return;
    const pool =
      specialRateType === 'overnight' ? overnightRates
      : specialRateType === 'flat' ? flatRates
      : subscriberRates;
    if (pool.length === 0) return;
    setSelectedRateId((cur) => {
      if (cur && pool.some((r) => r.id === cur)) return cur;
      return pool[0]?.id;
    });
  }, [specialRateType, overnightRates, flatRates, subscriberRates]);

  // ── Resolved rate & amount ────────────────────────────────────────────────
  const selectedRate = useMemo((): Rate | undefined => {
    const pool =
      specialRateType === 'overnight' ? overnightRates
      : specialRateType === 'flat' ? flatRates
      : specialRateType === 'subscriber' ? subscriberRates
      : vehicleHourRates;
    if (selectedRateId) return pool.find((r) => r.id === selectedRateId) ?? pool[0];
    return pool[0];
  }, [specialRateType, selectedRateId, overnightRates, flatRates, subscriberRates, vehicleHourRates]);

  const resolvedRateType: RateType | null = specialRateType ?? (selectedRate ? 'hour_fraction' : null);

  const resolvedAmount = useMemo(() => {
    if (specialRateType === 'subscriber' && foundSubscriber) {
      return parseFloat(foundSubscriber.monthlyAmount);
    }
    if (selectedRate) return parseFloat(selectedRate.amount);
    return 0;
  }, [specialRateType, foundSubscriber, selectedRate]);

  const canGenerate =
    !!normalizedPlate && !!selectedVehicleId && !!resolvedRateType && resolvedAmount > 0;

  // ── Determine auto-selected vehicle & rate from client/subscriber ─────────
  const getAutoSelection = useCallback((): {
    vehicleId: string | null;
    rateId: string | undefined;
    specialType: RateType | null;
  } => {
    // 1. Active subscriber takes priority
    if (foundSubscriber) {
      const vehicleId =
        foundSubscriber.vehicleTypeId ??
        vehicles.find((v) => v.key === 'auto')?.id ??
        vehicles[0]?.id ??
        null;
      return { vehicleId, rateId: subscriberRates[0]?.id, specialType: 'subscriber' };
    }

    // 2. Registered client
    if (foundClient) {
      const vehicleId =
        foundClient.vehicleTypeId ??
        vehicles.find((v) => v.key === 'auto')?.id ??
        vehicles[0]?.id ??
        null;

      const vehicle = vehicles.find((v) => v.id === vehicleId);
      const defaultRate = getDefaultHourRate(vehicle);
      return { vehicleId, rateId: defaultRate?.id, specialType: null };
    }

    // 3. No client — default to Auto or first vehicle
    const defaultVehicle =
      vehicles.find((v) => v.key === 'auto') ?? vehicles[0];
    const defaultRate = getDefaultHourRate(defaultVehicle);
    return {
      vehicleId: defaultVehicle?.id ?? null,
      rateId: defaultRate?.id,
      specialType: null,
    };
  }, [foundClient, foundSubscriber, vehicles, subscriberRates]);

  // ── Handle search (first Enter / Buscar) ─────────────────────────────────
  const handleSearch = useCallback(() => {
    if (!isPlateReady || isFetching) return;

    const { vehicleId, rateId, specialType } = getAutoSelection();
    setSelectedVehicleId(vehicleId);
    setSpecialRateType(specialType);
    setSelectedRateId(rateId);
    setStep('ready');
  }, [isPlateReady, isFetching, getAutoSelection]);

  // ── Handle generate ticket (second Enter / button) ────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    const created = await createTicket.mutateAsync({
      plate: normalizedPlate,
      vehicleTypeId: selectedVehicleId!,
      rateType: resolvedRateType!,
      rateAmount: resolvedAmount,
      hasKey: false,
    });

    // Show print modal with created ticket
    setPrintTicket(created);

    // Reset panel
    setPlate('');
    setStep('idle');
    setSelectedVehicleId(null);
    setSelectedRateId(undefined);
    setSpecialRateType(null);
    onTicketCreated?.();
  }, [canGenerate, createTicket, normalizedPlate, selectedVehicleId, resolvedRateType, resolvedAmount, onTicketCreated]);

  // ── Enter key dispatcher ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (step === 'idle') {
      handleSearch();
    } else {
      handleGenerate();
    }
  };

  // ── Plate change resets step ──────────────────────────────────────────────
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlate(e.target.value.toUpperCase());
    setStep('idle');
    setSelectedVehicleId(null);
    setSelectedRateId(undefined);
    setSpecialRateType(null);
  };

  // ── Vehicle card select ───────────────────────────────────────────────────
  const selectVehicle = (vehicle: VehicleType, e?: React.MouseEvent) => {
    if ((e?.target as HTMLElement)?.closest?.('.ant-select')) return;
    if (selectedVehicleId === vehicle.id && !specialRateType) return;

    setSelectedVehicleId(vehicle.id);
    setSpecialRateType(null);

    const defaultRate = getDefaultHourRate(vehicle);
    setSelectedRateId(defaultRate?.id);

    if (defaultRate?.id) {
      setVehicleDefaultRate.mutate({ vehicleTypeId: vehicle.id, rateId: defaultRate.id });
    }
  };

  const selectSpecial = (type: RateType) => {
    if (!selectedVehicleId) {
      const autoVehicle = vehicles.find((v) => v.key === 'auto') ?? vehicles[0];
      if (autoVehicle) setSelectedVehicleId(autoVehicle.id);
    }
    setSpecialRateType(type);
  };

  const handleHourRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
    if (selectedVehicleId) {
      setVehicleDefaultRate.mutate({ vehicleTypeId: selectedVehicleId, rateId });
    }
  };

  const rateOptions = (rates: Rate[]) => rates.map(formatRateOption);

  // ── Client / subscriber card shown after search ───────────────────────────
  const showClientCard = step === 'ready' && (!!foundClient || !!foundSubscriber);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <Row gutter={[16, 16]}>
      {/* ── Main entry panel ─────────────────────────────────────────────── */}
      <Col xs={24} lg={showClientCard ? 16 : 24}>
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
          {/* Plate input */}
          <Row gutter={[12, 0]} align="middle">
            <Col flex="none">
              <Text strong style={{ color: colors.text, fontSize: 16 }}>PLACA:</Text>
            </Col>
            <Col flex="auto">
              <Input
                ref={plateInputRef}
                size="large"
                placeholder="Ingrese placa"
                value={plate}
                onChange={handlePlateChange}
                onKeyDown={handleKeyDown}
                style={{ fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700, fontSize: 20 }}
                autoFocus
              />
            </Col>
            <Col flex="none">
              <Button
                size="large"
                icon={<SearchOutlined />}
                loading={isFetching}
                disabled={!isPlateReady}
                onClick={handleSearch}
                style={{ background: colors.primary, borderColor: colors.primary, color: '#fff' }}
              >
                {step === 'idle' ? 'Buscar' : 'Cambiar'}
              </Button>
            </Col>
          </Row>

          {/* Step hint */}
          {step === 'idle' && isPlateReady && !isFetching && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, display: 'block' }}>
              Presiona <strong>Enter</strong> o <strong>Buscar</strong> para confirmar
            </Text>
          )}
          {step === 'ready' && !showClientCard && (
            <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 6, display: 'block' }}>
              <CheckCircleOutlined /> Vehículo seleccionado · Presiona <strong>Enter</strong> o <strong>Generar Ticket</strong>
            </Text>
          )}

          {/* Vehicle type cards */}
          <Row gutter={[10, 10]} style={{ marginTop: 20 }}>
            {vehicles.map((vehicle) => {
              const selected = selectedVehicleId === vehicle.id && !specialRateType;
              const defaultRate = getDefaultHourRate(vehicle);
              const hourRates = selected ? vehicleHourRates : getVehicleRates(vehicle, 'hour_fraction');

              return (
                <Col key={vehicle.id} xs={12} sm={8} md={6} lg={5}>
                  <Card
                    size="small"
                    hoverable
                    onClick={(e) => selectVehicle(vehicle, e as unknown as React.MouseEvent)}
                    style={{
                      ...cardStyle,
                      border: selected ? `2px solid ${colors.primary}` : cardStyle.border,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                    styles={{ body: { padding: '10px 8px' } }}
                  >
                    <div style={{ fontSize: 26, color: colors.primary, marginBottom: 6 }}>
                      {VEHICLE_ICONS[vehicle.iconName] ?? <CarOutlined />}
                    </div>
                    <Text strong style={{ fontSize: 11, color: colors.text, display: 'block' }}>
                      {vehicle.name.toUpperCase()}
                    </Text>
                    {defaultRate && !selected && (
                      <Text style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginTop: 2 }}>
                        s/. {parseFloat(defaultRate.amount).toFixed(2)}
                      </Text>
                    )}
                    {selected && hourRates.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Select
                          size="small"
                          placeholder="Tarifa"
                          value={selectedRateId}
                          onChange={handleHourRateChange}
                          options={rateOptions(hourRates)}
                          style={{ width: '100%', marginTop: 6 }}
                          popupMatchSelectWidth={false}
                        />
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}

            {/* Amanecida */}
            <Col xs={12} sm={8} md={6} lg={5}>
              <Card
                size="small"
                hoverable
                onClick={() => selectSpecial('overnight')}
                style={{
                  ...cardStyle,
                  border: specialRateType === 'overnight' ? `2px solid ${colors.primary}` : cardStyle.border,
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: '10px 8px' } }}
              >
                <Text strong style={{ fontSize: 12, color: colors.text, display: 'block' }}>Amanecida</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Hasta 09:00 am</Text>
                {specialRateType === 'overnight' && overnightRates.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <Select
                      size="small"
                      placeholder="Tarifa"
                      value={selectedRateId}
                      onChange={(id) => setSelectedRateId(id)}
                      options={rateOptions(overnightRates)}
                      style={{ width: '100%', marginTop: 6 }}
                      popupMatchSelectWidth={false}
                    />
                  </div>
                )}
              </Card>
            </Col>

            {/* Tarifa Plana */}
            <Col xs={12} sm={8} md={6} lg={5}>
              <Card
                size="small"
                hoverable
                onClick={() => selectSpecial('flat')}
                style={{
                  ...cardStyle,
                  border: specialRateType === 'flat' ? `2px solid ${colors.primary}` : cardStyle.border,
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: '10px 8px' } }}
              >
                <Text strong style={{ fontSize: 12, color: colors.text, display: 'block' }}>Tarifa Plana</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Hasta 09:00 pm</Text>
                {specialRateType === 'flat' && flatRates.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <Select
                      size="small"
                      placeholder="Tarifa"
                      value={selectedRateId}
                      onChange={(id) => setSelectedRateId(id)}
                      options={rateOptions(flatRates)}
                      style={{ width: '100%', marginTop: 6 }}
                      popupMatchSelectWidth={false}
                    />
                  </div>
                )}
              </Card>
            </Col>

            {/* Abonados */}
            <Col xs={12} sm={8} md={6} lg={5}>
              <Card
                size="small"
                hoverable
                onClick={() => selectSpecial('subscriber')}
                style={{
                  ...cardStyle,
                  border: specialRateType === 'subscriber' ? `2px solid ${colors.primary}` : cardStyle.border,
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: '10px 8px' } }}
              >
                <Text strong style={{ fontSize: 12, color: colors.text, display: 'block' }}>Abonados</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Tarifa mensual</Text>
                {specialRateType === 'subscriber' && subscriberRates.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <Select
                      size="small"
                      placeholder="Tarifa"
                      value={selectedRateId}
                      onChange={(id) => setSelectedRateId(id)}
                      options={rateOptions(subscriberRates)}
                      style={{ width: '100%', marginTop: 6 }}
                      popupMatchSelectWidth={false}
                    />
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Generate button */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              loading={createTicket.isPending}
              disabled={!canGenerate}
              onClick={handleGenerate}
              style={{ minWidth: 200, background: colors.primary, borderColor: colors.primary }}
            >
              Generar Ticket
            </Button>
            {resolvedAmount > 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                <strong style={{ color: colors.text, fontSize: 16 }}>
                  s/. {resolvedAmount.toFixed(2)}
                </strong>
                {' '}· {RATE_TYPE_LABELS[resolvedRateType ?? 'hour_fraction']}
                {selectedRate?.label && selectedRate.label !== `s/.${resolvedAmount}` &&
                  ` · ${selectedRate.label}`}
              </Text>
            )}
          </div>
        </div>
      </Col>

      {/* ── Client / subscriber info card ─────────────────────────────────── */}
      {showClientCard && (
        <Col xs={24} lg={8}>
          <ClientInfoCard
            client={foundClient ?? null}
            subscriber={foundSubscriber ?? null}
            vehicle={selectedVehicle ?? null}
            plate={normalizedPlate}
            amount={resolvedAmount}
            rateType={resolvedRateType}
            generating={createTicket.isPending}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            onDismiss={() => setStep('idle')}
          />
        </Col>
      )}
    </Row>

    {/* ── Print modal ──────────────────────────────────────────────────────── */}
    <TicketPrintModal
      ticket={printTicket}
      open={!!printTicket}
      onClose={() => {
        setPrintTicket(null);
        setTimeout(() => plateInputRef.current?.focus?.(), 100);
      }}
    />
    </>
  );
}

// ── Client info card component ────────────────────────────────────────────────
interface ClientInfoCardProps {
  client: Client | null;
  subscriber: Subscriber | null;
  vehicle: VehicleType | null;
  plate: string;
  amount: number;
  rateType: RateType | null;
  generating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
}

function ClientInfoCard({
  client, subscriber, vehicle, plate, amount, rateType,
  generating, canGenerate, onGenerate, onDismiss,
}: ClientInfoCardProps) {
  const isSubscriber = !!subscriber;
  const name = subscriber?.fullName ?? client?.fullName ?? '—';
  const eventColor = client?.eventColor ?? 'white';

  return (
    <div
      style={{
        background: isSubscriber
          ? 'linear-gradient(135deg, #fefce8, #fef9c3)'
          : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: `2px solid ${isSubscriber ? '#ca8a04' : '#16a34a'}`,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        marginBottom: 20,
      }}
    >
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: 12, right: 12, background: 'none',
          border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4,
        }}
        aria-label="Cerrar"
      >
        <CloseOutlined />
      </button>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <Tag
          color={isSubscriber ? 'gold' : 'green'}
          style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, marginBottom: 4 }}
        >
          {isSubscriber ? '⭐ ABONADO ACTIVO' : '✓ ES CLIENTE'}
        </Tag>
        {vehicle && (
          <Text style={{ display: 'block', fontSize: 11, color: '#6b7280' }}>
            {vehicle.name}
          </Text>
        )}
      </div>

      {/* Plate */}
      <div style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
          Placa
        </Text>
        <div
          style={{
            fontFamily: 'monospace', fontWeight: 900, fontSize: 22, letterSpacing: 3,
            color: '#111', background: '#fff', borderRadius: 8,
            padding: '4px 12px', display: 'inline-block', marginTop: 2,
            border: '1px solid #d1d5db',
          }}
        >
          {plate}
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
          {isSubscriber ? 'Abonado' : 'Nombres'}
        </Text>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginTop: 2 }}>
          {name}
        </div>
      </div>

      {/* Subscriber period */}
      {isSubscriber && subscriber && (
        <div style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
            Período
          </Text>
          <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>
            {dayjs(subscriber.periodStart).format('DD/MM/YY')} – {dayjs(subscriber.periodEnd).format('DD/MM/YY')}
          </div>
        </div>
      )}

      {/* Rate */}
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
          Tarifa
        </Text>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
        }}>
          <span style={{
            fontSize: 28, fontWeight: 900, color: isSubscriber ? '#92400e' : '#065f46',
          }}>
            s/. {amount.toFixed(2)}
          </span>
          {rateType && (
            <Text style={{ fontSize: 11, color: '#6b7280' }}>
              {RATE_TYPE_LABELS[rateType]}
            </Text>
          )}
        </div>
      </div>

      {/* Event face + Generate button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>{EVENT_FACE[eventColor] ?? EVENT_FACE['white']}</div>
        <Button
          type="primary"
          size="large"
          loading={generating}
          disabled={!canGenerate}
          onClick={onGenerate}
          icon={<CheckCircleOutlined />}
          style={{
            background: isSubscriber ? '#d97706' : '#16a34a',
            borderColor: isSubscriber ? '#d97706' : '#16a34a',
            fontWeight: 700,
            minWidth: 140,
          }}
        >
          Generar Ticket
        </Button>
      </div>
    </div>
  );
}
