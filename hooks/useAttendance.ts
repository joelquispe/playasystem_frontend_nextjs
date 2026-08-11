import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  attendanceService,
  AttendanceFilterParams,
} from '@/services/attendance.service';

function apiErrorMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

/** Current user's attendance for today (Lima). */
export function useTodayAttendance(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_TODAY,
    queryFn: () => attendanceService.getToday(),
    enabled,
    refetchInterval: 60_000,
  });
}

/** Current user's attendance history. */
export function useMyAttendanceHistory(params?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_HISTORY((params ?? {}) as Record<string, unknown>),
    queryFn: () => attendanceService.getHistory(params),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => attendanceService.checkIn(notes),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.ATTENDANCE_TODAY, data);
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      message.success('Ingreso marcado');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al marcar ingreso'));
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => attendanceService.checkOut(notes),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.ATTENDANCE_TODAY, data);
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      message.success('Salida de asistencia registrada');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al marcar salida'));
    },
  });
}

/** [Admin] List attendance records */
export function useAttendance(params?: AttendanceFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE((params ?? {}) as Record<string, unknown>),
    queryFn: () => attendanceService.list(params),
  });
}

/** [Admin] Tardiness summary */
export function useAttendanceSummary(params?: AttendanceFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_SUMMARY((params ?? {}) as Record<string, unknown>),
    queryFn: () => attendanceService.getSummary(params ?? {}),
    enabled: !!params?.userId,
  });
}

/** [Admin] Work schedules */
export function useWorkSchedules() {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_SCHEDULES,
    queryFn: () => attendanceService.getSchedules(),
  });
}

export function useWorkSchedule(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_SCHEDULE(id),
    queryFn: () => attendanceService.getSchedule(id),
    enabled: !!id,
  });
}

export function useAttendanceDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE_DETAIL(id),
    queryFn: () => attendanceService.getById(id),
    enabled: !!id,
  });
}
