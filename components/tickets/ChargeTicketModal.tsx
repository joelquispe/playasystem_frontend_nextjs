'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import { useChargeTicket } from '@/hooks/useTickets';
import { usePlateEvents } from '@/hooks/usePlateEvents';
import { nubefactService } from '@/services/nubefact.service';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

const { Text } = Typography;

const schema = z
  .object({
    paymentMethod: z.string().min(1, 'Requerido'),
    receiptType: z.string().default('vale'),
    discount: z.number().min(0).default(0),
    discountObservation: z.string().optional(),
    customerDni: z.string().optional(),
    customerRuc: z.string().optional(),
    customerBusinessName: z.string().optional(),
    observation: z.string().optional(),
  })
  .refine(
    (d) => d.discount === 0 || !!d.discountObservation,
    { message: 'Explica el descuento', path: ['discountObservation'] },
  )
  .refine(
    (d) => d.receiptType !== 'boleta' || !!d.customerDni,
    { message: 'DNI requerido para boleta', path: ['customerDni'] },
  )
  .refine(
    (d) => d.receiptType !== 'factura' || !!d.customerRuc,
    { message: 'RUC requerido para factura', path: ['customerRuc'] },
  )
  .refine(
    (d) => d.receiptType !== 'factura' || !!d.customerBusinessName,
    { message: 'Razón social requerida', path: ['customerBusinessName'] },
  );

type FormData = z.infer<typeof schema>;

interface ChargeTicketModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function ChargeTicketModal({ ticket, open, onClose }: ChargeTicketModalProps) {
  const chargeTicket = useChargeTicket();
  const [rucLoading, setRucLoading] = useState(false);
  const { data: plateEvents = [] } = usePlateEvents(ticket?.plate ?? '');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      paymentMethod: '',
      receiptType: 'vale',
      discount: 0,
    },
  });

  const receiptType = watch('receiptType');
  const discount = watch('discount');
  const ruc = watch('customerRuc');

  // Auto-lookup business name by RUC
  useEffect(() => {
    if (receiptType !== 'factura' || !ruc || ruc.length !== 11) return;
    setRucLoading(true);
    nubefactService
      .getTaxpayer(ruc)
      .then((info) => setValue('customerBusinessName', info.businessName))
      .catch(() => {})
      .finally(() => setRucLoading(false));
  }, [ruc, receiptType, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!ticket) return;
    await chargeTicket.mutateAsync({
      id: ticket.id,
      data: {
        paymentMethod: data.paymentMethod as never,
        receiptType: (data.receiptType as never) ?? 'vale',
        discount: data.discount,
        discountObservation: data.discountObservation || null,
        customerDni: data.customerDni || null,
        customerRuc: data.customerRuc || null,
        customerBusinessName: data.customerBusinessName || null,
        observation: data.observation || null,
      },
    });
    reset();
    onClose();
  };

  if (!ticket) return null;

  const entryTime = dayjs(ticket.entryTime);
  const elapsedMins = dayjs().diff(entryTime, 'minute');
  const elapsedH = Math.floor(elapsedMins / 60);
  const elapsedM = elapsedMins % 60;

  const additionalTotal = ticket.charges?.reduce((s, c) => s + parseFloat(c.amount), 0) ?? 0;

  return (
    <Modal
      title={
        <Space>
          <span>Cobrar Ticket</span>
          <Text
            style={{ fontFamily: 'monospace', fontWeight: 700, color: '#db2777', fontSize: 16 }}
          >
            {ticket.plate}
          </Text>
        </Space>
      }
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={500}
    >
      {/* Summary */}
      <div
        style={{
          background: '#111',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <div>
          <Text style={{ fontSize: 11, color: '#666' }}>Entrada</Text>
          <div style={{ color: '#e0e0e0', fontWeight: 600 }}>
            {entryTime.format('HH:mm')}
          </div>
        </div>
        <div>
          <Text style={{ fontSize: 11, color: '#666' }}>Tiempo</Text>
          <div style={{ color: '#e0e0e0', fontWeight: 600 }}>
            {elapsedH > 0 ? `${elapsedH}h ` : ''}{elapsedM}m
          </div>
        </div>
        <div>
          <Text style={{ fontSize: 11, color: '#666' }}>Tarifa</Text>
          <div style={{ color: '#db2777', fontWeight: 600 }}>
            s/. {parseFloat(ticket.rateAmount).toFixed(2)}
          </div>
        </div>
        {additionalTotal > 0 && (
          <div>
            <Text style={{ fontSize: 11, color: '#666' }}>Cargos extra</Text>
            <div style={{ color: '#f59e0b', fontWeight: 600 }}>
              + s/. {additionalTotal.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Método de Pago"
          validateStatus={errors.paymentMethod ? 'error' : ''}
          help={errors.paymentMethod?.message}
        >
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                size="large"
                placeholder="Seleccionar..."
                options={Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Tipo de Comprobante">
          <Controller
            name="receiptType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'vale', label: 'Vale (interno)' },
                  { value: 'boleta', label: 'Boleta electrónica' },
                  { value: 'factura', label: 'Factura electrónica' },
                ]}
              />
            )}
          />
        </Form.Item>

        {receiptType === 'boleta' && (
          <Form.Item
            label="DNI del cliente"
            validateStatus={errors.customerDni ? 'error' : ''}
            help={errors.customerDni?.message}
          >
            <Controller
              name="customerDni"
              control={control}
              render={({ field }) => (
                <Input {...field} maxLength={8} placeholder="12345678" />
              )}
            />
          </Form.Item>
        )}

        {receiptType === 'factura' && (
          <>
            <Form.Item
              label="RUC"
              validateStatus={errors.customerRuc ? 'error' : ''}
              help={errors.customerRuc?.message}
            >
              <Controller
                name="customerRuc"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    maxLength={11}
                    placeholder="20609471841"
                    suffix={rucLoading ? <Spin size="small" /> : null}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Razón Social"
              validateStatus={errors.customerBusinessName ? 'error' : ''}
              help={errors.customerBusinessName?.message}
            >
              <Controller
                name="customerBusinessName"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Empresa S.A.C." />
                )}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Descuento (s/.)"
          validateStatus={errors.discount ? 'error' : ''}
          help={errors.discount?.message}
        >
          <Controller
            name="discount"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} step={0.5} style={{ width: '100%' }} prefix="s/." />
            )}
          />
        </Form.Item>

        {plateEvents.length > 0 && (
          <div
            style={{
              background: '#111',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
              maxHeight: 100,
              overflow: 'auto',
            }}
          >
            <Text style={{ fontSize: 11, color: '#666' }}>Historial de eventos</Text>
            {plateEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                · {ev.observation}
              </div>
            ))}
          </div>
        )}

        {(discount ?? 0) > 0 && (
          <Form.Item
            label="Motivo del descuento"
            validateStatus={errors.discountObservation ? 'error' : ''}
            help={errors.discountObservation?.message}
          >
            <Controller
              name="discountObservation"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Ej. Cliente frecuente" />
              )}
            />
          </Form.Item>
        )}

        <Form.Item label="Observación (opcional)">
          <Controller
            name="observation"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Notas adicionales..."
              />
            )}
          />
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
        <Button
          type="primary"
          loading={chargeTicket.isPending}
          onClick={handleSubmit(onSubmit)}
          size="large"
          style={{ background: '#db2777', borderColor: '#db2777', minWidth: 120 }}
        >
          Confirmar Pago
        </Button>
      </div>
    </Modal>
  );
}
