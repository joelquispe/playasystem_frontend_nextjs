'use client';

import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/** Prefetches current shift on login so the turno opens before the cashier works. */
export function CashierShiftBootstrap() {
  useCashierWorkflow();
  return null;
}
