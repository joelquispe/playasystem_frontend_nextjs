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
export type AttendanceStatus = 'on_time' | 'late' | 'absent';
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

export interface AttendanceSummary {
  totalTardinessMinutes: number;
  lateCount: number;
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
