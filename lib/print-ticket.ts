import { Ticket } from '@/types/api';
import { RATE_TYPE_LABELS } from '@/lib/constants';
import dayjs from 'dayjs';

/**
 * Directly opens a browser print dialog for the given ticket.
 * No preview modal — the popup window auto-prints and closes.
 */
export function printTicketDirectly(ticket: Ticket): void {
  const rateLabel = RATE_TYPE_LABELS[ticket.rateType] ?? ticket.rateType;
  const amount = parseFloat(ticket.rateAmount).toFixed(2);
  const entryTime = dayjs(ticket.entryTime);

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
      padding: 8px 10px;
      color: #000;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .small  { font-size: 10px; }
    ul { list-style: none; padding-left: 0; }
    li::before { content: "- "; }
    .code {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      letter-spacing: 2px;
      border: 1px solid #000;
      padding: 4px 8px;
      display: inline-block;
      margin: 6px 0;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center" style="margin-bottom:8px">
    <div style="font-size:18px;font-weight:900;letter-spacing:1px">Playa ROSE</div>
    <div class="small">Jirón Apurimac 378, Cercado de Lima.</div>
    <div class="small">Telf.: 994221608</div>
  </div>

  <div class="divider"></div>

  <!-- Ticket title -->
  <div class="center" style="margin-bottom:8px">
    <div style="font-size:15px;font-weight:900;letter-spacing:1px">TICKET DE INGRESO</div>
    <div style="font-size:19px;font-weight:900;letter-spacing:4px;margin-top:4px">${ticket.plate}</div>
    <div class="small" style="margin-top:6px">
      Ingreso: ${entryTime.format('DD/MM/YYYY')} - ${entryTime.format('HH:mm:ss')}
    </div>
    <div style="font-size:12px;font-weight:700;margin-top:2px">
      s/. ${amount} - ${rateLabel}
    </div>
    ${ticket.vehicleType ? `<div class="small" style="color:#444;margin-top:2px">${ticket.vehicleType.name}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Ticket code (replaces barcode for direct print) -->
  <div class="center" style="margin:10px 0">
    <div class="small">Código de ticket</div>
    <div class="code">${ticket.ticketCode}</div>
  </div>

  <div class="divider"></div>

  <div class="small center" style="margin-bottom:6px">
    Tolerancia: 5 min. pasada la hora
  </div>
  <div class="small" style="margin-bottom:8px">
    <strong>Horario de Atención:</strong> Lun a Vie : 07:30am. - 10:00 pm.<br/>
    Sab: 08:30 - 10:00pm. / Dom: 09:00am. - 09:00pm.
  </div>

  <div class="divider"></div>

  <div class="small">
    <strong>Condiciones</strong>
    <ul style="margin-top:4px">
      <li style="margin-bottom:3px">Cuide y conserve su ticket, ya que acredita el ingreso de su vehículo y la salida del mismo.</li>
      <li style="margin-bottom:3px">Indicar si desea boleta o Factura.</li>
      <li style="margin-bottom:3px">El cliente responderá por los daños ocasionados a la playa de estacionamiento, a terceros y/o a sus bienes.</li>
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
