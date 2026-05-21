'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
} from 'antd';
import { useVehicles } from '@/hooks/useVehicles';
import { useRates } from '@/hooks/useRates';
import { useManualTicket } from '@/hooks/useTickets';
import { PAYMENT_METHOD_LABELS, RATE_TYPE_LABELS } from '@/lib/constants';

const { Text } = Typography;

const schema = z.object({
  plate: z.string().min(1, 'Requerido').max(20),
  vehicleTypeId: z.string().min(1, 'Requerido'),
  rateType: z.string().min(1, 'Requerido'),
  rateAmount: z.number({ message: 'Requerido' }).positive(),
  hours: z.number({ message: 'Requerido' }).positive('Mínimo 1 hora'),
  paymentMethod: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

interface ManualTicketModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManualTicketModal({ open, onClose }: ManualTicketModalProps) {
  const { data: vehicles = [] } = useVehicles();
  const createManual = useManualTicket();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rateAmount: 0, hours: 1 },
  });

  const vehicleTypeId = watch('vehicleTypeId');
  const rateAmount = watch('rateAmount');
  const hours = watch('hours');
  const { data: rates = [] } = useRates(vehicleTypeId);

  const total = (rateAmount ?? 0) * (hours ?? 0);

  const onSubmit = async (data: FormData) => {
    await createManual.mutateAsync({
      plate: data.plate.toUpperCase(),
      vehicleTypeId: data.vehicleTypeId,
      rateType: data.rateType as never,
      rateAmount: data.rateAmount,
      hours: data.hours,
      paymentMethod: data.paymentMethod as never,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      title={<Text>Ticket Manual — <Text style={{ color: '#f59e0b' }}>Ticket Perdido</Text></Text>}
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={460}
    >
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
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
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
                options={vehicles.map((v) => ({ value: v.id, label: v.name }))}
                onChange={(val) => { field.onChange(val); setValue('rateType', ''); }}
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
                disabled={!vehicleTypeId}
                options={rates.map((r) => ({
                  value: r.rateType,
                  label: `${RATE_TYPE_LABELS[r.rateType]} — s/. ${r.amount}`,
                }))}
                onChange={(val) => {
                  field.onChange(val);
                  const rate = rates.find((r) => r.rateType === val);
                  if (rate) setValue('rateAmount', parseFloat(rate.amount));
                }}
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            label="Tarifa (s/.)"
            validateStatus={errors.rateAmount ? 'error' : ''}
            help={errors.rateAmount?.message}
          >
            <Controller
              name="rateAmount"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} step={0.5} style={{ width: '100%' }} prefix="s/." />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Horas estimadas"
            validateStatus={errors.hours ? 'error' : ''}
            help={errors.hours?.message}
          >
            <Controller
              name="hours"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={1} max={24} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Método de Pago"
          validateStatus={errors.paymentMethod ? 'error' : ''}
          help={errors.paymentMethod?.message}
        >
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            )}
          />
        </Form.Item>
      </Form>

      {total > 0 && (
        <div
          style={{
            background: '#1f1207',
            border: '1px solid #784c00',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#f59e0b' }}>Total a cobrar:</Text>
          <Text strong style={{ color: '#f59e0b', fontSize: 16 }}>
            s/. {total.toFixed(2)}
          </Text>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={createManual.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
        >
          Registrar Ticket Manual
        </Button>
      </div>
    </Modal>
  );
}
