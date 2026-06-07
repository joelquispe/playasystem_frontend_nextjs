'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { VehicleType } from '@/types/api';
import { useCreateVehicleType, useUpdateVehicleType } from '@/hooks/useVehicles';
import { getDefaultHourRate, VEHICLE_ICON_OPTIONS } from '@/lib/vehicles';

const keyRegex = /^[a-z][a-z0-9_]*$/;

const createSchema = z.object({
  key: z
    .string()
    .min(1, 'Requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(keyRegex, 'Solo minúsculas, números y guiones bajos (ej. pickup_large)'),
  name: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
  iconName: z.string().min(1, 'Requerido'),
  displayOrder: z.number().min(0).optional(),
  defaultRateAmount: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  defaultRateLabel: z.string().max(50).optional(),
});

const editSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface VehicleTypeFormModalProps {
  open: boolean;
  editing: VehicleType | null;
  onClose: () => void;
}

export function VehicleTypeFormModal({ open, editing, onClose }: VehicleTypeFormModalProps) {
  const createVehicle = useCreateVehicleType();
  const updateVehicle = useUpdateVehicleType();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: { displayOrder: 0, isActive: true },
  });

  const amount = watch('defaultRateAmount');

  useEffect(() => {
    if (editing) {
      const defaultRate = getDefaultHourRate(editing);
      reset({
        key: editing.key,
        name: editing.name,
        iconName: editing.iconName,
        displayOrder: editing.displayOrder,
        defaultRateAmount: defaultRate ? parseFloat(defaultRate.amount) : undefined,
        defaultRateLabel: defaultRate?.label ?? '',
        isActive: editing.isActive,
      });
    } else {
      reset({ displayOrder: 0, isActive: true, iconName: 'auto' });
    }
  }, [editing, reset]);

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    const defaultRate = {
      rateType: 'hour_fraction' as const,
      amount: data.defaultRateAmount!,
      label: data.defaultRateLabel?.trim() || `s/.${data.defaultRateAmount}`,
    };

    if (editing) {
      const editData = data as EditFormData;
      await updateVehicle.mutateAsync({
        id: editing.id,
        data: {
          name: editData.name,
          iconName: editData.iconName,
          displayOrder: editData.displayOrder,
          isActive: editData.isActive,
          defaultRate,
        },
      });
    } else {
      await createVehicle.mutateAsync({
        key: (data as CreateFormData).key.trim().toLowerCase(),
        name: data.name!.trim(),
        iconName: data.iconName,
        displayOrder: data.displayOrder ?? 0,
        defaultRate,
      });
    }

    reset();
    onClose();
  };

  const isLoading = createVehicle.isPending || updateVehicle.isPending;

  return (
    <Modal
      title={editing ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      footer={null}
      width={520}
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
            render={({ field }) => <Input {...field} placeholder="Auto" />}
          />
        </Form.Item>

        <Form.Item
          label="Key"
          validateStatus={errors.key ? 'error' : ''}
          help={errors.key?.message ?? 'Identificador único (ej. pickup_large)'}
        >
          <Controller
            name="key"
            control={control as never}
            render={({ field }) => (
              <Input
                {...field}
                disabled={!!editing}
                placeholder="auto"
                style={{ fontFamily: 'monospace' }}
                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Icono"
          validateStatus={errors.iconName ? 'error' : ''}
          help={errors.iconName?.message}
        >
          <Controller
            name="iconName"
            control={control as never}
            render={({ field }) => (
              <Select {...field} options={VEHICLE_ICON_OPTIONS} placeholder="Seleccionar icono" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Orden de visualización"
          validateStatus={errors.displayOrder ? 'error' : ''}
          help={errors.displayOrder?.message}
        >
          <Controller
            name="displayOrder"
            control={control as never}
            render={({ field }) => (
              <InputNumber {...field} min={0} style={{ width: '100%' }} placeholder="0" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tarifa base (hora/fracción)"
          validateStatus={errors.defaultRateAmount ? 'error' : ''}
          help={errors.defaultRateAmount?.message}
        >
          <Controller
            name="defaultRateAmount"
            control={control as never}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.5}
                prefix="s/."
                style={{ width: '100%' }}
                placeholder="6.00"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Etiqueta de tarifa"
          validateStatus={errors.defaultRateLabel ? 'error' : ''}
          help={errors.defaultRateLabel?.message ?? 'Opcional — por defecto s/.{monto}'}
        >
          <Controller
            name="defaultRateLabel"
            control={control as never}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={amount != null ? `s/.${amount}` : 's/.6'}
              />
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
          {editing ? 'Guardar Cambios' : 'Crear Tipo'}
        </Button>
      </div>
    </Modal>
  );
}
