import { apiClient } from '@/lib/axios';
import { ApiResponse, SessionsListResult, UserSession } from '@/types/api';

export interface SessionsFilterParams {
  userId?: string;
  isActive?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const sessionsService = {
  /** [Admin] Paginated session report with filters */
  list: async (params?: SessionsFilterParams): Promise<SessionsListResult> => {
    const res = await apiClient.get<ApiResponse<SessionsListResult>>('/sessions', {
      params,
    });
    return res.data.data;
  },

  /** [Admin] Session detail */
  getById: async (id: string): Promise<UserSession> => {
    const res = await apiClient.get<ApiResponse<UserSession>>(`/sessions/${id}`);
    return res.data.data;
  },

  /** Current user's active sessions */
  getMine: async (): Promise<UserSession[]> => {
    const res = await apiClient.get<ApiResponse<UserSession[]>>('/sessions/me');
    return res.data.data;
  },

  /** [Admin] Force-close a session */
  revoke: async (id: string): Promise<UserSession> => {
    const res = await apiClient.post<ApiResponse<UserSession>>(
      `/sessions/${id}/revoke`,
      {},
    );
    return res.data.data;
  },

  /** Close all other sessions for the current user */
  revokeOthers: async (): Promise<{ message: string; affected: number }> => {
    const res = await apiClient.post<
      ApiResponse<{ message: string; affected: number }>
    >('/sessions/me/revoke-others', {});
    return res.data.data;
  },
};
