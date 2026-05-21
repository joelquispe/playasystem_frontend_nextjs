import { apiClient } from '@/lib/axios';
import { ApiResponse, CashRegister, DashboardData, Ticket } from '@/types/api';

export interface MonthlyReportParams {
  cashierId?: string;
  year?: number;
  month?: number;
}

export interface DailyReportParams {
  cashierId?: string;
  date?: string;
}

export interface DashboardParams {
  year?: number;
  month?: number;
}

export const reportsService = {
  getMonthlyReport: async (params?: MonthlyReportParams): Promise<CashRegister[]> => {
    const res = await apiClient.get<ApiResponse<CashRegister[]>>('/reports/monthly', { params });
    return res.data.data;
  },

  getDailyReport: async (params?: DailyReportParams): Promise<Ticket[]> => {
    const res = await apiClient.get<ApiResponse<Ticket[]>>('/reports/daily', { params });
    return res.data.data;
  },

  getDashboard: async (params?: DashboardParams): Promise<DashboardData> => {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/reports/dashboard', { params });
    return res.data.data;
  },

  /** Binary download — does not use JSON envelope */
  exportExcel: async (params?: MonthlyReportParams): Promise<Blob> => {
    const res = await apiClient.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};
