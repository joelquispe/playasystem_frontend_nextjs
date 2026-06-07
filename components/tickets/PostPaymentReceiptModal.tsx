'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Modal, Select, Space, Spin, Typography } from 'antd';
import { Ticket } from '@/types/api';
import { usePostPaymentReceipt } from '@/hooks/useTickets';
import { nubefactService } from '@/services/nubefact.service';
import { nestedPanelStyle, colors } from '@/lib/theme';

const { Text } = Typography;

const schema = z
  .object({
    receiptType: z.enum(['boleta', 'factura']),
    customerDni: z.string().optional(),
    customerRuc: z.string().optional(),
    customerBusinessName: z.string().optional(),
    observation: z.string().optional(),
  })
  .refine((d) => d.receiptType !== 'boleta' || !!d.customerDni, {
    message: 'DNI requerido',
    path: ['customerDni'],
  })
  .refine((d) => d.receiptType !== 'factura' || !!d.customerRuc, {
    message: 'RUC requerido',
    path: ['customerRuc'],
  })
  .refine((d) => d.receiptType !== 'factura' || !!d.customerBusinessName, {
    message: 'Razón social requerida',
    path: ['customerBusinessName'],
  });

type FormData = z.infer<typeof schema>;

interface PostPaymentReceiptModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function PostPaymentReceiptModal({
  ticket,
  open,
  onClose,
}: PostPaymentReceiptModalProps) {
  const postReceipt = usePostPaymentReceipt();
  const [rucLoading, setRucLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { receiptType: 'boleta' },
  });

  const receiptType = watch('receiptType');
  const ruc = watch('customerRuc');

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
    await postReceipt.mutateAsync({ id: ticket.id, data });
    reset();
    onClose();
  };

  if (!ticket) return null;

  const canIssue = ticket.status === 'paid' || ticket.status === 'manual';

  return (
    <Modal
      title={
        <Space>
          <span>Emitir Comprobante</span>
          <Text style={{ fontFamily: 'monospace', fontWeight: 700, color: '#db2777' }}>
            {ticket.plate}
          </Text>
        </Space>
      }
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      footer={null}
      width={460}
    >
      {!canIssue ? (
        <Text type="danger">
          Solo se puede emitir comprobante para tickets ya cobrados (pagado o manual).
        </Text>
      ) : (
        <>
          <div style={{ ...nestedPanelStyle, padding: '12px 16px', marginBottom: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Monto cobrado</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#db2777' }}>
              s/. {parseFloat(ticket.finalAmount).toFixed(2)}
            </div>
          </div>

          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="Tipo de comprobante">
              <Controller
                name="receiptType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: 'boleta', label: 'Boleta electrónica' },
                      { value: 'factura', label: 'Factura electrónica' },
                    ]}
                  />
                )}
              />
            </Form.Item>

            {receiptType === 'boleta' && (
              <Form.Item
                label="DNI"
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
                    render={({ field }) => <Input {...field} />}
                  />
                </Form.Item>
              </>
            )}

            <Form.Item label="Observación (opcional)">
              <Controller
                name="observation"
                control={control}
                render={({ field }) => <Input.TextArea {...field} rows={2} />}
              />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button
              type="primary"
              loading={postReceipt.isPending}
              onClick={handleSubmit(onSubmit)}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Emitir
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
