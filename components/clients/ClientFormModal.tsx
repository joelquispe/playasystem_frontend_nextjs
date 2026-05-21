'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { Client } from '@/types/api';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { useVehicles } from '@/hooks/useVehicles';

const schema = z.object({
  plate: z.string().min(1).max(20),
  vehicleTypeId: z.string().optional(),
  fullName: z.string().min(1, 'Requerido'),
  phone: z.string().optional(),
  dni: z.string().optional(),
  specialRate: z.number().min(0).default(0),
  eventColor: z.enum(['white', 'green', 'red']).default('white'),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientFormModalProps {
  open: boolean;
  editing: Client | null;
  onClose: () => void;
}

export function ClientFormModal({ open, editing, onClose }: ClientFormModalProps) {
  const { data: vehicles = [] } = useVehicles();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { specialRate: 0, eventColor: 'white', isActive: true },
  });

  useEffect(() => {
    if (editing) {
      reset({
        plate: editing.plate,
        vehicleTypeId: editing.vehicleTypeId ?? undefined,
        fullName: editing.fullName,
        phone: editing.phone ?? '',
        dni: editing.dni ?? '',
        specialRate: parseFloat(editing.specialRate) ?? 0,
        eventColor: editing.eventColor,
        notes: editing.notes ?? '',
        isActive: editing.isActive,
      });
    } else {
      reset({ specialRate: 0, eventColor: 'white', isActive: true });
    }
  }, [editing, reset]);

  const onSubmit = async (data: FormData) => {
    if (editing) {
      await updateClient.mutateAsync({ id: editing.id, data });
    } else {
      await createClient.mutateAsync({
        plate: data.plate.toUpperCase(),
        vehicleTypeId: data.vehicleTypeId,
        fullName: data.fullName,
        phone: data.phone,
        dni: data.dni,
        specialRate: data.specialRate,
        eventColor: data.eventColor,
        notes: data.notes,
      });
    }
    reset();
    onClose();
  };

  const isLoading = createClient.isPending || updateClient.isPending;

  return (
    <Modal
      title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={480}
    >
      <Form layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  disabled={!!editing}
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                />
              )}
            />
          </Form.Item>

          <Form.Item label="Tipo de Vehículo">
            <Controller
              name="vehicleTypeId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  options={vehicles.map((v) => ({ value: v.id, label: v.name }))}
                />
              )}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Nombre Completo"
          validateStatus={errors.fullName ? 'error' : ''}
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Juan Pérez García" />}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Teléfono">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => <Input {...field} placeholder="987654321" />}
            />
          </Form.Item>
          <Form.Item label="DNI">
            <Controller
              name="dni"
              control={control}
              render={({ field }) => <Input {...field} placeholder="45552192" maxLength={8} />}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Tarifa especial (s/.)">
            <Controller
              name="specialRate"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} step={0.5} style={{ width: '100%' }} prefix="s/." />
              )}
            />
          </Form.Item>
          <Form.Item label="Color de evento">
            <Controller
              name="eventColor"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { value: 'white', label: 'Normal' },
                    { value: 'green', label: 'Frecuente / Amable' },
                    { value: 'red', label: 'Alerta / Problemático' },
                  ]}
                />
              )}
            />
          </Form.Item>
        </div>

        <Form.Item label="Notas">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} rows={2} placeholder="Observaciones..." />
            )}
          />
        </Form.Item>

        {editing && (
          <Form.Item label="Activo">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
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
          {editing ? 'Guardar Cambios' : 'Registrar Cliente'}
        </Button>
      </div>
    </Modal>
  );
}
