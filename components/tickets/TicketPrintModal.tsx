'use client';

import { useRef } from 'react';
import { Button, Modal } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { generateQrSvg } from '@/lib/qr';

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
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .small { font-size: 10px; }
          .qr svg { display: block; margin: 0 auto; width: 120px; height: 120px; }
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
  const qrSvg = generateQrSvg(ticket.ticketCode);

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
          padding: '16px 24px',
          background: '#fff',
          lineHeight: 1.4,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1 }}>Playa ROSE</div>
          <div style={{ fontSize: 11 }}>Jirón Apurimac 378, Cercado de Lima.</div>
          <div style={{ fontSize: 11 }}>Telf.: 994221608</div>
        </div>

        <DashedDivider />

        {/* Ticket title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>TICKET DE INGRESO</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, marginTop: 2 }}>
            {ticket.plate}
          </div>
          <div style={{ fontSize: 11, marginTop: 3 }}>
            Ingreso: {entryTime.format('DD/MM/YYYY')} - {entryTime.format('HH:mm:ss')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>
            s/. {amount} - {rateLabel}
          </div>
          {ticket.vehicleType && (
            <div style={{ fontSize: 11, color: '#444' }}>
              {ticket.vehicleType.name}
            </div>
          )}
        </div>

        <DashedDivider />

        {/* QR code */}
        <div
          className="qr"
          style={{ textAlign: 'center', margin: '4px 0' }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>
          {ticket.ticketCode}
        </div>

        <DashedDivider />

        {/* Footer info */}
        <div style={{ fontSize: 10 }}>
          <strong>Horario:</strong> Lun-Vie 07:30am-10:00pm · Sáb 08:30-10:00pm · Dom 09:00am-09:00pm.<br />
          Tolerancia: 5 min. pasada la hora.
        </div>

        <DashedDivider />

        {/* Conditions */}
        <div style={{ fontSize: 10 }}>
          <strong>Condiciones</strong>
          <ul style={{ marginTop: 2, paddingLeft: 0, listStyle: 'none' }}>
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
