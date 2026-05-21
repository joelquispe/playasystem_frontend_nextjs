'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/api';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ClientsPage() {
  const { data: clients = [], isLoading, isFetching, refetch } = useClients();
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} registros`}
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
              Nuevo cliente
            </Button>
          </Space>
        }
      />

      <ClientTable data={clients} loading={isLoading} onEdit={handleEdit} />

      <ClientFormModal open={formOpen} editing={editing} onClose={handleClose} />
    </>
  );
}
