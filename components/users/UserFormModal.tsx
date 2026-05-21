'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal, Select, Switch, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { User } from '@/types/api';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';

const createSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  fullName: z.string().min(1, 'Requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'cashier']).default('cashier'),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Requerido'),
  role: z.enum(['admin', 'cashier']),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface UserFormModalProps {
  open: boolean;
  editing: User | null;
  onClose: () => void;
}

export function UserFormModal({ open, editing, onClose }: UserFormModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: { role: 'cashier', isActive: true },
  });

  useEffect(() => {
    if (editing) {
      reset({
        fullName: editing.fullName,
        role: editing.role,
        scheduleStart: editing.scheduleStart,
        scheduleEnd: editing.scheduleEnd,
        isActive: editing.isActive,
      });
    } else {
      reset({ role: 'cashier', isActive: true });
    }
  }, [editing, reset]);

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    if (editing) {
      await updateUser.mutateAsync({ id: editing.id, data: data as EditFormData });
    } else {
      await createUser.mutateAsync(data as CreateFormData);
    }
    reset();
    onClose();
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Modal
      title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={460}
    >
      <Form layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        {!editing && (
          <Form.Item
            label="Nombre de usuario"
            validateStatus={(errors as { username?: { message?: string } }).username ? 'error' : ''}
            help={(errors as { username?: { message?: string } }).username?.message}
          >
            <Controller
              name={'username' as keyof CreateFormData}
              control={control as never}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(e) => (field as { onChange: (v: string) => void }).onChange(e.target.value.toUpperCase())}
                  placeholder="CAJERO1"
                  style={{ fontFamily: 'monospace' }}
                />
              )}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Nombre completo"
          validateStatus={errors.fullName ? 'error' : ''}
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control as never}
            render={({ field }) => <Input {...field} placeholder="Juan Pérez" />}
          />
        </Form.Item>

        {!editing && (
          <Form.Item
            label="Contraseña"
            validateStatus={(errors as { password?: { message?: string } }).password ? 'error' : ''}
            help={(errors as { password?: { message?: string } }).password?.message}
          >
            <Controller
              name={'password' as keyof CreateFormData}
              control={control as never}
              render={({ field }) => (
                <Input.Password {...field} placeholder="Mínimo 6 caracteres" />
              )}
            />
          </Form.Item>
        )}

        <Form.Item label="Rol">
          <Controller
            name="role"
            control={control as never}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'cashier', label: 'Cajero' },
                  { value: 'admin', label: 'Administrador' },
                ]}
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Inicio de turno">
            <Controller
              name="scheduleStart"
              control={control as never}
              render={({ field }) => (
                <Input {...field} placeholder="07:30" maxLength={5} />
              )}
            />
          </Form.Item>
          <Form.Item label="Fin de turno">
            <Controller
              name="scheduleEnd"
              control={control as never}
              render={({ field }) => (
                <Input {...field} placeholder="22:00" maxLength={5} />
              )}
            />
          </Form.Item>
        </div>

        {editing && (
          <Form.Item label="Estado">
            <Controller
              name={'isActive' as keyof EditFormData}
              control={control as never}
              render={({ field }) => (
                <Switch
                  checked={field.value as boolean}
                  onChange={field.onChange}
                  checkedChildren="Activo"
                  unCheckedChildren="Inactivo"
                />
              )}
            />
          </Form.Item>
        )}
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={isLoading}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          {editing ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </div>
    </Modal>
  );
}
