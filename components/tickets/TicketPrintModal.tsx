'use client';

import { useRef } from 'react';
import { Button, Modal } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';

// Barcode is canvas-based — load client-side only
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

interface TicketPrintModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function TicketPrintModal({ ticket, open, onClose }: TicketPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!ticket) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open('', '_blank', 'width=340,height=600');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket ${ticket.ticketCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 8px 10px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: 900; margin: 6px 0; }
          .plate { font-size: 20px; font-weight: 900; letter-spacing: 3px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .small { font-size: 10px; }
          svg, img { display: block; margin: 0 auto; }
          ul { list-style: none; padding-left: 0; }
          li::before { content: "- "; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const rateLabel = RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType;
  const amount = parseFloat(ticket.rateAmount).toFixed(2);
  const entryTime = dayjs(ticket.entryTime);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      title={null}
      centered
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 0 } }}
    >
      {/* Print preview */}
      <div
        ref={printRef}
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 12,
          color: '#000',
          padding: '20px 24px',
          background: '#fff',
          lineHeight: 1.5,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>Playa ROSE</div>
          <div style={{ fontSize: 11 }}>Jirón Apurimac 378, Cercado de Lima.</div>
          <div style={{ fontSize: 11 }}>Telf.: 994221608</div>
        </div>

        <DashedDivider />

        {/* Ticket title */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1 }}>TICKET DE INGRESO</div>
          <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: 4, marginTop: 4 }}>
            {ticket.plate}
          </div>
          <div style={{ fontSize: 11, marginTop: 6 }}>
            Ingreso: {entryTime.format('DD/MM/YYYY')} - {entryTime.format('HH:mm:ss')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
            s/. {amount} - {rateLabel}
          </div>
          {ticket.vehicleType && (
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
              {ticket.vehicleType.name}
            </div>
          )}
        </div>

        <DashedDivider />

        {/* Barcode */}
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <Barcode
            value={ticket.ticketCode}
            width={1.6}
            height={55}
            fontSize={11}
            displayValue
            background="#fff"
            lineColor="#000"
          />
        </div>

        <DashedDivider />

        {/* Footer info */}
        <div style={{ fontSize: 10, textAlign: 'center', marginBottom: 6 }}>
          Tolerancia: 5 min. pasada la hora
        </div>
        <div style={{ fontSize: 10, marginBottom: 8 }}>
          <strong>Horario de Atención:</strong> Lun a Vie : 07:30am. - 10:00 pm.<br />
          Sab: 08:30 - 10:00pm. / Dom: 09:00am. - 09:00pm.
        </div>

        <DashedDivider />

        {/* Conditions */}
        <div style={{ fontSize: 10 }}>
          <strong>Condiciones</strong>
          <ul style={{ marginTop: 4, paddingLeft: 0, listStyle: 'none' }}>
            {[
              'Cuide y conserve su ticket, ya que acredita el ingreso de su vehículo y la salida del mismo.',
              'Indicar si desea boleta o Factura.',
              'El cliente responderá por los daños ocasionados a la playa de estacionamiento, a terceros y/o a sus bienes.',
            ].map((c, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                - {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '12px 24px 16px',
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

function DashedDivider() {
  return (
    <div
      style={{
        borderTop: '1px dashed #999',
        margin: '8px 0',
      }}
    />
  );
}
