'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUsers } from '@/hooks/useUsers';
import { User } from '@/types/api';
import { UserTable } from '@/components/users/UserTable';
import { UserFormModal } from '@/components/users/UserFormModal';
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function UsersPage() {
  const { data: users = [], isLoading, isFetching, refetch } = useUsers();
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} usuarios registrados`}
        extra={
          <Space>
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
              onClick={() => setFormOpen(true)}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Nuevo usuario
            </Button>
          </Space>
        }
      />

      <UserTable
        data={users}
        loading={isLoading}
        onEdit={handleEdit}
        onResetPassword={setResetUser}
      />

      <UserFormModal open={formOpen} editing={editing} onClose={handleClose} />

      <ResetPasswordModal
        user={resetUser}
        open={!!resetUser}
        onClose={() => setResetUser(null)}
      />
    </>
  );
}
