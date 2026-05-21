'use client';

import { Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, KeyOutlined, StopOutlined } from '@ant-design/icons';
import { User } from '@/types/api';
import { useDeleteUser, useUpdateUser } from '@/hooks/useUsers';

const { Text } = Typography;

interface UserTableProps {
  data: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
}

export function UserTable({ data, loading, onEdit, onResetPassword }: UserTableProps) {
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const columns: ColumnsType<User> = [
    {
      title: 'Usuario',
      key: 'username',
      render: (_, record: User) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#e0e0e0', fontFamily: 'monospace', fontWeight: 600 }}>
            {record.username}
          </Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{record.fullName}</Text>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'volcano' : 'geekblue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Horario',
      key: 'schedule',
      width: 130,
      render: (_, record: User) => (
        <Text style={{ fontSize: 12, color: '#888' }}>
          {record.scheduleStart} – {record.scheduleEnd}
        </Text>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive: boolean, record: User) => (
        <Switch
          size="small"
          checked={isActive}
          onChange={(val) =>
            updateUser.mutate({ id: record.id, data: { isActive: val } })
          }
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record: User) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onResetPassword && (
            <Tooltip title="Restablecer contraseña">
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => onResetPassword(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="¿Desactivar usuario?"
            onConfirm={() => deleteUser.mutate(record.id)}
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
    />
  );
}
