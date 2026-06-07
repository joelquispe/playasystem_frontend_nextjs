'use client';

import { useState } from 'react';
import { Button, Space } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/api';
import { useTickets } from '@/hooks/useTickets';
import { SistemaEntryPanel } from '@/components/sistema/SistemaEntryPanel';
import { SistemaTicketsTable } from '@/components/sistema/SistemaTicketsTable';
import { ChargeTicketModal } from '@/components/tickets/ChargeTicketModal';
import { AdditionalChargeModal } from '@/components/tickets/AdditionalChargeModal';
import { ManualTicketModal } from '@/components/tickets/ManualTicketModal';
import { PostPaymentReceiptModal } from '@/components/tickets/PostPaymentReceiptModal';
import { TicketPrintModal } from '@/components/tickets/TicketPrintModal';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SistemaPage() {
  const { data: tickets = [], isLoading, isFetching, refetch } = useTickets();

  const [chargeTicket, setChargeTicket] = useState<Ticket | null>(null);
  const [addChargeTicket, setAddChargeTicket] = useState<Ticket | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [receiptTicket, setReceiptTicket] = useState<Ticket | null>(null);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);

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

      <SistemaTicketsTable
        tickets={tickets}
        loading={isLoading}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        onCharge={setChargeTicket}
        onReceipt={setReceiptTicket}
        onAddCharge={setAddChargeTicket}
        onPrint={setPrintTicket}
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
    </>
  );
}
