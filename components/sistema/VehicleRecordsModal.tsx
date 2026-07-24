'use client';

import {
  Descriptions,
  Empty,
  Modal,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Client, EventColor, PlateEvent, Ticket } from '@/types/api';
import { useClientByPlate } from '@/hooks/useClients';
import { usePlateEvents } from '@/hooks/usePlateEvents';
import { EVENT_COLOR_LABELS, RATE_TYPE_LABELS } from '@/lib/constants';
import { formatLimaDateTime } from '@/lib/datetime';
import { normalizePlate } from '@/lib/plate';
import { colors } from '@/lib/theme';

const { Text, Title } = Typography;

const EVENT_TAG: Record<EventColor, string> = {
  white: 'default',
  green: 'success',
  red: 'error',
};

interface VehicleRecordsModalProps {
  ticket: Ticket | null;
  /** Client from the table cache; refreshed via plate lookup when open */
  client?: Client | null;
  open: boolean;
  onClose: () => void;
}

export function VehicleRecordsModal({
  ticket,
  client: clientProp,
  open,
  onClose,
}: VehicleRecordsModalProps) {
  const plate = ticket ? normalizePlate(ticket.plate) : '';

  const { data: clientByPlate, isLoading: clientLoading } = useClientByPlate(plate, {
    enabled: open && plate.length >= 6,
  });
  const client = clientByPlate ?? clientProp ?? null;

  const {
    data: events = [],
    isLoading: eventsLoading,
    isFetching: eventsFetching,
  } = usePlateEvents(plate, { enabled: open && plate.length >= 3 });

  const eventColumns: ColumnsType<PlateEvent> = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) => formatLimaDateTime(v),
    },
    {
      title: 'Estado',
      dataIndex: 'eventColor',
      key: 'eventColor',
      width: 100,
      render: (color: EventColor) => (
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
      title={ticket ? `Registros · ${ticket.plate}` : 'Registros'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      {!ticket ? (
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
                {ticket.plate}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Vehículo">
              {ticket.vehicleType?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ingreso">
              {formatLimaDateTime(ticket.entryTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Salida">
              {ticket.exitTime ? formatLimaDateTime(ticket.exitTime) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tarifa">
              {RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType}
              {' · '}
              s/. {parseFloat(ticket.rateAmount).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Estado ticket">
              <Tag>{ticket.status}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Title level={5} style={{ margin: '0 0 12px', color: colors.text }}>
            Cliente
          </Title>
          {clientLoading && !client ? (
            <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 20 }} />
          ) : client ? (
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2 }}
              style={{ marginBottom: 20 }}
              styles={{ label: { color: colors.textMuted } }}
            >
              <Descriptions.Item label="Nombre">{client.fullName}</Descriptions.Item>
              <Descriptions.Item label="Teléfono">{client.phone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="DNI">{client.dni ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={EVENT_TAG[client.eventColor] ?? 'default'}>
                  {EVENT_COLOR_LABELS[client.eventColor] ?? client.eventColor}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tarifa especial">
                {parseFloat(client.specialRate) > 0
                  ? `s/. ${parseFloat(client.specialRate).toFixed(2)}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Notas">{client.notes ?? '—'}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty
              description={
                <Text style={{ color: colors.textMuted }}>
                  Esta placa no está registrada como cliente
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginBottom: 20 }}
            />
          )}

          <Title level={5} style={{ margin: '0 0 12px', color: colors.text }}>
            Historial de eventos
          </Title>
          {eventsLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : events.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: colors.textMuted }}>Sin eventos registrados</Text>
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
