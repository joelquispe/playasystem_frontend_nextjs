import { apiClient } from '@/lib/axios';
import { ApiResponse, RateType, VehicleType } from '@/types/api';

export interface VehicleTypeRateDto {
  rateType?: RateType;
  amount: number;
  label?: string;
  displayOrder?: number;
}

export interface CreateVehicleTypeDto {
  key: string;
  name: string;
  iconName?: string;
  displayOrder?: number;
  defaultRate: VehicleTypeRateDto;
}

export interface UpdateVehicleTypeDto {
  key?: string;
  name?: string;
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
  defaultRate?: VehicleTypeRateDto;
}

export const vehiclesService = {
  getVehicles: async (): Promise<VehicleType[]> => {
    const res = await apiClient.get<ApiResponse<VehicleType[]>>('/vehicles');
    return res.data.data;
  },

  getVehiclesForManage: async (): Promise<VehicleType[]> => {
    const res = await apiClient.get<ApiResponse<VehicleType[]>>('/vehicles/manage/all');
    return res.data.data;
  },

  getVehicleById: async (id: string): Promise<VehicleType> => {
    const res = await apiClient.get<ApiResponse<VehicleType>>(`/vehicles/${id}`);
    return res.data.data;
  },

  createVehicleType: async (data: CreateVehicleTypeDto): Promise<VehicleType> => {
    const res = await apiClient.post<ApiResponse<VehicleType>>('/vehicles', data);
    return res.data.data;
  },

  updateVehicleType: async (id: string, data: UpdateVehicleTypeDto): Promise<VehicleType> => {
    const res = await apiClient.patch<ApiResponse<VehicleType>>(`/vehicles/${id}`, data);
    return res.data.data;
  },

  setDefaultRate: async (vehicleTypeId: string, rateId: string): Promise<VehicleType> => {
    const res = await apiClient.patch<ApiResponse<VehicleType>>(
      `/vehicles/${vehicleTypeId}/default-rate`,
      { rateId },
    );
    return res.data.data;
  },

  deactivateVehicleType: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
