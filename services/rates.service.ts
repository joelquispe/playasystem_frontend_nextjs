import { apiClient } from '@/lib/axios';
import { ApiResponse, Rate, RateType } from '@/types/api';

export interface CreateRateDto {
  vehicleTypeId?: string;
  rateType: RateType;
  amount: number;
  label?: string;
  displayOrder?: number;
}

export interface UpdateRateDto extends Partial<CreateRateDto> {
  isActive?: boolean;
}

export const ratesService = {
  getRates: async (params?: {
    vehicleTypeId?: string;
    rateType?: RateType;
  }): Promise<Rate[]> => {
    const res = await apiClient.get<ApiResponse<Rate[]>>('/rates', { params });
    return res.data.data;
  },

  getRateById: async (id: string): Promise<Rate> => {
    const res = await apiClient.get<ApiResponse<Rate>>(`/rates/${id}`);
    return res.data.data;
  },

  createRate: async (data: CreateRateDto): Promise<Rate> => {
    const res = await apiClient.post<ApiResponse<Rate>>('/rates', data);
    return res.data.data;
  },

  updateRate: async (id: string, data: UpdateRateDto): Promise<Rate> => {
    const res = await apiClient.patch<ApiResponse<Rate>>(`/rates/${id}`, data);
    return res.data.data;
  },

  deleteRate: async (id: string): Promise<Rate> => {
    const res = await apiClient.delete<ApiResponse<Rate>>(`/rates/${id}`);
    return res.data.data;
  },
};
