'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useVehicles } from '@/hooks/useVehicles';
import { useRates } from '@/hooks/useRates';
import { useCreateTicket } from '@/hooks/useTickets';
import { clientsService } from '@/services/clients.service';
import { subscribersService } from '@/services/subscribers.service';
import { Client, Subscriber } from '@/types/api';
import { EVENT_COLOR_LABELS } from '@/lib/constants';

const { Text } = Typography;

const schema = z.object({
  plate: z.string().min(1, 'Requerido').max(20).toUpperCase(),
  vehicleTypeId: z.string().min(1, 'Selecciona tipo de vehículo'),
  rateType: z.string().min(1, 'Selecciona tipo de tarifa'),
  rateAmount: z.number({ message: 'Requerido' }).positive('Debe ser mayor a 0'),
  hasKey: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface NewTicketDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NewTicketDrawer({ open, onClose }: NewTicketDrawerProps) {
  const { data: vehicles = [] } = useVehicles();
  const createTicket = useCreateTicket();
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [foundSubscriber, setFoundSubscriber] = useState<Subscriber | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { hasKey: false, rateAmount: 0 },
  });

  const vehicleTypeId = watch('vehicleTypeId');
  const { data: rates = [] } = useRates(vehicleTypeId);

  // Auto-fill client info when plate changes
  const plate = useWatch({ control, name: 'plate' });
  useEffect(() => {
    if (!plate || plate.length < 3) {
      setFoundClient(null);
      setFoundSubscriber(null);
      return;
    }
    const normalized = plate.toUpperCase();
    const timer = setTimeout(async () => {
      const [client, subscriber] = await Promise.all([
        clientsService.getClientByPlate(normalized),
        subscribersService.getActiveByPlate(normalized),
      ]);
      setFoundClient(client);
      setFoundSubscriber(subscriber);
      if (client) {
        if (client.vehicleTypeId) setValue('vehicleTypeId', client.vehicleTypeId);
        if (client.specialRate && parseFloat(client.specialRate) > 0) {
          setValue('rateType', 'hour_fraction');
          setValue('rateAmount', parseFloat(client.specialRate));
          setClientModalOpen(true);
        }
      }
      if (subscriber && !client?.specialRate) {
        setValue('rateType', 'subscriber');
        setValue('rateAmount', parseFloat(subscriber.monthlyAmount));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [plate, setValue]);

  const onSubmit = async (data: FormData) => {
    await createTicket.mutateAsync({
      plate: data.plate.toUpperCase(),
      vehicleTypeId: data.vehicleTypeId,
      rateType: data.rateType as never,
      rateAmount: data.rateAmount,
      hasKey: data.hasKey ?? false,
    });
    reset();
    setFoundClient(null);
    setFoundSubscriber(null);
    onClose();
  };

  const rateOptions = rates.map((r) => ({
    value: r.rateType,
    label: `${r.label ?? r.rateType} — s/. ${r.amount}`,
    amount: parseFloat(r.amount),
  }));

  return (
    <Drawer
      title="Nuevo Ticket de Entrada"
      open={open}
      onClose={() => { reset(); onClose(); }}
      width={400}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button
            type="primary"
            loading={isSubmitting || createTicket.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Registrar Entrada
          </Button>
        </Space>
      }
    >
      {foundSubscriber && (
        <Alert
          type="info"
          showIcon
          message={`Abonado activo: ${foundSubscriber.fullName}`}
          description={`Vigente hasta ${foundSubscriber.periodEnd} · s/. ${parseFloat(foundSubscriber.monthlyAmount).toFixed(2)}/mes`}
          style={{ marginBottom: 16 }}
        />
      )}

      {foundClient && !foundSubscriber && (
        <Alert
          type={foundClient.eventColor === 'red' ? 'error' : foundClient.eventColor === 'green' ? 'success' : 'info'}
          showIcon
          message={`Cliente registrado: ${foundClient.fullName}`}
          description={
            parseFloat(foundClient.specialRate) > 0
              ? `Tarifa especial: s/. ${parseFloat(foundClient.specialRate).toFixed(2)}`
              : EVENT_COLOR_LABELS[foundClient.eventColor]
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Placa"
          validateStatus={errors.plate ? 'error' : ''}
          help={errors.plate?.message}
        >
          <Controller
            name="plate"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                size="large"
                style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tipo de Vehículo"
          validateStatus={errors.vehicleTypeId ? 'error' : ''}
          help={errors.vehicleTypeId?.message}
        >
          <Controller
            name="vehicleTypeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Seleccionar..."
                options={vehicles.map((v) => ({ value: v.id, label: v.name }))}
                onChange={(val) => {
                  field.onChange(val);
                  setValue('rateType', '');
                  setValue('rateAmount', 0);
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tipo de Tarifa"
          validateStatus={errors.rateType ? 'error' : ''}
          help={errors.rateType?.message}
        >
          <Controller
            name="rateType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Seleccionar..."
                disabled={!vehicleTypeId}
                options={rateOptions}
                onChange={(val) => {
                  field.onChange(val);
                  const selected = rateOptions.find((r) => r.value === val);
                  if (selected) setValue('rateAmount', selected.amount);
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Monto de tarifa (s/.)"
          validateStatus={errors.rateAmount ? 'error' : ''}
          help={errors.rateAmount?.message}
        >
          <Controller
            name="rateAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.5}
                style={{ width: '100%' }}
                prefix="s/."
              />
            )}
          />
        </Form.Item>

        <Form.Item label="¿Deja llave?">
          <Controller
            name="hasKey"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                checkedChildren="Sí"
                unCheckedChildren="No"
              />
            )}
          />
        </Form.Item>
      </Form>

      <Modal
        title="¡Es cliente!"
        open={clientModalOpen}
        onOk={() => setClientModalOpen(false)}
        onCancel={() => setClientModalOpen(false)}
        okText="Continuar"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Text>
          La placa <strong>{foundClient?.plate}</strong> pertenece a{' '}
          <strong>{foundClient?.fullName}</strong> con tarifa especial de{' '}
          <strong>s/. {foundClient ? parseFloat(foundClient.specialRate).toFixed(2) : '0'}</strong>.
        </Text>
      </Modal>
    </Drawer>
  );
}
