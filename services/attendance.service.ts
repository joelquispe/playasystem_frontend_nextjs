import { apiClient } from '@/lib/axios';
import {
  ApiResponse,
  AttendanceRecord,
  AttendanceSummary,
  WorkSchedule,
} from '@/types/api';

export interface AttendanceFilterParams {
  userId?: string;
  year?: number;
  month?: number;
}

export const attendanceService = {
  checkIn: async (notes?: string): Promise<AttendanceRecord> => {
    const res = await apiClient.post<ApiResponse<AttendanceRecord>>(
      '/attendance/check-in',
      notes ? { notes } : {},
    );
    return res.data.data;
  },

  checkOut: async (notes?: string): Promise<AttendanceRecord> => {
    const res = await apiClient.post<ApiResponse<AttendanceRecord>>(
      '/attendance/check-out',
      notes ? { notes } : {},
    );
    return res.data.data;
  },

  getToday: async (): Promise<AttendanceRecord | null> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord | null>>(
      '/attendance/me/today',
    );
    return res.data.data;
  },

  getHistory: async (params?: Omit<AttendanceFilterParams, 'userId'>): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      '/attendance/me/history',
      { params },
    );
    return res.data.data;
  },

  /** [Admin] List all attendance records */
  list: async (params?: AttendanceFilterParams): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>('/attendance', {
      params,
    });
    return res.data.data;
  },

  /** [Admin] Tardiness summary for a user/month */
  getSummary: async (params: AttendanceFilterParams): Promise<AttendanceSummary> => {
    const res = await apiClient.get<ApiResponse<AttendanceSummary>>('/attendance/summary', {
      params,
    });
    return res.data.data;
  },

  /** [Admin] List work schedules */
  getSchedules: async (): Promise<WorkSchedule[]> => {
    const res = await apiClient.get<ApiResponse<WorkSchedule[]>>('/attendance/schedules');
    return res.data.data;
  },

  /** [Admin] Get one work schedule */
  getSchedule: async (id: string): Promise<WorkSchedule> => {
    const res = await apiClient.get<ApiResponse<WorkSchedule>>(
      `/attendance/schedules/${id}`,
    );
    return res.data.data;
  },

  /** [Admin] Get one attendance record by id */
  getById: async (id: string): Promise<AttendanceRecord> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord>>(`/attendance/${id}`);
    return res.data.data;
  },
};
