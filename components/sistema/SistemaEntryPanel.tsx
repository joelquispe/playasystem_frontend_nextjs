'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  CarOutlined,
  TruckOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useVehicles, useSetVehicleDefaultRate } from '@/hooks/useVehicles';
import { useRates } from '@/hooks/useRates';
import { useCreateTicket } from '@/hooks/useTickets';
import { useClientByPlate } from '@/hooks/useClients';
import { useActiveSubscriberByPlate } from '@/hooks/useSubscribers';
import { Rate, RateType, VehicleType } from '@/types/api';
import { EVENT_COLOR_LABELS, RATE_TYPE_LABELS } from '@/lib/constants';
import {
  formatRateOption,
  getDefaultHourRate,
  getVehicleRates,
  pickDefaultRate,
} from '@/lib/vehicles';
import { cardStyle, colors } from '@/lib/theme';

const { Text, Title } = Typography;

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  moto: <ThunderboltOutlined />,
  auto: <CarOutlined />,
  suv: <CarOutlined />,
  pickup_large: <TruckOutlined />,
  truck: <TruckOutlined />,
  van: <TruckOutlined />,
};

interface SistemaEntryPanelProps {
  onTicketCreated?: () => void;
}

export function SistemaEntryPanel({ onTicketCreated }: SistemaEntryPanelProps) {
  const { data: vehicles = [] } = useVehicles();
  const createTicket = useCreateTicket();
  const setVehicleDefaultRate = useSetVehicleDefaultRate();

  const [plate, setPlate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | undefined>();
  const [specialRateType, setSpecialRateType] = useState<RateType | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const normalizedPlate = plate.trim().toUpperCase();
  const { data: foundClient } = useClientByPlate(normalizedPlate);
  const { data: foundSubscriber } = useActiveSubscriberByPlate(normalizedPlate);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  const isHourFractionMode = !!selectedVehicleId && !specialRateType;

  const { data: hourFractionRates = [] } = useRates(
    selectedVehicleId ?? undefined,
    'hour_fraction',
    { enabled: isHourFractionMode },
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

  useEffect(() => {
    if (foundClient?.vehicleTypeId) {
      setSelectedVehicleId(foundClient.vehicleTypeId);
      setSpecialRateType(null);
    }
    if (foundSubscriber && !foundClient?.specialRate) {
      setSpecialRateType('subscriber');
    }
    if (foundClient?.specialRate && parseFloat(foundClient.specialRate) > 0) {
      setClientModalOpen(true);
    }
  }, [foundClient, foundSubscriber]);

  useEffect(() => {
    if (specialRateType) return;

    const rates = vehicleHourRates;
    if (rates.length === 0) {
      setSelectedRateId(undefined);
      return;
    }

    const isCurrentRateValid =
      !!selectedRateId && rates.some((rate) => rate.id === selectedRateId);

    if (!isCurrentRateValid) {
      setSelectedRateId(pickDefaultRate(rates)?.id);
    }
  }, [selectedVehicleId, specialRateType, vehicleHourRates, selectedRateId]);

  useEffect(() => {
    if (!specialRateType) return;

    const pool =
      specialRateType === 'overnight'
        ? overnightRates
        : specialRateType === 'flat'
          ? flatRates
          : subscriberRates;

    if (pool.length === 0) return;

    const isCurrentRateValid =
      !!selectedRateId && pool.some((rate) => rate.id === selectedRateId);

    if (!isCurrentRateValid) {
      setSelectedRateId(pool[0]?.id);
    }
  }, [specialRateType, overnightRates, flatRates, subscriberRates, selectedRateId]);

  const selectedRate = useMemo((): Rate | undefined => {
    if (specialRateType === 'subscriber' && foundSubscriber) {
      return subscriberRates.find((rate) => rate.id === selectedRateId) ?? subscriberRates[0];
    }

    const pool =
      specialRateType === 'overnight'
        ? overnightRates
        : specialRateType === 'flat'
          ? flatRates
          : specialRateType === 'subscriber'
            ? subscriberRates
            : vehicleHourRates;

    if (selectedRateId) {
      return pool.find((rate) => rate.id === selectedRateId) ?? pool[0];
    }

    return pool[0];
  }, [
    specialRateType,
    selectedRateId,
    overnightRates,
    flatRates,
    subscriberRates,
    vehicleHourRates,
    foundSubscriber,
  ]);

  const resolvedRateType: RateType | null =
    specialRateType ?? (selectedRate ? 'hour_fraction' : null);

  const resolvedAmount = useMemo(() => {
    if (specialRateType === 'subscriber' && foundSubscriber) {
      return parseFloat(foundSubscriber.monthlyAmount);
    }
    if (foundClient?.specialRate && parseFloat(foundClient.specialRate) > 0 && !specialRateType) {
      return parseFloat(foundClient.specialRate);
    }
    if (selectedRate) return parseFloat(selectedRate.amount);
    return 0;
  }, [specialRateType, foundSubscriber, foundClient, selectedRate]);

  const persistDefaultRate = (vehicleTypeId: string, rateId: string) => {
    setVehicleDefaultRate.mutate({ vehicleTypeId, rateId });
  };

  const selectVehicle = (vehicle: VehicleType) => {
    setSelectedVehicleId(vehicle.id);
    setSpecialRateType(null);

    const defaultRate = getDefaultHourRate(vehicle);
    const rateId = defaultRate?.id;
    setSelectedRateId(rateId);

    if (rateId) {
      persistDefaultRate(vehicle.id, rateId);
    }
  };

  const selectSpecial = (type: RateType) => {
    if (!selectedVehicleId && vehicles.length > 0) {
      const firstVehicle = vehicles[0];
      setSelectedVehicleId(firstVehicle.id);
    }

    setSpecialRateType(type);

    const pool =
      type === 'overnight'
        ? overnightRates
        : type === 'flat'
          ? flatRates
          : subscriberRates;

    setSelectedRateId(pool[0]?.id);
  };

  const handleHourRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
    if (selectedVehicleId) {
      persistDefaultRate(selectedVehicleId, rateId);
    }
  };

  const handleSpecialRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
  };

  const handleGenerate = async () => {
    if (!normalizedPlate || !selectedVehicleId || !resolvedRateType || resolvedAmount <= 0) return;

    await createTicket.mutateAsync({
      plate: normalizedPlate,
      vehicleTypeId: selectedVehicleId,
      rateType: resolvedRateType,
      rateAmount: resolvedAmount,
      hasKey: false,
    });

    setPlate('');
    setSelectedVehicleId(null);
    setSelectedRateId(undefined);
    setSpecialRateType(null);
    onTicketCreated?.();
  };

  const rateOptions = (rates: Rate[]) => rates.map(formatRateOption);

  return (
    <>
      <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: colors.text }}>
              PLACA:
            </Text>
            <Input
              size="large"
              placeholder="Ingrese placa"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              style={{ fontFamily: 'monospace', letterSpacing: 1 }}
            />
            {foundClient && (
              <Text style={{ display: 'block', marginTop: 6, fontSize: 12, color: colors.primary }}>
                Cliente: {foundClient.fullName}
              </Text>
            )}
            {foundSubscriber && (
              <Text style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#d39a3f' }}>
                Abonado activo
              </Text>
            )}
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
          {vehicles.map((vehicle) => {
            const selected = selectedVehicleId === vehicle.id && !specialRateType;
            const defaultRate = getDefaultHourRate(vehicle);
            const hourRates = selected ? vehicleHourRates : getVehicleRates(vehicle, 'hour_fraction');

            return (
              <Col key={vehicle.id} xs={12} sm={8} md={6} lg={4}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => selectVehicle(vehicle)}
                  style={{
                    ...cardStyle,
                    border: selected ? `2px solid ${colors.primary}` : cardStyle.border,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div style={{ fontSize: 28, color: colors.primary, marginBottom: 8 }}>
                    {VEHICLE_ICONS[vehicle.iconName] ?? <CarOutlined />}
                  </div>
                  <Text strong style={{ fontSize: 12, color: colors.text }}>
                    {vehicle.name.toUpperCase()}
                  </Text>
                  {defaultRate && !selected && (
                    <Text style={{ display: 'block', marginTop: 4, fontSize: 11, color: colors.textMuted }}>
                      {defaultRate.label} — s/. {parseFloat(defaultRate.amount).toFixed(2)}
                    </Text>
                  )}
                  {selected && hourRates.length > 0 && (
                    <Select
                      size="small"
                      placeholder="Tarifa"
                      value={selectedRateId}
                      onChange={handleHourRateChange}
                      options={rateOptions(hourRates)}
                      style={{ width: '100%', marginTop: 8 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </Card>
              </Col>
            );
          })}

          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              size="small"
              hoverable
              onClick={() => selectSpecial('overnight')}
              style={{
                ...cardStyle,
                border: specialRateType === 'overnight' ? `2px solid ${colors.primary}` : cardStyle.border,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 12 } }}
            >
              <Title level={5} style={{ margin: 0, color: colors.text }}>
                Amanecida
              </Title>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Hasta 09:00 am del día siguiente
              </Text>
              {specialRateType === 'overnight' && overnightRates.length > 0 && (
                <Select
                  size="small"
                  placeholder="Seleccionar"
                  value={selectedRateId}
                  onChange={handleSpecialRateChange}
                  options={rateOptions(overnightRates)}
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Card>
          </Col>

          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              size="small"
              hoverable
              onClick={() => selectSpecial('flat')}
              style={{
                ...cardStyle,
                border: specialRateType === 'flat' ? `2px solid ${colors.primary}` : cardStyle.border,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 12 } }}
            >
              <Title level={5} style={{ margin: 0, color: colors.text }}>
                Tarifa Plana
              </Title>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Hasta 9:00 pm del mismo día
              </Text>
              {specialRateType === 'flat' && flatRates.length > 0 && (
                <Select
                  size="small"
                  placeholder="Seleccionar"
                  value={selectedRateId}
                  onChange={handleSpecialRateChange}
                  options={rateOptions(flatRates)}
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Card>
          </Col>

          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              size="small"
              hoverable
              onClick={() => selectSpecial('subscriber')}
              style={{
                ...cardStyle,
                border: specialRateType === 'subscriber' ? `2px solid ${colors.primary}` : cardStyle.border,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 12 } }}
            >
              <Title level={5} style={{ margin: 0, color: colors.text }}>
                Abonados
              </Title>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Tarifa mensual de abonado
              </Text>
              {specialRateType === 'subscriber' && subscriberRates.length > 0 && (
                <Select
                  size="small"
                  placeholder="Seleccionar"
                  value={selectedRateId}
                  onChange={handleSpecialRateChange}
                  options={rateOptions(subscriberRates)}
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            loading={createTicket.isPending}
            disabled={!normalizedPlate || !selectedVehicleId || !resolvedRateType || resolvedAmount <= 0}
            onClick={handleGenerate}
            style={{ minWidth: 220, background: colors.primary, borderColor: colors.primary }}
          >
            Generar Ticket
          </Button>
          {resolvedAmount > 0 && (
            <Text style={{ display: 'block', marginTop: 8, color: colors.textMuted }}>
              Monto: s/. {resolvedAmount.toFixed(2)} · {RATE_TYPE_LABELS[resolvedRateType ?? 'hour_fraction']}
              {selectedRate?.label ? ` · ${selectedRate.label}` : ''}
            </Text>
          )}
        </div>
      </div>

      <Modal
        title="¡Es cliente!"
        open={clientModalOpen}
        onOk={() => setClientModalOpen(false)}
        onCancel={() => setClientModalOpen(false)}
        okText="Continuar"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        {foundClient && (
          <Space direction="vertical">
            <Text>
              <strong>{foundClient.fullName}</strong> — placa {foundClient.plate}
            </Text>
            {parseFloat(foundClient.specialRate) > 0 && (
              <Text>Tarifa especial: s/. {parseFloat(foundClient.specialRate).toFixed(2)}</Text>
            )}
            <Text type="secondary">
              Evento: {EVENT_COLOR_LABELS[foundClient.eventColor] ?? foundClient.eventColor}
            </Text>
          </Space>
        )}
      </Modal>
    </>
  );
}
