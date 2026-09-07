import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuth, getRefreshToken, getToken, setTokens } from '@/lib/auth';
import { refreshAccessToken } from '@/lib/token-refresh';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ── 401 handling: silent refresh-and-retry ──────────────────────────────────
//
// The access token has a limited lifetime (JWT_EXPIRES_IN). Without this,
// once it expires the cashier appears "logged out" on the next request /
// page reload even though a valid refresh token exists. On a 401 we
// exchange the refresh token for a new pair exactly once and retry the
// original request; concurrent requests that 401 while a refresh is
// already in flight wait for that same refresh instead of each starting
// their own.
let refreshPromise: Promise<string> | null = null;

async function getRefreshedAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'));
    }

    refreshPromise = refreshAccessToken(refreshToken)
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken, data.sessionId);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        const newAccessToken = await getRefreshedAccessToken();
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(config);
      } catch {
        if (typeof window !== 'undefined') {
          clearAuth();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
