'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal } from 'antd';
import { User } from '@/types/api';
import { useAdminResetPassword } from '@/hooks/useUsers';

const schema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface ResetPasswordModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ user, open, onClose }: ResetPasswordModalProps) {
  const resetPassword = useAdminResetPassword();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    await resetPassword.mutateAsync({ id: user.id, newPassword: data.newPassword });
    reset();
    onClose();
  };

  return (
    <Modal
      title={`Restablecer contraseña — ${user?.username}`}
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={400}
    >
      <Form layout="vertical">
        <Form.Item
          label="Nueva contraseña"
          validateStatus={errors.newPassword ? 'error' : ''}
          help={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Mínimo 6 caracteres" />
            )}
          />
        </Form.Item>
      </Form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={resetPassword.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          Guardar
        </Button>
      </div>
    </Modal>
  );
}
