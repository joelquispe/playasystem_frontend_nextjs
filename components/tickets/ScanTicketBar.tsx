'use client';

import { useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { BarcodeOutlined, SearchOutlined } from '@ant-design/icons';
import { Ticket } from '@/types/api';
import { useScanTicket } from '@/hooks/useTickets';
import { ticketsService } from '@/services/tickets.service';

const { Text } = Typography;

interface ScanTicketBarProps {
  onTicketFound: (ticket: Ticket, action: 'charge' | 'receipt') => void;
}

export function ScanTicketBar({ onTicketFound }: ScanTicketBarProps) {
  const [code, setCode] = useState('');
  const [plate, setPlate] = useState('');
  const scanTicket = useScanTicket();

  const handleScan = async () => {
    if (!code.trim()) return;
    const ticket = await scanTicket.mutateAsync(code.trim());
    if (ticket.status === 'pending') {
      onTicketFound(ticket, 'charge');
    } else if (ticket.status === 'paid' || ticket.status === 'manual') {
      onTicketFound(ticket, 'receipt');
    } else {
      onTicketFound(ticket, 'charge');
    }
    setCode('');
  };

  const handlePlateSearch = async () => {
    if (!plate.trim()) return;
    const tickets = await ticketsService.getTicketsByPlate(plate.trim());
    const paid = tickets.find((t) => t.status === 'paid' || t.status === 'manual');
    if (paid) {
      onTicketFound(paid, 'receipt');
    } else {
      const pending = tickets.find((t) => t.status === 'pending');
      if (pending) onTicketFound(pending, 'charge');
    }
    setPlate('');
  };

  return (
    <div
      style={{
        background: '#fbf7f2',
        border: '1px solid #d9cfc4',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <Text style={{ fontSize: 11, color: '#65767d', display: 'block', marginBottom: 4 }}>
          Escanear ticket (QR / código)
        </Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<BarcodeOutlined />}
            placeholder="Código del ticket..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onPressEnter={handleScan}
            size="large"
          />
          <Button
            type="primary"
            loading={scanTicket.isPending}
            onClick={handleScan}
          >
            Cobrar
          </Button>
        </Space.Compact>
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <Text style={{ fontSize: 11, color: '#65767d', display: 'block', marginBottom: 4 }}>
          Comprobante post-pago (por placa)
        </Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Placa..."
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            onPressEnter={handlePlateSearch}
            size="large"
            style={{ fontFamily: 'monospace' }}
          />
          <Button onClick={handlePlateSearch}>Buscar</Button>
        </Space.Compact>
      </div>
    </div>
  );
}
