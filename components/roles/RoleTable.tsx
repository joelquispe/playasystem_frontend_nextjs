'use client';

import { Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { RoleEntity } from '@/types/api';
import { useDeactivateRole, useUpdateRole } from '@/hooks/useRoles';
import { cardStyle } from '@/lib/theme';

const { Text } = Typography;

interface RoleTableProps {
  data: RoleEntity[];
  loading: boolean;
  onEdit: (role: RoleEntity) => void;
}

export function RoleTable({ data, loading, onEdit }: RoleTableProps) {
  const deactivateRole = useDeactivateRole();
  const updateRole = useUpdateRole();

  const columns: ColumnsType<RoleEntity> = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontWeight: 600 }}>{name}</Text>
          <Text code style={{ fontSize: 12, color: '#888' }}>
            {record.slug}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => value ?? '—',
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
          onChange={(val) => updateRole.mutate({ id: record.id, data: { isActive: val } })}
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
      render: (value: string) => (
        <Text style={{ fontSize: 12, color: '#888' }}>{dayjs(value).format('DD/MM/YY')}</Text>
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
            title="¿Desactivar rol?"
            description="Solo si no hay usuarios asignados."
            onConfirm={() => deactivateRole.mutate(record.id)}
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
