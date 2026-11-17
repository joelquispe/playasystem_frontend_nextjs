'use client';

import { Button, Modal } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/api';
import {
  buildTicketReceiptBody,
  printTicketDirectly,
} from '@/lib/print-ticket';

interface TicketPrintModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

/** Preview + print for POS-D TP 300 PRO (80 mm thermal via OS driver). */
export function TicketPrintModal({ ticket, open, onClose }: TicketPrintModalProps) {
  if (!ticket) return null;

  const handlePrint = () => {
    printTicketDirectly(ticket);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={360}
      title={null}
      centered
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 0 } }}
    >
      {/* On-screen preview (same markup as the printer document) */}
      <div
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 12,
          color: '#000',
          padding: '16px 20px',
          background: '#fff',
          lineHeight: 1.35,
          maxWidth: '80mm',
          margin: '0 auto',
        }}
        dangerouslySetInnerHTML={{ __html: buildTicketReceiptBody(ticket) }}
      />

      <div
        style={{
          padding: '12px 20px 16px',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ background: '#2f6d73', borderColor: '#2f6d73' }}
        >
          Imprimir
        </Button>
      </div>
    </Modal>
  );
}
