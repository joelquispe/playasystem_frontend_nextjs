import { apiClient } from '@/lib/axios';
import { ApiResponse, SystemConfig } from '@/types/api';

export interface UpsertConfigDto {
  configKey: string;
  configValue: string;
  description?: string;
}

export const systemConfigService = {
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await apiClient.get<ApiResponse<SystemConfig[]>>('/system-config');
    return res.data.data;
  },

  getByKey: async (key: string): Promise<SystemConfig> => {
    const res = await apiClient.get<ApiResponse<SystemConfig>>(`/system-config/${key}`);
    return res.data.data;
  },

  upsert: async (data: UpsertConfigDto): Promise<SystemConfig> => {
    const res = await apiClient.post<ApiResponse<SystemConfig>>('/system-config', data);
    return res.data.data;
  },

  deleteByKey: async (key: string): Promise<void> => {
    await apiClient.delete(`/system-config/${key}`);
  },
};
