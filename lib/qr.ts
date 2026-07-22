import qrcode from 'qrcode-generator';

/**
 * Generates a scannable QR code as an inline SVG markup string.
 * Synchronous — safe to use both in React components and in
 * raw HTML strings built for direct-print popup windows.
 */
export function generateQrSvg(text: string, cellSize = 4, margin = 2): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  // `scalable` omits fixed width/height so the SVG can be resized via CSS
  // (necessary since it's rendered inside a raw HTML string for printing).
  return qr.createSvgTag({ cellSize, margin, scalable: true });
}
