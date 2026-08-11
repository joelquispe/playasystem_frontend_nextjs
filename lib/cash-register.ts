import { CashRegister } from '@/types/api';

/** Shift with no payments, expenses or cancellations — caja did not operate. */
export function isShiftIdle(shift: CashRegister | null | undefined): boolean {
  if (!shift) return true;
  const total = parseFloat(shift.totalAmount) || 0;
  const expenses = parseFloat(shift.extraExpenses) || 0;
  return total === 0 && expenses === 0 && shift.cancellationsCount === 0;
}

export const IDLE_SHIFT_CLOSE_NOTES = 'Cierre automático — caja sin actividad';
