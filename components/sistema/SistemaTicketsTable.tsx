'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Checkbox,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  KeyOutlined,
  PrinterOutlined,
  PlusOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Ticket, Client, EventColor } from '@/types/api';
import { useClients } from '@/hooks/useClients';
import { useRevertTicket, useToggleKey } from '@/hooks/useTickets';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { cardStyle, colors } from '@/lib/theme';

dayjs.extend(duration);

const { Text } = Typography;

const EVENT_DOT: Record<EventColor, string> = {
  white: '#d9cfc4',
  green: '#4c8f5a',
  red: '#c4605c',
};

function formatElapsed(entryTime: string): string {
  const mins = dayjs().diff(dayjs(entryTime), 'minute');
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface SistemaTicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onCharge: (ticket: Ticket) => void;
  onReceipt: (ticket: Ticket) => void;
  onAddCharge: (ticket: Ticket) => void;
  onPrint: (ticket: Ticket) => void;
}

export function SistemaTicketsTable({
  tickets,
  loading,
  isFetching,
  onRefresh,
  onCharge,
  onReceipt,
  onAddCharge,
  onPrint,
}: SistemaTicketsTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const { data: clients = [] } = useClients();
  const revertTicket = useRevertTicket();
  const toggleKey = useToggleKey();

  const clientByPlate = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.plate.toUpperCase(), c));
    return map;
  }, [clients]);

  const filtered = filter === 'pending' ? tickets.filter((t) => t.status === 'pending') : tickets;

  const columns: ColumnsType<Ticket> = [
    {
      title: '',
      key: 'revert',
      width: 44,
      fixed: 'left',
      render: (_, record) =>
        record.status === 'paid' ? (
          <Tooltip title="Revertir cobro">
            <Button
              type="text"
              size="small"
              icon={<RollbackOutlined />}
              loading={revertTicket.isPending}
              onClick={() => revertTicket.mutate(record.id)}
            />
          </Tooltip>
        ) : null,
    },
    {
      title: 'Placa',
      dataIndex: 'plate',
      key: 'plate',
      fixed: 'left',
      width: 100,
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', color: colors.text }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Vehículo',
      key: 'vehicle',
      width: 120,
      render: (_, r) => r.vehicleType?.name ?? '—',
    },
    {
      title: 'H. Ingreso',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 90,
      render: (v: string) => dayjs(v).format('HH:mm'),
    },
    {
      title: 'H. Salida',
      dataIndex: 'exitTime',
      key: 'exitTime',
      width: 90,
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm') : '—'),
    },
    {
      title: 'Tiempo',
      key: 'elapsed',
      width: 80,
      render: (_, r) => (r.status === 'pending' ? formatElapsed(r.entryTime) : r.totalMinutes ? `${r.totalMinutes}m` : '—'),
    },
    {
      title: 'Tarifa',
      key: 'rate',
      width: 130,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{RATE_TYPE_LABELS[r.rateType] ?? r.rateType}</Text>
          <Text style={{ color: colors.accent, fontWeight: 600 }}>
            s/. {parseFloat(r.rateAmount).toFixed(2)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Monto Total',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 100,
      render: (v: string, r) =>
        r.status === 'paid' || r.status === 'manual' ? (
          <Text strong style={{ color: colors.accent }}>
            s/. {parseFloat(v).toFixed(2)}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Cliente',
      key: 'client',
      width: 120,
      render: (_, r) => clientByPlate.get(r.plate.toUpperCase())?.fullName ?? '—',
    },
    {
      title: 'Eventos',
      key: 'events',
      width: 70,
      align: 'center',
      render: (_, r) => {
        const color = clientByPlate.get(r.plate.toUpperCase())?.eventColor ?? 'white';
        return (
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: EVENT_DOT[color],
              border: '1px solid #ccc',
            }}
          />
        );
      },
    },
    {
      title: 'Registros',
      key: 'records',
      width: 100,
      render: (_, r) => {
        const client = clientByPlate.get(r.plate.toUpperCase());
        return client ? (
          <Link href={`/clients?plate=${r.plate}`}>
            <Button size="small" type="link">
              Registros
            </Button>
          </Link>
        ) : (
          '—'
        );
      },
    },
    {
      title: 'Cobro manual',
      key: 'charge',
      width: 120,
      render: (_, r) =>
        r.status === 'pending' ? (
          <Button size="small" type="primary" onClick={() => onCharge(r)}>
            Cobrar Ticket
          </Button>
        ) : null,
    },
    {
      title: 'Boleta/Factura',
      key: 'receipt',
      width: 120,
      render: (_, r) =>
        r.status === 'paid' || r.status === 'manual' ? (
          <Button size="small" style={{ background: '#4c8f5a', color: '#fff', borderColor: '#4c8f5a' }} onClick={() => onReceipt(r)}>
            Comprobante
          </Button>
        ) : null,
    },
    {
      title: 'Llave',
      key: 'key',
      width: 70,
      align: 'center',
      render: (_, r) => (
        <Checkbox
          checked={r.hasKey}
          onChange={() => toggleKey.mutate(r.id)}
          disabled={toggleKey.isPending}
        >
          <KeyOutlined />
        </Checkbox>
      ),
    },
    {
      title: 'Ticket',
      key: 'print',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, r: Ticket) => (
        <Tooltip title="Ver / Reimprimir ticket">
          <Button
            size="small"
            type="text"
            icon={<PrinterOutlined />}
            onClick={() => onPrint(r)}
            style={{ color: colors.primary }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Cargo adicional',
      key: 'additional',
      width: 130,
      render: (_, r) =>
        r.status === 'pending' ? (
          <Button size="small" icon={<PlusOutlined />} onClick={() => onAddCharge(r)}>
            Agregar
          </Button>
        ) : r.charges?.length ? (
          <Tag color="orange">+{r.charges.length}</Tag>
        ) : null,
    },
  ];

  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Text strong style={{ color: colors.text, fontSize: 15 }}>
          Vehículos en el sistema
        </Text>
        <Space>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 180 }}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendientes por cobrar' },
            ]}
          />
          <Button icon={<ReloadOutlined spin={isFetching} />} onClick={onRefresh}>
            Actualizar
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        size="small"
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 15, showSizeChanger: false }}
        expandable={{
          expandedRowRender: (record) =>
            record.charges?.length ? (
              <div style={{ padding: '8px 0' }}>
                {record.charges.map((c) => (
                  <div key={c.id} style={{ fontSize: 12, color: colors.textMuted }}>
                    · {c.chargeType}: s/. {parseFloat(c.amount).toFixed(2)}
                    {c.notes ? ` — ${c.notes}` : ''}
                  </div>
                ))}
              </div>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Sin cargos adicionales</Text>
            ),
          rowExpandable: (record) => (record.charges?.length ?? 0) > 0 || record.status === 'pending',
        }}
      />
    </div>
  );
}
