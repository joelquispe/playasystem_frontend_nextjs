import axios from 'axios';
import { ApiResponse, LoginResponse } from '@/types/api';

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginResponse['user'];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Exchanges a refresh token for a new access/refresh pair.
 *
 * Uses a bare axios instance (not the shared `apiClient`) so this call:
 * - never carries a stale/expired Authorization header, and
 * - can be safely imported by `lib/axios.ts`'s own response interceptor
 *   without creating a circular dependency on the interceptor itself.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  const res = await axios.post<ApiResponse<RefreshResponse>>(`${API_URL}/auth/refresh`, {
    refreshToken,
  });
  return res.data.data;
}
