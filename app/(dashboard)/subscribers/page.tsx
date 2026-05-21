'use client';

import { useState } from 'react';
import { Button, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSubscribers, useCancelSubscriber } from '@/hooks/useSubscribers';
import { Subscriber, SubscriberStatus } from '@/types/api';
import { SUBSCRIBER_STATUS_LABELS } from '@/lib/constants';
import { SubscriberFormModal } from '@/components/subscribers/SubscriberFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

const { Text } = Typography;

const STATUS_COLORS: Record<SubscriberStatus, string> = {
  active: 'success',
  expired: 'warning',
  cancelled: 'default',
};

export default function SubscribersPage() {
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | undefined>(undefined);
  const [editing, setEditing] = useState<Subscriber | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: subscribers = [], isLoading, isFetching, refetch } = useSubscribers(statusFilter);
  const cancelSubscriber = useCancelSubscriber();

  const columns: ColumnsType<Subscriber> = [
    {
      title: 'Placa',
      dataIndex: 'plate',
      key: 'plate',
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', color: '#e0e0e0' }}>
          {v}
        </Text>
      ),
    },
    { title: 'Nombre', dataIndex: 'fullName', key: 'fullName' },
    {
      title: 'Vehículo',
      key: 'vehicle',
      render: (_: unknown, r: Subscriber) => r.vehicleType?.name ?? '—',
    },
    {
      title: 'Monto/mes',
      dataIndex: 'monthlyAmount',
      key: 'monthlyAmount',
      render: (v: string) => `s/. ${parseFloat(v).toFixed(2)}`,
    },
    {
      title: 'Período',
      key: 'period',
      render: (_: unknown, r: Subscriber) =>
        `${dayjs(r.periodStart).format('DD/MM/YY')} – ${dayjs(r.periodEnd).format('DD/MM/YY')}`,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v: SubscriberStatus) => (
        <Tag color={STATUS_COLORS[v]}>{SUBSCRIBER_STATUS_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: Subscriber) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); setFormOpen(true); }}>
            Editar
          </Button>
          {record.status !== 'cancelled' && (
            <Popconfirm
              title="¿Cancelar abono?"
              onConfirm={() => cancelSubscriber.mutate(record.id)}
            >
              <Button size="small" danger>
                Cancelar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Abonados"
        subtitle={`${subscribers.length} registros`}
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Filtrar estado"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={Object.entries(SUBSCRIBER_STATUS_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditing(null); setFormOpen(true); }}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Nuevo abonado
            </Button>
          </Space>
        }
      />

      <Table
        dataSource={subscribers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        style={{ background: '#1a1a1a', borderRadius: 12 }}
      />

      <SubscriberFormModal
        open={formOpen}
        editing={editing}
        onClose={() => { setEditing(null); setFormOpen(false); }}
      />
    </>
  );
}
