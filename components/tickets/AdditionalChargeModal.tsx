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
import { Ticket } from '@/types/api';
import { useAdditionalCharge } from '@/hooks/useTickets';

const { Text } = Typography;

const schema = z.object({
  chargeType: z.enum(['overnight', 'hour_fraction']),
  amount: z.number({ message: 'Requerido' }).positive('Debe ser mayor a 0'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AdditionalChargeModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function AdditionalChargeModal({ ticket, open, onClose }: AdditionalChargeModalProps) {
  const addCharge = useAdditionalCharge();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { chargeType: 'overnight', amount: 0 },
  });

  const onSubmit = async (data: FormData) => {
    if (!ticket) return;
    await addCharge.mutateAsync({ id: ticket.id, data });
    reset();
    onClose();
  };

  return (
    <Modal
      title={
        <Text>
          Cargo Adicional —{' '}
          <Text style={{ fontFamily: 'monospace', color: '#db2777' }}>
            {ticket?.plate}
          </Text>
        </Text>
      }
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={400}
    >
      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Tipo de cargo"
          validateStatus={errors.chargeType ? 'error' : ''}
          help={errors.chargeType?.message}
        >
          <Controller
            name="chargeType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'overnight', label: 'Amanecida' },
                  { value: 'hour_fraction', label: 'Hora o Fracción extra' },
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Monto (s/.)"
          validateStatus={errors.amount ? 'error' : ''}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
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

        <Form.Item label="Notas (opcional)">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Ej. Amanecida aplicada a las 22:05" />
            )}
          />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={addCharge.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
        >
          Agregar Cargo
        </Button>
      </div>
    </Modal>
  );
}
