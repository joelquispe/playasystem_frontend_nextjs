'use client';

import { useState } from 'react';
import { Button, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Client } from '@/types/api';
import { useDeleteClient } from '@/hooks/useClients';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

const EVENT_COLOR_MAP: Record<string, { color: string; label: string }> = {
  white: { color: 'default', label: 'Normal' },
  green: { color: 'success', label: 'Frecuente' },
  red: { color: 'error', label: 'Alerta' },
};

interface ClientTableProps {
  data: Client[];
  loading: boolean;
  onEdit: (client: Client) => void;
}

export function ClientTable({ data, loading, onEdit }: ClientTableProps) {
  const [search, setSearch] = useState('');
  const deleteClient = useDeleteClient();

  const filtered = data.filter(
    (c) =>
      c.plate.toLowerCase().includes(search.toLowerCase()) ||
      c.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnsType<Client> = [
    {
      title: 'Placa',
      dataIndex: 'plate',
      key: 'plate',
      render: (plate: string) => (
        <Text style={{ fontFamily: 'monospace', fontWeight: 700, color: colors.text }}>
          {plate}
        </Text>
      ),
      width: 110,
    },
    {
      title: 'Nombre',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, record: Client) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: colors.text }}>{name}</Text>
          {record.phone && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{record.phone}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Vehículo',
      dataIndex: ['vehicleType', 'name'],
      key: 'vehicle',
      render: (v: string) => v ?? '—',
      width: 100,
    },
    {
      title: 'Tarifa especial',
      dataIndex: 'specialRate',
      key: 'specialRate',
      width: 110,
      render: (v: string) =>
        parseFloat(v) > 0 ? (
          <Tag color="purple">s/. {parseFloat(v).toFixed(2)}</Tag>
        ) : (
          <Text style={{ color: colors.textSubtle }}>—</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'eventColor',
      key: 'eventColor',
      width: 90,
      render: (color: string) => {
        const cfg = EVENT_COLOR_MAP[color] ?? EVENT_COLOR_MAP.white;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 90,
      render: (_, record: Client) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar cliente?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => deleteClient.mutate(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteClient.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Input
        placeholder="Buscar por placa o nombre..."
        prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 320 }}
        allowClear
      />
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 600 }}
        style={cardStyle}
      />
    </>
  );
}
