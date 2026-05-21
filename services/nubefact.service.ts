import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface TaxpayerInfo {
  ruc: string;
  businessName: string;
}

export const nubefactService = {
  getTaxpayer: async (ruc: string): Promise<TaxpayerInfo> => {
    const res = await apiClient.get<ApiResponse<TaxpayerInfo>>(`/nubefact/taxpayer/${ruc}`);
    return res.data.data;
  },
};
