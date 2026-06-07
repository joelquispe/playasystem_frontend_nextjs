'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal, Switch } from 'antd';
import { RoleEntity } from '@/types/api';
import { useCreateRole, useUpdateRole } from '@/hooks/useRoles';

const slugRegex = /^[a-z][a-z0-9_]*$/;

const createSchema = z.object({
  name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  slug: z
    .string()
    .min(1, 'Requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(slugRegex, 'Solo minúsculas, números y guiones bajos (ej. supervisor)'),
  description: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

const editSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface RoleFormModalProps {
  open: boolean;
  editing: RoleEntity | null;
  onClose: () => void;
}

export function RoleFormModal({ open, editing, onClose }: RoleFormModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? '',
        isActive: editing.isActive,
      });
    } else {
      reset({ isActive: true, description: '' });
    }
  }, [editing, reset]);

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    const payload = {
      ...data,
      description: data.description?.trim() || undefined,
    };

    if (editing) {
      await updateRole.mutateAsync({ id: editing.id, data: payload as EditFormData });
    } else {
      await createRole.mutateAsync(payload as CreateFormData);
    }
    reset();
    onClose();
  };

  const isLoading = createRole.isPending || updateRole.isPending;

  return (
    <Modal
      title={editing ? 'Editar Rol' : 'Nuevo Rol'}
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      footer={null}
      width={480}
    >
      <Form layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          label="Nombre"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control as never}
            render={({ field }) => <Input {...field} placeholder="Supervisor" />}
          />
        </Form.Item>

        <Form.Item
          label="Slug"
          validateStatus={errors.slug ? 'error' : ''}
          help={errors.slug?.message ?? 'Identificador único en minúsculas (ej. supervisor)'}
        >
          <Controller
            name="slug"
            control={control as never}
            render={({ field }) => (
              <Input
                {...field}
                disabled={!!editing}
                placeholder="supervisor"
                style={{ fontFamily: 'monospace' }}
                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Descripción"
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control as never}
            render={({ field }) => (
              <Input.TextArea {...field} rows={3} placeholder="Descripción del rol" />
            )}
          />
        </Form.Item>

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
        <Button
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          loading={isLoading}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          {editing ? 'Guardar Cambios' : 'Crear Rol'}
        </Button>
      </div>
    </Modal>
  );
}
