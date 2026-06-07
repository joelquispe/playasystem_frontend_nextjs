'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRoles } from '@/hooks/useRoles';
import { RoleEntity } from '@/types/api';
import { RoleTable } from '@/components/roles/RoleTable';
import { RoleFormModal } from '@/components/roles/RoleFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function RolesPage() {
  const { data: roles = [], isLoading, isFetching, refetch } = useRoles();
  const [editing, setEditing] = useState<RoleEntity | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleEdit = (role: RoleEntity) => {
    setEditing(role);
    setFormOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle={`${roles.length} roles registrados`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormOpen(true)}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Nuevo rol
            </Button>
          </Space>
        }
      />

      <RoleTable data={roles} loading={isLoading} onEdit={handleEdit} />

      <RoleFormModal open={formOpen} editing={editing} onClose={handleClose} />
    </>
  );
}
