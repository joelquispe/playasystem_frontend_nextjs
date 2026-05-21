import { apiClient } from '@/lib/axios';
import { ApiResponse, Client, EventColor } from '@/types/api';

export interface CreateClientDto {
  plate: string;
  vehicleTypeId?: string;
  fullName: string;
  phone?: string;
  dni?: string;
  specialRate?: number;
  eventColor?: EventColor;
  notes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  isActive?: boolean;
}

export const clientsService = {
  getClients: async (): Promise<Client[]> => {
    const res = await apiClient.get<ApiResponse<Client[]>>('/clients');
    return res.data.data;
  },

  searchClients: async (q: string): Promise<Client[]> => {
    const res = await apiClient.get<ApiResponse<Client[]>>('/clients/search', {
      params: { q },
    });
    return res.data.data;
  },

  getClientByPlate: async (plate: string): Promise<Client | null> => {
    try {
      const res = await apiClient.get<ApiResponse<Client>>(`/clients/plate/${plate}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  getClientById: async (id: string): Promise<Client> => {
    const res = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
    return res.data.data;
  },

  getClientEvents: async (id: string) => {
    const res = await apiClient.get(`/clients/${id}/events`);
    return res.data.data;
  },

  createClient: async (data: CreateClientDto): Promise<Client> => {
    const res = await apiClient.post<ApiResponse<Client>>('/clients', data);
    return res.data.data;
  },

  updateClient: async (id: string, data: UpdateClientDto): Promise<Client> => {
    const res = await apiClient.patch<ApiResponse<Client>>(`/clients/${id}`, data);
    return res.data.data;
  },

  deleteClient: async (id: string): Promise<Client> => {
    const res = await apiClient.delete<ApiResponse<Client>>(`/clients/${id}`);
    return res.data.data;
  },
};
