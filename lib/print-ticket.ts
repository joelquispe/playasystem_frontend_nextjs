import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { generateQrSvg } from '@/lib/qr';
import dayjs from 'dayjs';

/**
 * Thermal receipt layout for POS-D TP 300 PRO:
 * - Paper width: 80 mm
 * - Printable column: 72 mm
 * Printing goes through the OS driver (ESC/POS) via the browser dialog —
 * no raw ESC/POS bridge is required when the official Windows driver is installed.
 */
const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.35;
    /* Stay inside the 72 mm printable column */
    padding: 2mm 4mm 6mm;
    width: 80mm;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .divider {
    border: 0;
    border-top: 1px dashed #000;
    margin: 4px 0;
  }
  .small { font-size: 10px; }
  .brand { font-size: 17px; font-weight: 900; letter-spacing: 1px; }
  .title { font-size: 14px; font-weight: 900; letter-spacing: 1px; }
  .plate { font-size: 18px; font-weight: 900; letter-spacing: 4px; margin-top: 2px; }
  .amount { font-size: 12px; font-weight: 700; margin-top: 1px; }
  .code { font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
  ul { list-style: none; padding-left: 0; margin-top: 2px; }
  li { margin-bottom: 2px; }
  li::before { content: "- "; }
  .qr svg {
    display: block;
    margin: 0 auto;
    width: 28mm;
    height: 28mm;
  }
  @page {
    size: 80mm auto;
    margin: 0;
  }
  @media print {
    html, body {
      width: 80mm;
      margin: 0;
      padding: 0;
    }
    body {
      padding: 2mm 4mm 8mm;
    }
  }
`;

/** Builds the receipt HTML body (no document chrome) for a ticket. */
export function buildTicketReceiptBody(ticket: Ticket): string {
  const rateLabel = RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType;
  const amount = parseFloat(ticket.rateAmount).toFixed(2);
  const entryTime = dayjs(ticket.entryTime);
  const qrSvg = generateQrSvg(ticket.ticketCode);

  return `
  <div class="center">
    <div class="brand">Playa ROSE</div>
    <div class="small">Jirón Apurimac 378, Cercado de Lima.</div>
    <div class="small">Telf.: 994221608</div>
  </div>

  <hr class="divider" />

  <div class="center">
    <div class="title">TICKET DE INGRESO</div>
    <div class="plate">${escapeHtml(ticket.plate)}</div>
    <div class="small" style="margin-top:3px">
      Ingreso: ${entryTime.format('DD/MM/YYYY')} - ${entryTime.format('HH:mm:ss')}
    </div>
    <div class="amount">s/. ${amount} - ${escapeHtml(rateLabel)}</div>
    ${
      ticket.vehicleType
        ? `<div class="small" style="color:#444">${escapeHtml(ticket.vehicleType.name)}</div>`
        : ''
    }
  </div>

  <hr class="divider" />

  <div class="center qr" style="margin:4px 0">
    ${qrSvg}
    <div class="code">${escapeHtml(ticket.ticketCode)}</div>
  </div>

  <hr class="divider" />

  <div class="small">
    <strong>Horario:</strong> Lun-Vie 07:30am-10:00pm · Sáb 08:30-10:00pm · Dom 09:00am-09:00pm.<br/>
    Tolerancia: 5 min. pasada la hora.
  </div>

  <hr class="divider" />

  <div class="small">
    <strong>Condiciones</strong>
    <ul>
      <li>Cuide y conserve su ticket, ya que acredita el ingreso de su vehículo y la salida del mismo.</li>
      <li>Indicar si desea boleta o Factura.</li>
      <li>El cliente responderá por los daños ocasionados a la playa de estacionamiento, a terceros y/o a sus bienes.</li>
    </ul>
  </div>`;
}

/** Full printable HTML document for TP 300 PRO (80 mm). */
export function buildTicketPrintDocument(ticket: Ticket): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket ${escapeHtml(ticket.ticketCode)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${buildTicketReceiptBody(ticket)}
  <script>
    window.onload = function () {
      window.focus();
      setTimeout(function () {
        window.print();
      }, 50);
    };
    window.onafterprint = function () {
      window.close();
    };
  <\/script>
</body>
</html>`;
}

/**
 * Opens the OS print dialog for the ticket (TP 300 PRO via installed driver).
 * Prefer selecting paper size 80 mm / "Ticket" / "Receipt" in the print dialog.
 */
export function printTicketDirectly(ticket: Ticket): void {
  const html = buildTicketPrintDocument(ticket);
  const win = window.open('', '_blank', 'width=320,height=640');
  if (!win) {
    console.warn('No se pudo abrir la ventana de impresión (¿popup bloqueado?)');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
