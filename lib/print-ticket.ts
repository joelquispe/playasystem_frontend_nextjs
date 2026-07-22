import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import { generateQrSvg } from '@/lib/qr';
import dayjs from 'dayjs';

/**
 * Directly opens a browser print dialog for the given ticket.
 * No preview modal — the popup window auto-prints and closes.
 */
export function printTicketDirectly(ticket: Ticket): void {
  const rateLabel = RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType;
  const amount = parseFloat(ticket.rateAmount).toFixed(2);
  const entryTime = dayjs(ticket.entryTime);
  const qrSvg = generateQrSvg(ticket.ticketCode);

  const html = `<!DOCTYPE html>
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
      padding: 6px 10px;
      color: #000;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .small  { font-size: 10px; }
    ul { list-style: none; padding-left: 0; }
    li::before { content: "- "; }
    .qr svg { display: block; margin: 0 auto; width: 120px; height: 120px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center">
    <div style="font-size:17px;font-weight:900;letter-spacing:1px">Playa ROSE</div>
    <div class="small">Jirón Apurimac 378, Cercado de Lima.</div>
    <div class="small">Telf.: 994221608</div>
  </div>

  <div class="divider"></div>

  <!-- Ticket title -->
  <div class="center">
    <div style="font-size:14px;font-weight:900;letter-spacing:1px">TICKET DE INGRESO</div>
    <div style="font-size:18px;font-weight:900;letter-spacing:4px;margin-top:2px">${ticket.plate}</div>
    <div class="small" style="margin-top:3px">
      Ingreso: ${entryTime.format('DD/MM/YYYY')} - ${entryTime.format('HH:mm:ss')}
    </div>
    <div style="font-size:12px;font-weight:700;margin-top:1px">
      s/. ${amount} - ${rateLabel}
    </div>
    ${ticket.vehicleType ? `<div class="small" style="color:#444">${ticket.vehicleType.name}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- QR code -->
  <div class="center qr" style="margin:4px 0">
    ${qrSvg}
    <div class="small bold" style="margin-top:2px;letter-spacing:1px">${ticket.ticketCode}</div>
  </div>

  <div class="divider"></div>

  <div class="small">
    <strong>Horario:</strong> Lun-Vie 07:30am-10:00pm · Sáb 08:30-10:00pm · Dom 09:00am-09:00pm.<br/>
    Tolerancia: 5 min. pasada la hora.
  </div>

  <div class="divider"></div>

  <div class="small">
    <strong>Condiciones</strong>
    <ul style="margin-top:2px">
      <li style="margin-bottom:2px">Cuide y conserve su ticket, ya que acredita el ingreso de su vehículo y la salida del mismo.</li>
      <li style="margin-bottom:2px">Indicar si desea boleta o Factura.</li>
      <li style="margin-bottom:2px">El cliente responderá por los daños ocasionados a la playa de estacionamiento, a terceros y/o a sus bienes.</li>
    </ul>
  </div>

  <script>window.onload = function(){ window.print(); window.close(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=340,height=620');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
