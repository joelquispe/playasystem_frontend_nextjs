import { apiClient } from '@/lib/axios';
import { ApiResponse, Attendance, AttendanceSummary } from '@/types/api';

export interface AttendanceParams {
  userId?: string;
  year?: number;
  month?: number;
}

export const attendanceService = {
  getAttendance: async (params?: AttendanceParams): Promise<Attendance[]> => {
    const res = await apiClient.get<ApiResponse<Attendance[]>>('/attendance', { params });
    return res.data.data;
  },

  getSummary: async (params?: AttendanceParams): Promise<AttendanceSummary> => {
    const res = await apiClient.get<ApiResponse<AttendanceSummary>>('/attendance/summary', {
      params,
    });
    return res.data.data;
  },
};
