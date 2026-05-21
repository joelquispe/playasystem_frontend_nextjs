import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import {
  reportsService,
  DailyReportParams,
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
