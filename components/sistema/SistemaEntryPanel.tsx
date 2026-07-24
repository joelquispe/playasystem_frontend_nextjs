'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import {
  Button,
  Col,
  Input,
  message,
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
import { Client, Rate, RateType, Subscriber, VehicleType } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import {
  formatRateOption,
  getDefaultHourRate,
  getVehicleRates,
  pickDefaultRate,
} from '@/lib/vehicles';
import { hasSpecialRate, isFrequentClient, getSpecialRateAmount, shouldShowClientCard } from '@/lib/client';
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
  /** User dismissed the auto client/subscriber card for the current plate */
  const [cardDismissed, setCardDismissed] = useState(false);
  const plateInputRef = useRef<InputRef>(null);

  const normalizedPlate = plate.trim().toUpperCase();
  const isPlateReady = normalizedPlate.length >= 3;
  /** Auto-detect client / subscriber (and show side card) from this length */
  const isLookupReady = normalizedPlate.length >= 6;

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

  /** Positive amount when client has specialRate > 0 */
  const clientSpecialAmount = useMemo((): number | null => {
    if (specialRateType) return null; // special types override client rate
    return getSpecialRateAmount(foundClient);
  }, [foundClient, specialRateType]);

  const resolvedAmount = useMemo(() => {
    if (specialRateType === 'subscriber' && foundSubscriber) {
      return parseFloat(foundSubscriber.monthlyAmount);
    }
    // Client-level special rate takes priority over vehicle default
    if (clientSpecialAmount !== null) return clientSpecialAmount;
    if (selectedRate) return parseFloat(selectedRate.amount);
    return 0;
  }, [specialRateType, foundSubscriber, selectedRate, clientSpecialAmount]);

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
    setCardDismissed(false);
  }, [isPlateReady, isFetching, getAutoSelection]);

  /**
   * Auto-detect: when plate has ≥ 6 chars and a client/subscriber is found,
   * apply selection and show the side card without requiring Enter.
   */
  useEffect(() => {
    if (!isLookupReady || isFetching) return;
    if (!foundClient && !foundSubscriber) return;

    const { vehicleId, rateId, specialType } = getAutoSelection();
    setSelectedVehicleId(vehicleId);
    setSpecialRateType(specialType);
    setSelectedRateId(rateId);
    setStep('ready');
  }, [
    isLookupReady,
    isFetching,
    foundClient,
    foundSubscriber,
    getAutoSelection,
  ]);

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

    message.success(`Ticket generado — ${created.plate} (${created.ticketCode})`);

    // Reset panel
    setPlate('');
    setStep('idle');
    setSelectedVehicleId(null);
    setSelectedRateId(undefined);
    setSpecialRateType(null);
    setCardDismissed(false);
    onTicketCreated?.();
    setTimeout(() => plateInputRef.current?.focus?.(), 100);
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

  // ── Plate change ──────────────────────────────────────────────────────────
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.toUpperCase();
    setPlate(next);
    setCardDismissed(false);

    const nextNorm = next.trim().toUpperCase();
    // Below lookup length: clear selection / card. At ≥ 6, auto-detect effect takes over.
    if (nextNorm.length < 6) {
      setStep('idle');
      setSelectedVehicleId(null);
      setSelectedRateId(undefined);
      setSpecialRateType(null);
    }
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

  // ── Client / subscriber card ───────────────────────────────────────────────
  // - specialRate > 0 → purple "Tarifa especial"
  // - eventColor green → green "Es frecuente"
  // - both → purple tarifa especial (priority)
  // - Active subscribers always get the "Abonado" card
  const showClientCard =
    isLookupReady &&
    !cardDismissed &&
    !isFetching &&
    (!!foundSubscriber || shouldShowClientCard(foundClient));

  const isClientSpecialRate = hasSpecialRate(foundClient);
  const isClientFrequent = isFrequentClient(foundClient);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <Row gutter={[16, 16]}>
      {/* ── Main entry panel ─────────────────────────────────────────────── */}
      <Col xs={24} lg={showClientCard ? 16 : 24}>
        <div style={{ padding: '16px 0', marginBottom: 8 }}>
          {/* Plate input */}
          <Row gutter={[12, 0]} align="middle">
            <Col flex="none">
              <Text strong style={{ color: colors.text, fontSize: 16 }}>PLACA:</Text>
            </Col>
            <Col flex="auto">
              <Input
                ref={plateInputRef}
                size="large"
                variant="borderless"
                placeholder="Ingrese placa"
                value={plate}
                onChange={handlePlateChange}
                onKeyDown={handleKeyDown}
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: 3,
                  fontWeight: 800,
                  fontSize: 22,
                  background: 'transparent',
                  borderBottom: `2px solid ${isPlateReady ? colors.primary : colors.cardBorder}`,
                  borderRadius: 0,
                  paddingLeft: 4,
                  transition: 'border-color 0.2s',
                }}
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
          {step === 'idle' && isPlateReady && !isLookupReady && !isFetching && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, display: 'block' }}>
              Continúa escribiendo la placa (mín. 6) o presiona <strong>Enter</strong> / <strong>Buscar</strong>
            </Text>
          )}
          {step === 'idle' && isLookupReady && !isFetching && !foundClient && !foundSubscriber && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, display: 'block' }}>
              Presiona <strong>Enter</strong> o <strong>Buscar</strong> para confirmar
            </Text>
          )}
          {isLookupReady && isFetching && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, display: 'block' }}>
              Buscando cliente / abonado…
            </Text>
          )}
          {step === 'ready' && !showClientCard && (
            <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 6, display: 'block' }}>
              <CheckCircleOutlined /> Vehículo seleccionado · Presiona <strong>Enter</strong> o <strong>Generar Ticket</strong>
            </Text>
          )}
          {showClientCard && (
            <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 6, display: 'block' }}>
              <CheckCircleOutlined /> Cliente detectado · Presiona <strong>Enter</strong> o <strong>Generar Ticket</strong>
            </Text>
          )}

          {/* ── Vehicle types + Special rates ────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── Left: Vehicle type cards (square, easy to tap) ───────────── */}
            <div style={{ flex: '1 1 0', minWidth: 280 }}>
              <Text style={{
                fontSize: 9, color: colors.textSubtle, textTransform: 'uppercase',
                letterSpacing: 1.5, display: 'block', marginBottom: 10, fontWeight: 600,
              }}>
                Tipo de vehículo
              </Text>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 14,
                }}
              >
                {vehicles.map((vehicle) => {
                  const selected = selectedVehicleId === vehicle.id && !specialRateType;
                  const defaultRate = getDefaultHourRate(vehicle);
                  const hourRates = selected ? vehicleHourRates : getVehicleRates(vehicle, 'hour_fraction');

                  return (
                    <div key={vehicle.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => selectVehicle(vehicle, e as unknown as React.MouseEvent)}
                        style={{
                          aspectRatio: '1 / 1',
                          width: '100%',
                          minHeight: 140,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          padding: 16,
                          background: selected ? '#e6f4f4' : 'transparent',
                          border: selected
                            ? `2px solid ${colors.primary}`
                            : `1.5px solid ${colors.cardBorder}`,
                          borderRadius: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          outline: 'none',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 42,
                            color: selected ? colors.primary : colors.textMuted,
                            lineHeight: 1,
                          }}
                        >
                          {VEHICLE_ICONS[vehicle.iconName] ?? <CarOutlined />}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: selected ? colors.primary : colors.text,
                            lineHeight: 1.25,
                            textAlign: 'center',
                            maxWidth: '100%',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {vehicle.name}
                        </span>
                        {defaultRate && !selected && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, lineHeight: 1 }}>
                            s/. {parseFloat(defaultRate.amount).toFixed(2)}
                          </span>
                        )}
                      </button>

                      {selected && hourRates.length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Select
                            size="middle"
                            placeholder="Tarifa"
                            value={selectedRateId}
                            onChange={handleHourRateChange}
                            options={rateOptions(hourRates)}
                            style={{ width: '100%' }}
                            popupMatchSelectWidth={false}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ───────────────────────────────────────────────────── */}
            <div style={{
              width: 1,
              alignSelf: 'stretch',
              background: colors.divider,
              flexShrink: 0,
              marginTop: 24,
            }} />

            {/* ── Right: Special rates (stacked) ───────────────────────────── */}
            <div style={{ flex: '1 1 220px', maxWidth: 340 }}>
              <Text style={{
                fontSize: 9, color: colors.textSubtle, textTransform: 'uppercase',
                letterSpacing: 1.5, display: 'block', marginBottom: 10, fontWeight: 600,
              }}>
                Tarifas especiales
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {[
                  {
                    type: 'overnight' as const,
                    label: 'Amanecida',
                    sub: 'Hasta 09:00 am',
                    rates: overnightRates,
                  },
                  {
                    type: 'flat' as const,
                    label: 'Tarifa Plana',
                    sub: 'Hasta 09:00 pm',
                    rates: flatRates,
                  },
                  {
                    type: 'subscriber' as const,
                    label: 'Abonados',
                    sub: 'Tarifa mensual',
                    rates: subscriberRates,
                  },
                ].map(({ type, label, sub, rates }) => {
                  const active = specialRateType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => selectSpecial(type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: active ? '#e6f4f4' : 'transparent',
                        border: active
                          ? `2px solid ${colors.primary}`
                          : `1.5px solid ${colors.cardBorder}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'left',
                        width: '100%',
                        outline: 'none',
                      }}
                    >
                      <span>
                        <span style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 700,
                          color: active ? colors.primary : colors.text,
                        }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 11, color: colors.textMuted }}>
                          {sub}
                        </span>
                      </span>
                      {active && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: colors.primary, flexShrink: 0,
                        }} />
                      )}
                    </button>
                  );
                })}

                {/* Inline rate selector for active special type */}
                {specialRateType && (() => {
                  const pool =
                    specialRateType === 'overnight' ? overnightRates
                    : specialRateType === 'flat' ? flatRates
                    : subscriberRates;
                  if (pool.length === 0) return null;
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Select
                        size="small"
                        placeholder="Tarifa"
                        value={selectedRateId}
                        onChange={(id) => setSelectedRateId(id)}
                        options={rateOptions(pool)}
                        style={{ width: '100%' }}
                        popupMatchSelectWidth={false}
                      />
                    </div>
                  );
                })()}

              </div>
            </div>

          </div>

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
            isSpecialRate={isClientSpecialRate}
            isFrequent={isClientFrequent}
            generating={createTicket.isPending}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            onDismiss={() => setCardDismissed(true)}
          />
        </Col>
      )}
    </Row>
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
  /** specialRate > 0 → purple "Tarifa especial" */
  isSpecialRate: boolean;
  /** eventColor green → green "Es frecuente" (unless special rate takes priority) */
  isFrequent: boolean;
  generating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
}

function ClientInfoCard({
  client, subscriber, vehicle, plate, amount, rateType, isSpecialRate, isFrequent,
  generating, canGenerate, onGenerate, onDismiss,
}: ClientInfoCardProps) {
  const isSubscriber = !!subscriber;
  const name = subscriber?.fullName ?? client?.fullName ?? '—';
  const eventColor = client?.eventColor ?? 'white';
  // Purple wins when special rate; otherwise green for frecuente
  const usePurple = !isSubscriber && isSpecialRate;
  const useGreen = !isSubscriber && !isSpecialRate && isFrequent;

  const headerTag = isSubscriber
    ? { color: 'gold' as const, label: '⭐ ABONADO ACTIVO' }
    : usePurple
      ? { color: 'purple' as const, label: '★ TARIFA ESPECIAL' }
      : { color: 'green' as const, label: '✓ ES FRECUENTE' };

  const accent = isSubscriber ? '#d97706' : usePurple ? '#6d28d9' : '#16a34a';
  const border = isSubscriber ? '#ca8a04' : usePurple ? '#6d28d9' : '#16a34a';
  const background = isSubscriber
    ? 'linear-gradient(135deg, #fefce8, #fef9c3)'
    : usePurple
      ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)'
      : 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
  const amountColor = isSubscriber ? '#92400e' : usePurple ? '#6d28d9' : '#065f46';

  return (
    <div
      style={{
        background,
        border: `2px solid ${border}`,
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
          color={headerTag.color}
          style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, marginBottom: 4 }}
        >
          {headerTag.label}
        </Tag>
        {usePurple && isFrequent && (
          <Tag color="green" style={{ fontWeight: 600, fontSize: 11, marginBottom: 4 }}>
            Frecuente
          </Tag>
        )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Text style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
            Tarifa
          </Text>
          {usePurple && (
            <Tag
              color="purple"
              style={{ fontSize: 10, padding: '0 6px', lineHeight: '18px', fontWeight: 700 }}
            >
              Tarifa Especial
            </Tag>
          )}
          {useGreen && (
            <Tag
              color="green"
              style={{ fontSize: 10, padding: '0 6px', lineHeight: '18px', fontWeight: 700 }}
            >
              Es frecuente
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 28,
            fontWeight: 900,
            color: amountColor,
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
            background: accent,
            borderColor: accent,
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
