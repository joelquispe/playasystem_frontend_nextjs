// ─── Enums ───────────────────────────────────────────────────────────────────

export type RoleSlug = 'admin' | 'cashier';
/** @deprecated Use RoleSlug — kept for backward compatibility */
export type Role = RoleSlug;

export interface RoleEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type TicketStatus = 'pending' | 'paid' | 'cancelled' | 'manual';
export type RateType = 'hour_fraction' | 'overnight' | 'flat' | 'subscriber';
export type PaymentMethod = 'cash' | 'yape' | 'plin' | 'card';
export type ReceiptType = 'vale' | 'boleta' | 'factura';
export type EventColor = 'white' | 'green' | 'red';
export type AttendanceStatus =
  | 'PENDING'
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'INCOMPLETE'
  | 'JUSTIFIED'
  | 'DAY_OFF';
export type BalanceStatus = 'balanced' | 'unbalanced';
export type SubscriberStatus = 'active' | 'expired' | 'cancelled';

// ─── Response Envelope ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: string[];
}

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  /** Slug on login; nested RoleEntity on list/detail */
  role: RoleSlug | RoleEntity;
  roleDetail?: RoleEntity;
  scheduleStart?: string;
  scheduleEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleType {
  id: string;
  key: string;
  name: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  rates?: Rate[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Rate {
  id: string;
  vehicleTypeId: string | null;
  vehicleType: VehicleType | null;
  rateType: RateType;
  amount: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Client {
  id: string;
  plate: string;
  vehicleTypeId: string | null;
  vehicleType: VehicleType | null;
  fullName: string;
  phone: string | null;
  dni: string | null;
  specialRate: string;
  eventColor: EventColor;
  notes: string | null;
  isActive: boolean;
}

export interface TicketCharge {
  id: string;
  ticketId: string;
  chargeType: 'overnight' | 'hour_fraction';
  amount: string;
  notes: string | null;
  appliedById: string;
  appliedAt: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  plate: string;
  vehicleTypeId: string;
  vehicleType: VehicleType;
  cashierId: string;
  cashier: Pick<User, 'id' | 'username' | 'fullName'>;
  status: TicketStatus;
  rateType: RateType;
  rateAmount: string;
  entryTime: string;
  exitTime: string | null;
  totalMinutes: number | null;
  totalAmount: string;
  discount: string;
  discountObservation: string | null;
  finalAmount: string;
  paymentMethod: PaymentMethod | null;
  receiptType: ReceiptType;
  receiptNumber: string | null;
  customerDni: string | null;
  customerRuc: string | null;
  customerBusinessName: string | null;
  customerCommercialName: string | null;
  customerFirstName: string | null;
  customerPaternalSurname: string | null;
  customerMaternalSurname: string | null;
  customerVerifyCode: string | null;
  customerAddress: string | null;
  customerDepartment: string | null;
  customerProvince: string | null;
  customerDistrict: string | null;
  customerUbigeo: string | null;
  customerPhones: string | null;
  customerTaxStatus: string | null;
  customerTaxCondition: string | null;
  hasKey: boolean;
  observation: string | null;
  cancelReason: string | null;
  nubefactId: string | null;
  /** Main viewer link from NubeFact (enlace) */
  nubefactEnlace: string | null;
  nubefactPdfUrl: string | null;
  nubefactXmlUrl: string | null;
  nubefactCdrUrl: string | null;
  /** QR code string (cadena_para_codigo_qr) */
  nubefactQrCode: string | null;
  nubefactHash: string | null;
  charges: TicketCharge[];
  createdAt: string;
  updatedAt: string;
}

export interface PlateEvent {
  id: string;
  plate: string;
  eventColor: EventColor;
  observation: string;
  ticketId: string | null;
  recordedById: string;
  recordedBy: Pick<User, 'id' | 'username' | 'fullName'>;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  cashierId: string;
  cashier: Pick<User, 'id' | 'username' | 'fullName'>;
  /** Optional link to attendance for the same day (reports) */
  attendanceId: string | null;
  attendance?: Pick<
    AttendanceRecord,
    'id' | 'status' | 'lateMinutes' | 'checkedInAt' | 'checkedOutAt' | 'workedMinutes' | 'attendanceDate'
  > | null;
  shiftDate: string;
  cashAmount: string;
  yapeAmount: string;
  plinAmount: string;
  cardAmount: string;
  discountsTotal: string;
  cancellationsTotal: string;
  cancellationsCount: number;
  extraExpenses: string;
  totalAmount: string;
  balanceStatus: BalanceStatus | null;
  differenceAmount: string;
  balanceNotes: string | null;
  extraNotes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Prefer AttendanceRecord — legacy shape kept for gradual migration */
export interface Attendance {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'fullName'>;
  date: string;
  loginTime: string;
  logoutTime: string | null;
  status: AttendanceStatus;
  tardinessMinutes: number;
  notes: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  branchId: string | null;
  scheduleId: string | null;
  attendanceDate: string;
  expectedEntryAt: string | null;
  expectedExitAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  workedMinutes: number;
  notes: string | null;
  schedule?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    toleranceMinutes: number;
  } | null;
  user?: Pick<User, 'id' | 'username' | 'fullName'>;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalLateMinutes: number;
  lateCount: number;
}

export interface WorkSchedule {
  id: string;
  branchId: string | null;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  toleranceMinutes: number;
  crossesMidnight: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string;
  plate: string;
  fullName: string;
  phone: string | null;
  dni: string | null;
  vehicleTypeId: string | null;
  vehicleType: VehicleType | null;
  monthlyAmount: string;
  periodStart: string;
  periodEnd: string;
  status: SubscriberStatus;
  notes: string | null;
  registeredById: string | null;
  registeredBy: Pick<User, 'id' | 'fullName'> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string;
}

export interface DashboardData {
  /** Ingreso neto del mes (alias de totalRevenue) */
  ingresos: number;
  /** Dinero que salió de caja en el mes (alias de totalExpenses / gastos de caja) */
  egresos: number;
  /** ingresos - egresos */
  ganancia: number;
  totalRevenue: number;
  totalTickets: number;
  totalCancelled: number;
  totalDiscounts: number;
  totalExpenses: number;
  byPaymentMethod: {
    cash: number;
    yape: number;
    plin: number;
    card: number;
  };
  dailySeries: Array<{
    date: string;
    revenue: number;
  }>;
}

// ─── Reports (paginated) ──────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/** Tardanza acumulada, desglosada en horas/minutos/segundos */
export interface AccumulatedLateTime {
  totalMinutes: number;
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** HH:MM:SS */
  formatted: string;
}

export interface AttendanceReportResult {
  items: AttendanceRecord[];
  meta: PaginationMeta;
  accumulatedLateTime: AccumulatedLateTime;
}

/** Fila del reporte de caja — turno enriquecido con tickets procesados */
export interface CashRegisterReportItem extends CashRegister {
  ticketsCount: number;
}

export interface CashRegisterReportSummary {
  totalRevenue: number;
  totalDiscounts: number;
  totalCancellationsAmount: number;
  totalCancellationsCount: number;
  totalExpenses: number;
  totalTicketsCount: number;
}

export interface CashRegisterReportResult {
  items: CashRegisterReportItem[];
  meta: PaginationMeta;
  summary: CashRegisterReportSummary;
}

export interface DailySummaryTotals {
  /** Ingreso del día — suma de finalAmount de tickets pagados */
  totalRevenue: number;
  /** Tickets anulados — conteo */
  totalCancelled: number;
  /** Descuentos del día */
  totalDiscounts: number;
  /** Gastos de caja del día */
  totalExpenses: number;
}

export interface DailySummaryReportResult {
  items: Ticket[];
  meta: PaginationMeta;
  date: string;
  summary: DailySummaryTotals;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  /** Cashier only — null for admin */
  attendance: AttendanceRecord | null;
}
