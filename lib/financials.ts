import type { CashRegister, FinancialTotals } from '@/types/api';

/** Etiquetas oficiales: usar las mismas en todas las pantallas. */
export const FINANCIAL_LABELS = {
  grossIncome: 'Ingreso Bruto',
  discounts: 'Descuentos',
  expenses: 'Gastos de caja',
  netExpenses: 'Egresos Netos',
  netIncome: 'Ingresos Netos',
  netIncomeDay: 'Ingresos Netos del Día',
  cancellations: 'Anulados',
  /** Cobrado (todos los medios) − gastos: lo que debe rendir el turno. */
  cashTotal: 'Total en caja',
} as const;

const round2 = (value: number): number => Math.round(value * 100) / 100;

type ShiftAmounts = Pick<
  CashRegister,
  | 'cashAmount'
  | 'yapeAmount'
  | 'plinAmount'
  | 'cardAmount'
  | 'discountsTotal'
  | 'extraExpenses'
  | 'cancellationsTotal'
  | 'cancellationsCount'
>;

/**
 * Same formulas as the backend `calculateFinancialTotals`, for a single shift.
 * Discounts and expenses are subtracted exactly once:
 * Ingreso Neto = (cobrado + descuentos) − (descuentos + gastos).
 */
export function calculateShiftFinancials(shift: ShiftAmounts): FinancialTotals {
  const cash = Number(shift.cashAmount);
  const yape = Number(shift.yapeAmount);
  const plin = Number(shift.plinAmount);
  const card = Number(shift.cardAmount);
  const discounts = Number(shift.discountsTotal);
  const expenses = Number(shift.extraExpenses);

  const collected = cash + yape + plin + card;
  const grossIncome = collected + discounts;
  const netExpenses = discounts + expenses;

  return {
    grossIncome: round2(grossIncome),
    collected: round2(collected),
    discounts: round2(discounts),
    expenses: round2(expenses),
    netExpenses: round2(netExpenses),
    netIncome: round2(grossIncome - netExpenses),
    cancellationsAmount: round2(Number(shift.cancellationsTotal)),
    cancellationsCount: Number(shift.cancellationsCount),
    byPaymentMethod: { cash, yape, plin, card },
  };
}

/** Formats an amount as `s/. 0.00`. */
export function formatMoney(value: number | string): string {
  return `s/. ${Number(value).toFixed(2)}`;
}
