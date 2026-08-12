'use client';

import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/** Prefetches attendance + current caja state (does not open a shift). */
export function CashierShiftBootstrap() {
  useCashierWorkflow();
  return null;
}
