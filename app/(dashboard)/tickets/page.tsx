'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Col,
  Empty,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  FileAddOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTickets } from '@/hooks/useTickets';
import { useVehicles } from '@/hooks/useVehicles';
import { Ticket } from '@/types/api';
import { TicketCard } from '@/components/tickets/TicketCard';
import { NewTicketDrawer } from '@/components/tickets/NewTicketDrawer';
import { ChargeTicketModal } from '@/components/tickets/ChargeTicketModal';
import { CancelTicketModal } from '@/components/tickets/CancelTicketModal';
import { AdditionalChargeModal } from '@/components/tickets/AdditionalChargeModal';
import { ManualTicketModal } from '@/components/tickets/ManualTicketModal';
import { PostPaymentReceiptModal } from '@/components/tickets/PostPaymentReceiptModal';
import { ScanTicketBar } from '@/components/tickets/ScanTicketBar';
import { PageHeader } from '@/components/ui/PageHeader';

const { Text } = Typography;

export default function TicketsPage() {
  const { data: tickets = [], isLoading, isFetching, refetch } = useTickets(true);
  const { data: vehicles = [] } = useVehicles();

  const [vehicleFilter, setVehicleFilter] = useState<string | undefined>(undefined);
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [chargeTicket, setChargeTicket] = useState<Ticket | null>(null);
  const [cancelTicket, setCancelTicket] = useState<Ticket | null>(null);
  const [addChargeTicket, setAddChargeTicket] = useState<Ticket | null>(null);
  const [receiptTicket, setReceiptTicket] = useState<Ticket | null>(null);

  const filtered = vehicleFilter
    ? tickets.filter((t) => t.vehicleTypeId === vehicleFilter)
    : tickets;

  const vehicleOptions = vehicles.map((v) => ({ label: v.name, value: v.id }));

  return (
    <>
      <PageHeader
        title="Tickets activos"
        subtitle={
          <Space size={8}>
            <Badge
              count={tickets.length}
              style={{ backgroundColor: '#db2777' }}
              showZero
            />
            <Text style={{ color: '#888', fontSize: 13 }}>
              {tickets.length === 1 ? 'vehículo en parqueo' : 'vehículos en parqueo'}
            </Text>
          </Space>
        }
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
              icon={<FileAddOutlined />}
              onClick={() => setManualModalOpen(true)}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
            >
              Manual
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setNewDrawerOpen(true)}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Nuevo ticket
            </Button>
          </Space>
        }
      />

      <ScanTicketBar
        onTicketFound={(ticket, action) => {
          if (action === 'charge') setChargeTicket(ticket);
          else setReceiptTicket(ticket);
        }}
      />

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 13 }}>Filtrar por tipo:</Text>
        <Select
          allowClear
          placeholder="Todos los vehículos"
          value={vehicleFilter}
          onChange={setVehicleFilter}
          options={vehicleOptions}
          style={{ width: 200 }}
          size="small"
        />
        {vehicleFilter && (
          <Tag
            closable
            onClose={() => setVehicleFilter(undefined)}
            style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', color: '#bbb' }}
          >
            {vehicles.find((v) => v.id === vehicleFilter)?.name}
          </Tag>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6} xl={6}>
              <Skeleton
                active
                style={{ background: '#1a1a1a', borderRadius: 12, padding: 16 }}
              />
            </Col>
          ))}
        </Row>
      ) : filtered.length === 0 ? (
        <Empty
          description={
            <Text style={{ color: '#666' }}>
              {vehicleFilter ? 'No hay tickets para ese tipo de vehículo' : 'No hay tickets activos'}
            </Text>
          }
          style={{ marginTop: 80 }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((ticket) => (
            <Col key={ticket.id} xs={24} sm={12} md={8} lg={6} xl={6}>
              <TicketCard
                ticket={ticket}
                onCharge={setChargeTicket}
                onCancel={setCancelTicket}
                onAddCharge={setAddChargeTicket}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Modals & Drawer */}
      <NewTicketDrawer
        open={newDrawerOpen}
        onClose={() => setNewDrawerOpen(false)}
      />

      <ManualTicketModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />

      <ChargeTicketModal
        ticket={chargeTicket}
        open={!!chargeTicket}
        onClose={() => setChargeTicket(null)}
      />

      <CancelTicketModal
        ticket={cancelTicket}
        open={!!cancelTicket}
        onClose={() => setCancelTicket(null)}
      />

      <AdditionalChargeModal
        ticket={addChargeTicket}
        open={!!addChargeTicket}
        onClose={() => setAddChargeTicket(null)}
      />

      <PostPaymentReceiptModal
        ticket={receiptTicket}
        open={!!receiptTicket}
        onClose={() => setReceiptTicket(null)}
      />
    </>
  );
}
