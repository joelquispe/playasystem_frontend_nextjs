'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useVehiclesManage } from '@/hooks/useVehicles';
import { VehicleType } from '@/types/api';
import { VehicleTypeTable } from '@/components/vehicles/VehicleTypeTable';
import { VehicleTypeFormModal } from '@/components/vehicles/VehicleTypeFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading, isFetching, refetch } = useVehiclesManage();
  const [editing, setEditing] = useState<VehicleType | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleEdit = (vehicle: VehicleType) => {
    setEditing(vehicle);
    setFormOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Tipos de Vehículo"
        subtitle={`${vehicles.length} tipos registrados`}
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
              Nuevo tipo
            </Button>
          </Space>
        }
      />

      <VehicleTypeTable data={vehicles} loading={isLoading} onEdit={handleEdit} />

      <VehicleTypeFormModal open={formOpen} editing={editing} onClose={handleClose} />
    </>
  );
}
