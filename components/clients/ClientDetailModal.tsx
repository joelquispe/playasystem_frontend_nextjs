'use client';

import { useState } from 'react';
import {
  DatePicker,
  Descriptions,
  Empty,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { EventColor, PlateEvent } from '@/types/api';
import { useClient, useClientEvents } from '@/hooks/useClients';
import { EVENT_COLOR_LABELS } from '@/lib/constants';
import { colors } from '@/lib/theme';

const { Text, Title } = Typography;

const EVENT_TAG: Record<string, string> = {
  white: 'default',
  green: 'success',
  red: 'error',
};

const STATUS_OPTIONS: { value: EventColor; label: string }[] = [
  { value: 'white', label: EVENT_COLOR_LABELS.white },
  { value: 'green', label: EVENT_COLOR_LABELS.green },
  { value: 'red', label: EVENT_COLOR_LABELS.red },
];

interface ClientDetailModalProps {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ClientDetailModal({ clientId, open, onClose }: ClientDetailModalProps) {
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventColor | undefined>(undefined);

  const dateParam = dateFilter?.format('YYYY-MM-DD');
  const hasFilters = !!dateParam || !!statusFilter;

  const { data: client, isLoading: clientLoading } = useClient(
    open ? (clientId ?? undefined) : undefined,
  );
  const {
    data: events = [],
    isLoading: eventsLoading,
    isFetching: eventsFetching,
  } = useClientEvents(open ? (clientId ?? undefined) : undefined, {
    date: dateParam,
    eventColor: statusFilter,
  });

  const handleClose = () => {
    setDateFilter(null);
    setStatusFilter(undefined);
    onClose();
  };

  const eventColumns: ColumnsType<PlateEvent> = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Estado',
      dataIndex: 'eventColor',
      key: 'eventColor',
      width: 100,
      render: (color: string) => (
        <Tag color={EVENT_TAG[color] ?? 'default'}>
          {EVENT_COLOR_LABELS[color] ?? color}
        </Tag>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observation',
      key: 'observation',
      render: (v: string) => (
        <Text style={{ color: colors.text, fontSize: 13 }}>{v || '—'}</Text>
      ),
    },
    {
      title: 'Registrado por',
      key: 'recordedBy',
      width: 140,
      render: (_: unknown, r: PlateEvent) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {r.recordedBy?.fullName ?? '—'}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title="Detalle del cliente"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      {clientLoading || !client ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginBottom: 20 }}
            styles={{ label: { color: colors.textMuted } }}
          >
            <Descriptions.Item label="Placa">
              <Text strong style={{ fontFamily: 'monospace' }}>
                {client.plate}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre">{client.fullName}</Descriptions.Item>
            <Descriptions.Item label="Teléfono">{client.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="DNI">{client.dni ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Vehículo">
              {client.vehicleType?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tarifa especial">
              {parseFloat(client.specialRate) > 0
                ? `s/. ${parseFloat(client.specialRate).toFixed(2)}`
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={EVENT_TAG[client.eventColor] ?? 'default'}>
                {EVENT_COLOR_LABELS[client.eventColor] ?? client.eventColor}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Notas">{client.notes ?? '—'}</Descriptions.Item>
          </Descriptions>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Title level={5} style={{ margin: 0, color: colors.text }}>
              Historial de eventos
            </Title>
            <Space wrap>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Fecha:</Text>
              <DatePicker
                value={dateFilter}
                onChange={(v) => setDateFilter(v)}
                format="DD/MM/YYYY"
                placeholder="Todas"
                allowClear
              />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Estado:</Text>
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="Todos"
                allowClear
                style={{ width: 140 }}
                options={STATUS_OPTIONS}
              />
            </Space>
          </div>

          {eventsLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : events.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: colors.textMuted }}>
                  {hasFilters
                    ? 'Sin eventos para los filtros seleccionados'
                    : 'Sin eventos registrados'}
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              dataSource={events}
              columns={eventColumns}
              rowKey="id"
              size="small"
              loading={eventsFetching}
              pagination={{ pageSize: 8, showSizeChanger: false }}
            />
          )}
        </>
      )}
    </Modal>
  );
}
