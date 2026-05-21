import { apiClient } from '@/lib/axios';
import {
  ApiResponse,
  PaymentMethod,
  RateType,
  ReceiptType,
  Ticket,
  TicketCharge,
} from '@/types/api';

export interface CreateTicketDto {
  plate: string;
  vehicleTypeId: string;
  rateType: RateType;
  rateAmount: number;
  hasKey?: boolean;
}

export interface ChargeTicketDto {
  paymentMethod: PaymentMethod;
  receiptType?: ReceiptType;
  discount?: number;
  discountObservation?: string | null;
  customerDni?: string | null;
  customerRuc?: string | null;
  customerBusinessName?: string | null;
  observation?: string | null;
}

export interface CancelTicketDto {
  cancelReason: string;
}

export interface AdditionalChargeDto {
  chargeType: 'overnight' | 'hour_fraction';
  amount: number;
  notes?: string;
}

export interface ManualTicketDto {
  plate: string;
  vehicleTypeId: string;
  rateType: RateType;
  rateAmount: number;
  hours: number;
  paymentMethod: PaymentMethod;
}

export interface PostPaymentReceiptDto {
  receiptType: 'boleta' | 'factura';
  customerDni?: string;
  customerRuc?: string;
  customerBusinessName?: string;
  observation?: string;
}

export const ticketsService = {
  getTickets: async (pending?: boolean): Promise<Ticket[]> => {
    const params = pending ? { pending: true } : {};
    const res = await apiClient.get<ApiResponse<Ticket[]>>('/tickets', { params });
    return res.data.data;
  },

  getTicketById: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return res.data.data;
  },

  getTicketByCode: async (code: string): Promise<Ticket> => {
    const res = await apiClient.get<ApiResponse<Ticket>>(`/tickets/scan/${code}`);
    return res.data.data;
  },

  getTicketsByPlate: async (plate: string): Promise<Ticket[]> => {
    const res = await apiClient.get<ApiResponse<Ticket[]>>(`/tickets/plate/${plate}`);
    return res.data.data;
  },

  createTicket: async (data: CreateTicketDto): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>('/tickets', data);
    return res.data.data;
  },

  chargeTicket: async (id: string, data: ChargeTicketDto): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/charge`, data);
    return res.data.data;
  },

  cancelTicket: async (id: string, data: CancelTicketDto): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/cancel`, data);
    return res.data.data;
  },

  revertTicket: async (id: string): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/revert`);
    return res.data.data;
  },

  addAdditionalCharge: async (id: string, data: AdditionalChargeDto): Promise<TicketCharge> => {
    const res = await apiClient.post<ApiResponse<TicketCharge>>(
      `/tickets/${id}/charge/additional`,
      data,
    );
    return res.data.data;
  },

  toggleKey: async (id: string): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/key`);
    return res.data.data;
  },

  createManualTicket: async (data: ManualTicketDto): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>('/tickets/manual', data);
    return res.data.data;
  },

  postPaymentReceipt: async (id: string, data: PostPaymentReceiptDto): Promise<Ticket> => {
    const res = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/receipt`, data);
    return res.data.data;
  },
};
