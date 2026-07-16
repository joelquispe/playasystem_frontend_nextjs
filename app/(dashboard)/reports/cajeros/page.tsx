'use client';

import { useState } from 'react';
import { Button, DatePicker, Select, Tabs, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useCashRegisterReport, useDailySummaryReport } from '@/hooks/useReports';
import { useUsers } from '@/hooks/useUsers';
import { reportsService } from '@/services/reports.service';
import { CashRegisterReportTable } from '@/components/reports/CashRegisterReportTable';
import { DailySummaryReportTable } from '@/components/reports/DailySummaryReportTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

export default function ReportsCajerosPage() {
  const now = dayjs();

  const [cashierId, setCashierId] = useState<string | undefined>(undefined);

  const [monthlyMonth, setMonthlyMonth] = useState<Dayjs>(now);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyLimit, setMonthlyLimit] = useState(15);
  const [exportingMonthly, setExportingMonthly] = useState(false);

  const [dailyDate, setDailyDate] = useState<Dayjs>(now);
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyLimit, setDailyLimit] = useState(15);
  const [exportingDaily, setExportingDaily] = useState(false);

  const { data: users = [] } = useUsers();
  const cashierOptions = users
    .filter((u) => u.isActive)
    .map((u) => ({ label: u.fullName, value: u.id }));

  const monthlyParams = {
    cashierId,
    year: monthlyMonth.year(),
    month: monthlyMonth.month() + 1,
    page: monthlyPage,
    limit: monthlyLimit,
  };
  const {
    data: monthlyReport,
    isLoading: monthlyLoading,
    isFetching: monthlyFetching,
    refetch: refetchMonthly,
  } = useCashRegisterReport(monthlyParams);

  const dailyParams = {
    cashierId,
    date: dailyDate.format('YYYY-MM-DD'),
    page: dailyPage,
    limit: dailyLimit,
  };
  const {
    data: dailyReport,
    isLoading: dailyLoading,
    isFetching: dailyFetching,
    refetch: refetchDaily,
  } = useDailySummaryReport(dailyParams);

  const handleExportMonthly = async () => {
    setExportingMonthly(true);
    try {
      await reportsService.exportCashRegisterReport(monthlyParams);
      message.success('Reporte descargado');
    } catch {
      message.error('Error al exportar reporte');
    } finally {
      setExportingMonthly(false);
    }
  };

  const handleExportDaily = async () => {
    setExportingDaily(true);
    try {
      await reportsService.exportDailySummaryReport(dailyParams);
      message.success('Reporte descargado');
    } catch {
      message.error('Error al exportar reporte');
    } finally {
      setExportingDaily(false);
    }
  };

  const cashierFilter = (
    <>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cajero:</Text>
      <Select
        value={cashierId}
        onChange={setCashierId}
        options={cashierOptions}
        placeholder="Todos los cajeros"
        style={{ width: 220 }}
        allowClear
      />
    </>
  );

  const tabItems = [
    {
      key: 'monthly',
      label: 'Resumen del mes',
      children: (
        <div>
          <div
            style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}
          >
            {cashierFilter}
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Mes:</Text>
            <DatePicker
              picker="month"
              value={monthlyMonth}
              onChange={(v) => {
                if (v) {
                  setMonthlyMonth(v);
                  setMonthlyPage(1);
                }
              }}
              format="MMMM YYYY"
              allowClear={false}
            />
            <Button icon={<ReloadOutlined spin={monthlyFetching} />} onClick={() => refetchMonthly()} size="small">
              Actualizar
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exportingMonthly}
              onClick={handleExportMonthly}
              size="small"
              type="primary"
            >
              Exportar Excel
            </Button>
          </div>

          <CashRegisterReportTable
            items={monthlyReport?.items ?? []}
            summary={monthlyReport?.summary}
            meta={monthlyReport?.meta}
            loading={monthlyLoading}
            onPageChange={(page, limit) => {
              setMonthlyPage(page);
              setMonthlyLimit(limit);
            }}
          />
        </div>
      ),
    },
    {
      key: 'daily',
      label: 'Resumen del día',
      children: (
        <div>
          <div
            style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}
          >
            {cashierFilter}
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Fecha:</Text>
            <DatePicker
              value={dailyDate}
              onChange={(v) => {
                if (v) {
                  setDailyDate(v);
                  setDailyPage(1);
                }
              }}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button icon={<ReloadOutlined spin={dailyFetching} />} onClick={() => refetchDaily()} size="small">
              Actualizar
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exportingDaily}
              onClick={handleExportDaily}
              size="small"
              type="primary"
            >
              Exportar Excel
            </Button>
          </div>

          <DailySummaryReportTable
            items={dailyReport?.items ?? []}
            summary={dailyReport?.summary}
            meta={dailyReport?.meta}
            loading={dailyLoading}
            onPageChange={(page, limit) => {
              setDailyPage(page);
              setDailyLimit(limit);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Cajeros" subtitle="Resumen del mes y del día por cajero" />

      <div style={{ ...cardStyle, padding: '20px 24px' }}>
        <Tabs items={tabItems} defaultActiveKey="monthly" />
      </div>
    </>
  );
}
