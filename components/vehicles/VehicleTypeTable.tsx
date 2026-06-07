'use client';

import { Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { VehicleType } from '@/types/api';
import { useDeactivateVehicleType, useUpdateVehicleType } from '@/hooks/useVehicles';
import { getDefaultHourRate } from '@/lib/vehicles';
import { cardStyle } from '@/lib/theme';

const { Text } = Typography;

interface VehicleTypeTableProps {
  data: VehicleType[];
  loading: boolean;
  onEdit: (vehicle: VehicleType) => void;
}

export function VehicleTypeTable({ data, loading, onEdit }: VehicleTypeTableProps) {
  const deactivateVehicle = useDeactivateVehicleType();
  const updateVehicle = useUpdateVehicleType();

  const columns: ColumnsType<VehicleType> = [
    {
      title: 'Tipo',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontWeight: 600 }}>{record.name}</Text>
          <Text code style={{ fontSize: 12, color: '#888' }}>
            {record.key}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Icono',
      dataIndex: 'iconName',
      key: 'iconName',
      width: 100,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Orden',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
    },
    {
      title: 'Tarifa base',
      key: 'defaultRate',
      render: (_, record) => {
        const rate = getDefaultHourRate(record);
        if (!rate) return '—';
        return (
          <Text>
            {rate.label} — s/. {parseFloat(rate.amount).toFixed(2)}
          </Text>
        );
      },
    },
    {
      title: 'Tarifas',
      key: 'ratesCount',
      width: 90,
      render: (_, record) => (record.rates?.length ?? 0),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record) => (
        <Switch
          size="small"
          checked={isActive}
          onChange={(val) => updateVehicle.mutate({ id: record.id, data: { isActive: val } })}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
        />
      ),
    },
    {
      title: 'Actualizado',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (value?: string) =>
        value ? (
          <Text style={{ fontSize: 12, color: '#888' }}>{dayjs(value).format('DD/MM/YY')}</Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar tipo de vehículo?"
            description="No se puede desactivar si hay tickets pendientes."
            onConfirm={() => deactivateVehicle.mutate(record.id)}
            okText="Desactivar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={!record.isActive}
          >
            <Tooltip title="Desactivar">
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={!record.isActive}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      size="middle"
      pagination={{ pageSize: 20, showSizeChanger: false }}
      style={cardStyle}
    />
  );
}
