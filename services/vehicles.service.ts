import { apiClient } from '@/lib/axios';
import { ApiResponse, VehicleType } from '@/types/api';

export const vehiclesService = {
  getVehicles: async (): Promise<VehicleType[]> => {
    const res = await apiClient.get<ApiResponse<VehicleType[]>>('/vehicles');
    return res.data.data;
  },

  getVehicleById: async (id: string): Promise<VehicleType> => {
    const res = await apiClient.get<ApiResponse<VehicleType>>(`/vehicles/${id}`);
    return res.data.data;
  },
};
