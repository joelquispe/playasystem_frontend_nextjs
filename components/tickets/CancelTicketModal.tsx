'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal, Space, Typography } from 'antd';
import { Ticket } from '@/types/api';
import { useCancelTicket } from '@/hooks/useTickets';

const { Text } = Typography;

const schema = z.object({
  cancelReason: z.string().min(5, 'Mínimo 5 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface CancelTicketModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function CancelTicketModal({ ticket, open, onClose }: CancelTicketModalProps) {
  const cancelTicket = useCancelTicket();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!ticket) return;
    await cancelTicket.mutateAsync({ id: ticket.id, data });
    reset();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <span style={{ color: '#ef4444' }}>Cancelar Ticket</span>
          <Text
            style={{ fontFamily: 'monospace', fontWeight: 700, color: '#db2777' }}
          >
            {ticket?.plate}
          </Text>
        </Space>
      }
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={420}
    >
      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Motivo de cancelación"
          validateStatus={errors.cancelReason ? 'error' : ''}
          help={errors.cancelReason?.message}
        >
          <Controller
            name="cancelReason"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                placeholder="Ej. Placa ingresada incorrectamente..."
                autoFocus
              />
            )}
          />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Volver</Button>
        <Button
          danger
          type="primary"
          loading={cancelTicket.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          Cancelar Ticket
        </Button>
      </div>
    </Modal>
  );
}
