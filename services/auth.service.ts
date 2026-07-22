import { apiClient } from '@/lib/axios';
import { refreshAccessToken, RefreshResponse } from '@/lib/token-refresh';
import { ApiResponse, LoginRequest, LoginResponse, User } from '@/types/api';

export type { RefreshResponse };

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data;
  },

  /** Exchanges a refresh token for a new access/refresh pair. */
  refresh: (refreshToken: string): Promise<RefreshResponse> => refreshAccessToken(refreshToken),

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
