'use client';

import { useEffect, useRef } from 'react';
import type { BarcodeScannerOptions } from '@/types/scanner';

/** Milliseconds before the same code can be re-processed. */
const DEDUP_MS = 1_500;

/**
 * Returns true when a focusable input-like element currently has focus,
 * meaning normal keyboard input should not be intercepted.
 */
function isInteractiveElementFocused(): boolean {
  const el = document.activeElement;
  if (!el || el === document.body) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * Returns true for keys that produce a single visible character.
 * Rejects Ctrl/Alt/Meta combos and non-printable keys (F-keys, Arrows, etc.).
 */
function isCapturableKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey) return false;
  return e.key.length === 1;
}

/**
 * Captures input from a USB HID barcode / QR scanner operating in
 * keyboard-emulation mode (HID Keyboard, Enter suffix, no prefix).
 *
 * The scanner fires keydown events very quickly (< 5 ms per char) and
 * terminates with an Enter key. This hook accumulates those chars in a
 * buffer and invokes `onScan` when Enter arrives.
 *
 * De-duplication: the same code is ignored for `DEDUP_MS` (1.5 s) to
 * prevent accidental double-reads.
 *
 * When `captureWhenInputFocused` is false (default) the hook is silent
 * while any text input / textarea / select is focused, so it never
 * interferes with normal keyboard entry. The manual-code input inside
 * `ScanTicketBar` handles the scanner via its own `onPressEnter`.
 *
 * Usage:
 * ```ts
 * useBarcodeScanner({ onScan: (code) => fetchTicket(code) });
 * ```
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  timeoutMs = 100,
  captureWhenInputFocused = false,
}: BarcodeScannerOptions): void {
  // Accumulator for incoming characters
  const bufferRef = useRef('');
  // Timer that discards the buffer after inactivity
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dedup tracking
  const lastCodeRef = useRef('');
  const lastCodeTimeRef = useRef(0);
  // Processing lock: prevents concurrent or double firing
  const isLockedRef = useRef(false);

  // Keep onScan fresh without re-registering the global listener on each render
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function resetBuffer() {
      bufferRef.current = '';
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!captureWhenInputFocused && isInteractiveElementFocused()) {
        // Let the focused input handle the event natively
        return;
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim().replace(/[\r\n]/g, '');
        resetBuffer();

        if (code.length < minLength) return;

        // Dedup: ignore the same code received within DEDUP_MS
        const now = Date.now();
        if (code === lastCodeRef.current && now - lastCodeTimeRef.current < DEDUP_MS) {
          return;
        }

        // Processing lock: prevent firing onScan while a previous scan is
        // still pending (e.g., waiting for the HTTP response)
        if (isLockedRef.current) return;

        isLockedRef.current = true;
        lastCodeRef.current = code;
        lastCodeTimeRef.current = now;

        onScanRef.current(code);

        // Release the lock after the dedup window so a new scan can proceed
        setTimeout(() => {
          isLockedRef.current = false;
        }, DEDUP_MS);

        return;
      }

      if (!isCapturableKey(e)) return;

      bufferRef.current += e.key;

      // Restart the inactivity timer on each incoming char
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(resetBuffer, timeoutMs);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [enabled, minLength, timeoutMs, captureWhenInputFocused]);
  // NOTE: onScan is intentionally excluded — kept fresh via onScanRef above.
}
