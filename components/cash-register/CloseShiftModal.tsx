'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Typography,
} from 'antd';
import { useCloseShift } from '@/hooks/useCashRegister';
import { CashRegister } from '@/types/api';

const { Text } = Typography;

const schema = z
  .object({
    balanceStatus: z.enum(['balanced', 'unbalanced']),
    differenceAmount: z.number().default(0),
    balanceNotes: z.string().optional(),
    extraNotes: z.string().optional(),
  })
  .refine(
    (d) => d.balanceStatus !== 'unbalanced' || !!d.balanceNotes,
    { message: 'Explica el descuadre', path: ['balanceNotes'] },
  );

type FormData = z.infer<typeof schema>;

interface CloseShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift: CashRegister | null;
}

export function CloseShiftModal({ open, onClose, shift }: CloseShiftModalProps) {
  const closeShift = useCloseShift();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { balanceStatus: 'balanced', differenceAmount: 0 },
  });

  const balanceStatus = watch('balanceStatus');

  const onSubmit = async (data: FormData) => {
    await closeShift.mutateAsync({
      balanceStatus: data.balanceStatus,
      differenceAmount: data.differenceAmount,
      balanceNotes: data.balanceNotes || null,
      extraNotes: data.extraNotes,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      title="Cerrar Turno"
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={440}
    >
      {shift && (
        <div
          style={{
            background: '#111',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#888' }}>Total en sistema:</Text>
          <Text strong style={{ color: '#db2777', fontSize: 18 }}>
            s/. {parseFloat(shift.totalAmount).toFixed(2)}
          </Text>
        </div>
      )}

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Estado del cuadre"
          validateStatus={errors.balanceStatus ? 'error' : ''}
          help={errors.balanceStatus?.message}
        >
          <Controller
            name="balanceStatus"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field}>
                <Radio value="balanced">
                  <span style={{ color: '#22c55e' }}>Cuadrado ✓</span>
                </Radio>
                <Radio value="unbalanced">
                  <span style={{ color: '#ef4444' }}>Descuadrado</span>
                </Radio>
              </Radio.Group>
            )}
          />
        </Form.Item>

        {balanceStatus === 'unbalanced' && (
          <>
            <Form.Item
              label="Diferencia (s/.)"
              help="Positivo = sobrante, negativo = faltante"
            >
              <Controller
                name="differenceAmount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    prefix="s/."
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Explicación del descuadre"
              validateStatus={errors.balanceNotes ? 'error' : ''}
              help={errors.balanceNotes?.message}
            >
              <Controller
                name="balanceNotes"
                control={control}
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

        <Form.Item label="Notas del turno (privado)">
          <Controller
            name="extraNotes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Notas generales del turno..."
              />
            )}
          />
        </Form.Item>
      </Form>

      <Alert
        type="warning"
        showIcon
        message="Esta acción no se puede deshacer."
        style={{ marginBottom: 16, fontSize: 12 }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          danger
          loading={closeShift.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          Cerrar Turno
        </Button>
      </div>
    </Modal>
  );
}
