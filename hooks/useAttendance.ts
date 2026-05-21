import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { attendanceService, AttendanceParams } from '@/services/attendance.service';

export function useAttendance(params?: AttendanceParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE(params as Record<string, unknown>),
    queryFn: () => attendanceService.getAttendance(params),
  });
}

export function useAttendanceSummary(params?: AttendanceParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_SUMMARY(params as Record<string, unknown>),
    queryFn: () => attendanceService.getSummary(params),
    enabled: !!(params?.userId),
  });
}
