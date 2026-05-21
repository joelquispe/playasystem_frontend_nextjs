export const AUTH_TOKEN_KEY = 'access_token';
export const USER_KEY = 'user';

export const QUERY_KEYS = {
  TICKETS: ['tickets'] as const,
  TICKET: (id: string) => ['tickets', id] as const,
  PENDING_TICKETS: ['tickets', 'pending'] as const,
  CLIENTS: ['clients'] as const,
  CLIENT: (id: string) => ['clients', id] as const,
  VEHICLES: ['vehicles'] as const,
  RATES: (vehicleTypeId?: string, rateType?: string) =>
    ['rates', vehicleTypeId, rateType] as const,
  CASH_REGISTER_CURRENT: ['cash-register', 'current'] as const,
  CASH_REGISTER: (id: string) => ['cash-register', id] as const,
  REPORTS_DASHBOARD: (year: number, month: number) =>
    ['reports', 'dashboard', year, month] as const,
  REPORTS_MONTHLY: (year: number, month: number) =>
    ['reports', 'monthly', year, month] as const,
  REPORTS_DAILY: (cashierId: string, date: string) =>
    ['reports', 'daily', cashierId, date] as const,
  USERS: ['users'] as const,
  USER: (id: string) => ['users', id] as const,
  ATTENDANCE: (params: Record<string, unknown>) =>
    ['attendance', params] as const,
  ATTENDANCE_SUMMARY: (params: Record<string, unknown>) =>
    ['attendance', 'summary', params] as const,
  PLATE_EVENTS: (plate: string) => ['events', plate] as const,
  SYSTEM_CONFIG: ['system-config'] as const,
  SUBSCRIBERS: (status?: string) => ['subscribers', status] as const,
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  card: 'Tarjeta',
};

export const RATE_TYPE_LABELS: Record<string, string> = {
  hour_fraction: 'Hora o Fracción',
  overnight: 'Amanecida',
  flat: 'Tarifa Plana',
  subscriber: 'Abonado',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  manual: 'Manual',
};

export const RECEIPT_TYPE_LABELS: Record<string, string> = {
  vale: 'Vale',
  boleta: 'Boleta',
  factura: 'Factura',
};

export const SUBSCRIBER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expired: 'Vencido',
  cancelled: 'Cancelado',
};

export const EVENT_COLOR_LABELS: Record<string, string> = {
  white: 'Normal',
  green: 'Amable',
  red: 'Alerta',
};
