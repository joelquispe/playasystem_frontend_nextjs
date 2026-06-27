/**
 * Scanner-related types for USB HID barcode / QR reader integration.
 */

/**
 * Possible states of the scan workflow.
 *
 * idle           → waiting for a scan
 * scanning       → HTTP request in-flight
 * found_pending  → ticket found, status = pending (ready to charge)
 * found_paid     → ticket found, already paid (can issue post-payment receipt)
 * found_manual   → ticket found, manual entry (can issue receipt)
 * found_cancelled → ticket found but cancelled
 * not_found      → 404 — unknown code
 * error          → network / server error
 */
export type ScanStatus =
  | 'idle'
  | 'scanning'
  | 'found_pending'
  | 'found_paid'
  | 'found_manual'
  | 'found_cancelled'
  | 'not_found'
  | 'error';

/**
 * Configuration for the `useBarcodeScanner` hook.
 */
export interface BarcodeScannerOptions {
  /** Called with the normalized scan code once a valid scan is detected. */
  onScan: (code: string) => void;
  /**
   * Whether the scanner hook is active.
   * @default true
   */
  enabled?: boolean;
  /**
   * Minimum code length required to trigger `onScan`.
   * Shorter buffers (accidental keystrokes) are discarded.
   * @default 3
   */
  minLength?: number;
  /**
   * Inactivity window (ms) after which the internal buffer is discarded.
   * Scanner chars arrive in < 5 ms; human typing is > 50 ms between keys.
   * @default 100
   */
  timeoutMs?: number;
  /**
   * When false (default), the hook ignores global keydown events while a
   * text input / textarea / select is focused to avoid interfering with
   * normal keyboard entry.
   *
   * Note: when the manual-code input inside ScanTicketBar is focused,
   * the scanner still works via that input's own `onPressEnter` handler.
   * @default false
   */
  captureWhenInputFocused?: boolean;
}
