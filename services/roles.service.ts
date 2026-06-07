import { apiClient } from '@/lib/axios';
import { ApiResponse, RoleEntity } from '@/types/api';

export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export const rolesService = {
  getRoles: async (): Promise<RoleEntity[]> => {
    const res = await apiClient.get<ApiResponse<RoleEntity[]>>('/roles');
    return res.data.data;
  },

  getRoleById: async (id: string): Promise<RoleEntity> => {
    const res = await apiClient.get<ApiResponse<RoleEntity>>(`/roles/${id}`);
    return res.data.data;
  },

  createRole: async (data: CreateRoleDto): Promise<RoleEntity> => {
    const res = await apiClient.post<ApiResponse<RoleEntity>>('/roles', data);
    return res.data.data;
  },

  updateRole: async (id: string, data: UpdateRoleDto): Promise<RoleEntity> => {
    const res = await apiClient.patch<ApiResponse<RoleEntity>>(`/roles/${id}`, data);
    return res.data.data;
  },

  deactivateRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};
