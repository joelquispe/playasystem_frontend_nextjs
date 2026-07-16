'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal, Typography } from 'antd';
import { User } from '@/types/api';
import { useAdminResetPassword } from '@/hooks/useUsers';

const { Text } = Typography;

const schema = z
  .object({
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ newPassword: '', confirmPassword: '' });
    }
  }, [open, user?.id, reset]);

  const handleClose = () => {
    reset({ newPassword: '', confirmPassword: '' });
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    await resetPassword.mutateAsync({ id: user.id, newPassword: data.newPassword });
    handleClose();
  };

  return (
    <Modal
      title="Cambiar contraseña"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={420}
      destroyOnHidden
    >
      {user && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Usuario: <Text strong>{user.fullName}</Text> ({user.username})
        </Text>
      )}

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Nueva contraseña"
          validateStatus={errors.newPassword ? 'error' : ''}
          help={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Confirmar contraseña"
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Repite la nueva contraseña" autoComplete="new-password" />
            )}
          />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          type="primary"
          loading={resetPassword.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          Guardar contraseña
        </Button>
      </div>
    </Modal>
  );
}
