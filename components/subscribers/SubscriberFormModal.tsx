'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { Subscriber } from '@/types/api';
import { useCreateSubscriber, useUpdateSubscriber } from '@/hooks/useSubscribers';
import { useVehicles } from '@/hooks/useVehicles';

const schema = z.object({
  plate: z.string().min(1).max(20),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  dni: z.string().optional(),
  vehicleTypeId: z.string().optional(),
  monthlyAmount: z.number().positive(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SubscriberFormModalProps {
  open: boolean;
  editing: Subscriber | null;
  onClose: () => void;
}

export function SubscriberFormModal({ open, editing, onClose }: SubscriberFormModalProps) {
  const { data: vehicles = [] } = useVehicles();
  const createSubscriber = useCreateSubscriber();
  const updateSubscriber = useUpdateSubscriber();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { monthlyAmount: 350 },
  });

  useEffect(() => {
    if (editing) {
      reset({
        plate: editing.plate,
        fullName: editing.fullName,
        phone: editing.phone ?? '',
        dni: editing.dni ?? '',
        vehicleTypeId: editing.vehicleTypeId ?? undefined,
        monthlyAmount: parseFloat(editing.monthlyAmount),
        periodStart: editing.periodStart,
        periodEnd: editing.periodEnd,
        notes: editing.notes ?? '',
      });
    } else {
      const start = dayjs().startOf('month');
      reset({
        monthlyAmount: 350,
        periodStart: start.format('YYYY-MM-DD'),
        periodEnd: start.endOf('month').format('YYYY-MM-DD'),
      });
    }
  }, [editing, reset]);

  const onSubmit = async (data: FormData) => {
    if (editing) {
      await updateSubscriber.mutateAsync({
        id: editing.id,
        data: {
          fullName: data.fullName,
          phone: data.phone,
          dni: data.dni,
          vehicleTypeId: data.vehicleTypeId,
          notes: data.notes,
        },
      });
    } else {
      await createSubscriber.mutateAsync({
        plate: data.plate.toUpperCase(),
        fullName: data.fullName,
        phone: data.phone,
        dni: data.dni,
        vehicleTypeId: data.vehicleTypeId,
        monthlyAmount: data.monthlyAmount,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        notes: data.notes,
      });
    }
    reset();
    onClose();
  };

  return (
    <Modal
      title={editing ? 'Editar abonado' : 'Nuevo abonado'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Form layout="vertical" requiredMark={false}>
        {!editing && (
          <Form.Item label="Placa" validateStatus={errors.plate ? 'error' : ''} help={errors.plate?.message}>
            <Controller
              name="plate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              )}
            />
          </Form.Item>
        )}

        <Form.Item label="Nombre" validateStatus={errors.fullName ? 'error' : ''} help={errors.fullName?.message}>
          <Controller name="fullName" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>

        {!editing && (
          <>
            <Form.Item label="Monto mensual (s/.)">
              <Controller
                name="monthlyAmount"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={1} style={{ width: '100%' }} prefix="s/." />
                )}
              />
            </Form.Item>
            <Form.Item label="Período">
              <Controller
                name="periodStart"
                control={control}
                render={({ field: startField }) => (
                  <Controller
                    name="periodEnd"
                    control={control}
                    render={({ field: endField }) => (
                      <DatePicker.RangePicker
                        style={{ width: '100%' }}
                        value={[
                          startField.value ? dayjs(startField.value) : null,
                          endField.value ? dayjs(endField.value) : null,
                        ]}
                        onChange={(dates) => {
                          startField.onChange(dates?.[0]?.format('YYYY-MM-DD') ?? '');
                          endField.onChange(dates?.[1]?.format('YYYY-MM-DD') ?? '');
                        }}
                      />
                    )}
                  />
                )}
              />
            </Form.Item>
          </>
        )}

        <Form.Item label="Teléfono">
          <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>

        <Form.Item label="DNI">
          <Controller name="dni" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>

        <Form.Item label="Tipo de vehículo">
          <Controller
            name="vehicleTypeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                allowClear
                placeholder="Opcional"
                options={vehicles.map((v) => ({ value: v.id, label: v.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Notas">
          <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="primary"
          loading={createSubscriber.isPending || updateSubscriber.isPending}
          onClick={handleSubmit(onSubmit)}
          style={{ background: '#db2777', borderColor: '#db2777' }}
        >
          Guardar
        </Button>
      </div>
    </Modal>
  );
}
