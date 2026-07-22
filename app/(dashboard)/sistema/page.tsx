'use client';

import { useCallback, useState } from 'react';
import { Button } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/api';
import { useTickets } from '@/hooks/useTickets';
import { SistemaEntryPanel } from '@/components/sistema/SistemaEntryPanel';
import {
  SistemaTicketsTable,
  CreateClientFromTicketPayload,
} from '@/components/sistema/SistemaTicketsTable';
import { ScanTicketBar } from '@/components/tickets/ScanTicketBar';
import { ChargeTicketModal } from '@/components/tickets/ChargeTicketModal';
import { AdditionalChargeModal } from '@/components/tickets/AdditionalChargeModal';
import { ManualTicketModal } from '@/components/tickets/ManualTicketModal';
import { PostPaymentReceiptModal } from '@/components/tickets/PostPaymentReceiptModal';
import { TicketPrintModal } from '@/components/tickets/TicketPrintModal';
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SistemaPage() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: tickets = [], isLoading, isFetching, refetch } = useTickets(statusFilter);

  const [chargeTicket, setChargeTicket] = useState<Ticket | null>(null);
  const [addChargeTicket, setAddChargeTicket] = useState<Ticket | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [receiptTicket, setReceiptTicket] = useState<Ticket | null>(null);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientDefaults, setClientDefaults] = useState<CreateClientFromTicketPayload | null>(null);

  /** Handles the ticket resolved by the scanner bar. */
  const handleScanResult = useCallback(
    (ticket: Ticket, action: 'charge' | 'receipt') => {
      if (action === 'charge') {
        setChargeTicket(ticket);
      } else {
        setReceiptTicket(ticket);
      }
    },
    [],
  );

  const handleCreateClient = useCallback((payload: CreateClientFromTicketPayload) => {
    setClientDefaults(payload);
    setClientFormOpen(true);
  }, []);

  const handleCloseClientForm = useCallback(() => {
    setClientFormOpen(false);
    setClientDefaults(null);
  }, []);

  return (
    <>
      <PageHeader
        title="Sistema"
        subtitle="Ingreso, control y cobro de vehículos"
        extra={
          <Button icon={<FileAddOutlined />} onClick={() => setManualModalOpen(true)}>
            Ticket manual
          </Button>
        }
      />

      <SistemaEntryPanel onTicketCreated={() => refetch()} />

      {/* Scanner bar: handles both USB HID hardware scanner and manual code/plate input */}
      <ScanTicketBar onTicketFound={handleScanResult} />

      <SistemaTicketsTable
        tickets={tickets}
        loading={isLoading}
        isFetching={isFetching}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => refetch()}
        onCharge={setChargeTicket}
        onReceipt={setReceiptTicket}
        onAddCharge={setAddChargeTicket}
        onPrint={setPrintTicket}
        onDetail={setDetailTicket}
        onCreateClient={handleCreateClient}
      />

      <ChargeTicketModal
        ticket={chargeTicket}
        open={!!chargeTicket}
        onClose={() => setChargeTicket(null)}
      />

      <AdditionalChargeModal
        ticket={addChargeTicket}
        open={!!addChargeTicket}
        onClose={() => setAddChargeTicket(null)}
      />

      <ManualTicketModal open={manualModalOpen} onClose={() => setManualModalOpen(false)} />

      <PostPaymentReceiptModal
        ticket={receiptTicket}
        open={!!receiptTicket}
        onClose={() => setReceiptTicket(null)}
      />

      <TicketPrintModal
        ticket={printTicket}
        open={!!printTicket}
        onClose={() => setPrintTicket(null)}
      />

      <TicketDetailModal
        ticket={detailTicket}
        open={!!detailTicket}
        onClose={() => setDetailTicket(null)}
      />

      <ClientFormModal
        open={clientFormOpen}
        editing={null}
        defaults={clientDefaults}
        onClose={handleCloseClientForm}
      />
    </>
  );
}
