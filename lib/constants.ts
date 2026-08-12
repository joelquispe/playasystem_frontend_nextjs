export const AUTH_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';

export const QUERY_KEYS = {
  TICKETS: ['tickets'] as const,
  TICKET: (id: string) => ['tickets', id] as const,
  PENDING_TICKETS: ['tickets', 'status', 'pending'] as const,
  TICKETS_BY_STATUS: (status: string) => ['tickets', 'status', status] as const,
  CLIENTS: ['clients'] as const,
  CLIENT: (id: string) => ['clients', id] as const,
  CLIENT_BY_PLATE: (plate: string) => ['clients', 'plate', plate] as const,
  CLIENT_EVENTS: (id: string, filters?: { date?: string; eventColor?: string }) =>
    ['clients', id, 'events', filters?.date ?? 'all', filters?.eventColor ?? 'all'] as const,
  VEHICLES: ['vehicles'] as const,
  VEHICLES_MANAGE: ['vehicles', 'manage'] as const,
  VEHICLE: (id: string) => ['vehicles', id] as const,
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
  REPORTS_ATTENDANCE: (params: Record<string, unknown>) =>
    ['reports', 'attendance', params] as const,
  REPORTS_CASH_REGISTER: (params: Record<string, unknown>) =>
    ['reports', 'cash-register', params] as const,
  REPORTS_DAILY_SUMMARY: (params: Record<string, unknown>) =>
    ['reports', 'daily-summary', params] as const,
  USERS: ['users'] as const,
  USER: (id: string) => ['users', id] as const,
  ATTENDANCE_TODAY: ['attendance', 'me', 'today'] as const,
  ATTENDANCE_HISTORY: (params: Record<string, unknown>) =>
    ['attendance', 'me', 'history', params] as const,
  ATTENDANCE: (params: Record<string, unknown>) =>
    ['attendance', 'list', params] as const,
  ATTENDANCE_SUMMARY: (params: Record<string, unknown>) =>
    ['attendance', 'summary', params] as const,
  ATTENDANCE_SCHEDULES: ['attendance', 'schedules'] as const,
  ATTENDANCE_SCHEDULE: (id: string) => ['attendance', 'schedules', id] as const,
  ATTENDANCE_DETAIL: (id: string) => ['attendance', id] as const,
  PLATE_EVENTS: (plate: string) => ['events', plate] as const,
  SYSTEM_CONFIG: ['system-config'] as const,
  SUBSCRIBERS: (status?: string) => ['subscribers', status] as const,
  ROLES: ['roles'] as const,
  ROLE: (id: string) => ['roles', id] as const,
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
  cancelled: 'Anulado',
  manual: 'Manual',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PRESENT: 'A tiempo',
  LATE: 'Tarde',
  ABSENT: 'Ausente',
  INCOMPLETE: 'Sin salida',
  JUSTIFIED: 'Justificado',
  DAY_OFF: 'Día libre',
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
