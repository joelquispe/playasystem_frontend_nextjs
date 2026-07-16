import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import {
  reportsService,
  AttendanceReportParams,
  CashRegisterReportParams,
  DailyReportParams,
  DailySummaryReportParams,
  DashboardParams,
  MonthlyReportParams,
} from '@/services/reports.service';

export function useDashboard(params?: DashboardParams) {
  const year = params?.year ?? new Date().getFullYear();
  const month = params?.month ?? new Date().getMonth() + 1;
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_DASHBOARD(year, month),
    queryFn: () => reportsService.getDashboard({ year, month }),
  });
}

export function useMonthlyReport(params?: MonthlyReportParams) {
  const year = params?.year ?? new Date().getFullYear();
  const month = params?.month ?? new Date().getMonth() + 1;
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_MONTHLY(year, month),
    queryFn: () => reportsService.getMonthlyReport({ ...params, year, month }),
  });
}

export function useDailyReport(params?: DailyReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_DAILY(params?.cashierId ?? '', params?.date ?? ''),
    queryFn: () => reportsService.getDailyReport(params),
    enabled: !!(params?.cashierId && params?.date),
  });
}

/** Reporte de asistencia — paginado, filtrable por cajero (opcional) y fecha/período */
export function useAttendanceReport(params: AttendanceReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_ATTENDANCE({ ...params }),
    queryFn: () => reportsService.getAttendanceReport(params),
  });
}

/** Reporte de caja (cajeros) — resumen del mes/período, paginado */
export function useCashRegisterReport(params: CashRegisterReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_CASH_REGISTER({ ...params }),
    queryFn: () => reportsService.getCashRegisterReport(params),
  });
}

/** Reporte de caja (cajeros) — resumen del día, paginado */
export function useDailySummaryReport(params: DailySummaryReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS_DAILY_SUMMARY({ ...params }),
    queryFn: () => reportsService.getDailySummaryReport(params),
  });
}
