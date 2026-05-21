import { apiClient } from '@/lib/axios';
import { ApiResponse, Role, User } from '@/types/api';

export interface CreateUserDto {
  username: string;
  fullName: string;
  password: string;
  role?: Role;
  scheduleStart?: string;
  scheduleEnd?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: Role;
  scheduleStart?: string;
  scheduleEnd?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const usersService = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  createUser: async (data: CreateUserDto): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },

  changePassword: async (id: string, data: ChangePasswordDto): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/password`, data);
    return res.data.data;
  },

  deleteUser: async (id: string): Promise<User> => {
    const res = await apiClient.delete<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  adminResetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },
};
