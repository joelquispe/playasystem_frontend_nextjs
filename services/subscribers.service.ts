import { apiClient } from '@/lib/axios';
import { ApiResponse, Subscriber, SubscriberStatus } from '@/types/api';

export interface CreateSubscriberDto {
  plate: string;
  fullName: string;
  phone?: string;
  dni?: string;
  vehicleTypeId?: string;
  monthlyAmount: number;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

export interface UpdateSubscriberDto {
  fullName?: string;
  phone?: string;
  dni?: string;
  vehicleTypeId?: string;
  notes?: string;
}

export interface RenewSubscriberDto {
  periodStart: string;
  periodEnd: string;
  monthlyAmount?: number;
}

export const subscribersService = {
  getAll: async (status?: SubscriberStatus): Promise<Subscriber[]> => {
    const res = await apiClient.get<ApiResponse<Subscriber[]>>('/subscribers', {
      params: status ? { status } : {},
    });
    return res.data.data;
  },

  search: async (q: string): Promise<Subscriber[]> => {
    const res = await apiClient.get<ApiResponse<Subscriber[]>>('/subscribers/search', {
      params: { q },
    });
    return res.data.data;
  },

  getActiveByPlate: async (plate: string): Promise<Subscriber | null> => {
    const res = await apiClient.get<ApiResponse<Subscriber | null>>(
      `/subscribers/plate/${encodeURIComponent(plate.toUpperCase())}`,
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Subscriber> => {
    const res = await apiClient.get<ApiResponse<Subscriber>>(`/subscribers/${id}`);
    return res.data.data;
  },

  create: async (data: CreateSubscriberDto): Promise<Subscriber> => {
    const res = await apiClient.post<ApiResponse<Subscriber>>('/subscribers', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateSubscriberDto): Promise<Subscriber> => {
    const res = await apiClient.patch<ApiResponse<Subscriber>>(`/subscribers/${id}`, data);
    return res.data.data;
  },

  renew: async (id: string, data: RenewSubscriberDto): Promise<Subscriber> => {
    const res = await apiClient.post<ApiResponse<Subscriber>>(`/subscribers/${id}/renew`, data);
    return res.data.data;
  },

  cancel: async (id: string): Promise<Subscriber> => {
    const res = await apiClient.delete<ApiResponse<Subscriber>>(`/subscribers/${id}`);
    return res.data.data;
  },

  expireStale: async (): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/subscribers/expire-stale');
    return res.data.data;
  },
};
