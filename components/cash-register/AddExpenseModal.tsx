'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, InputNumber, Modal } from 'antd';
import { useAddExpense } from '@/hooks/useCashRegister';

const schema = z.object({
  extraExpenses: z.number().min(0).optional(),
  extraNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const addExpense = useAddExpense();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { extraExpenses: 0 },
  });

  const onSubmit = async (data: FormData) => {
    await addExpense.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <Modal
      title="Registrar Gasto / Nota"
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={400}
    >
      <Form layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          label="Monto del gasto (s/.)"
          validateStatus={errors.extraExpenses ? 'error' : ''}
          help={errors.extraExpenses?.message}
        >
          <Controller
            name="extraExpenses"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.5}
                style={{ width: '100%' }}
                prefix="s/."
                placeholder="0.00"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Descripción / Nota privada">
          <Controller
            name="extraNotes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                placeholder="Ej. Compra de materiales de limpieza..."
              />
            )}
          />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={addExpense.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          Registrar
        </Button>
      </div>
    </Modal>
  );
}
