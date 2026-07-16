import { apiClient } from '@/lib/axios';
import {
  ApiResponse,
  AttendanceReportResult,
  CashRegister,
  CashRegisterReportResult,
  DailySummaryReportResult,
  DashboardData,
  Ticket,
} from '@/types/api';

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

export interface AttendanceReportParams {
  cashierId?: string;
  year?: number;
  month?: number;
  date?: string;
  page?: number;
  limit?: number;
}

export interface CashRegisterReportParams {
  cashierId?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

export interface DailySummaryReportParams {
  cashierId?: string;
  date?: string;
  page?: number;
  limit?: number;
}

/** Triggers a browser download for a Blob returned by an export endpoint */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

  // ─── Asistencia ──────────────────────────────────────────────────────────────

  getAttendanceReport: async (
    params?: AttendanceReportParams,
  ): Promise<AttendanceReportResult> => {
    const res = await apiClient.get<ApiResponse<AttendanceReportResult>>('/reports/attendance', {
      params,
    });
    return res.data.data;
  },

  exportAttendanceReport: async (
    params?: AttendanceReportParams,
    filename = `reporte-asistencia-${new Date().toISOString().slice(0, 10)}.xlsx`,
  ): Promise<void> => {
    const res = await apiClient.get('/reports/attendance/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(res.data as Blob, filename);
  },

  // ─── Cajeros — resumen del mes (caja) ────────────────────────────────────────

  getCashRegisterReport: async (
    params?: CashRegisterReportParams,
  ): Promise<CashRegisterReportResult> => {
    const res = await apiClient.get<ApiResponse<CashRegisterReportResult>>(
      '/reports/cash-register',
      { params },
    );
    return res.data.data;
  },

  exportCashRegisterReport: async (
    params?: CashRegisterReportParams,
    filename = `reporte-caja-${new Date().toISOString().slice(0, 10)}.xlsx`,
  ): Promise<void> => {
    const res = await apiClient.get('/reports/cash-register/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(res.data as Blob, filename);
  },

  // ─── Cajeros — resumen del día (tickets) ─────────────────────────────────────

  getDailySummaryReport: async (
    params?: DailySummaryReportParams,
  ): Promise<DailySummaryReportResult> => {
    const res = await apiClient.get<ApiResponse<DailySummaryReportResult>>(
      '/reports/daily-summary',
      { params },
    );
    return res.data.data;
  },

  exportDailySummaryReport: async (
    params?: DailySummaryReportParams,
    filename = `resumen-dia-${params?.date ?? new Date().toISOString().slice(0, 10)}.xlsx`,
  ): Promise<void> => {
    const res = await apiClient.get('/reports/daily-summary/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(res.data as Blob, filename);
  },
};
