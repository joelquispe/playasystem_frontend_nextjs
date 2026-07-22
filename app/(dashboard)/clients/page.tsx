'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/api';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ClientsPage() {
  const { data: clients = [], isLoading, isFetching, refetch } = useClients();
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
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
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Nuevo cliente
            </Button>
          </Space>
        }
      />

      <ClientTable
        data={clients}
        loading={isLoading}
        onEdit={handleEdit}
        onDetail={(c) => setDetailId(c.id)}
      />

      <ClientFormModal open={formOpen} editing={editing} onClose={handleCloseForm} />

      <ClientDetailModal
        clientId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
