'use client';

import { useState } from 'react';
import { Button, Col, DatePicker, Row, Select, Skeleton, Space, Tabs, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useDashboard, useMonthlyReport, useDailyReport } from '@/hooks/useReports';
import { useUsers } from '@/hooks/useUsers';
import { reportsService } from '@/services/reports.service';
import { DashboardStats } from '@/components/reports/DashboardStats';
import { RevenueChart } from '@/components/reports/RevenueChart';
import { DailyReportTable } from '@/components/reports/DailyReportTable';
import { MonthlyReportTable } from '@/components/reports/MonthlyReportTable';
import { PageHeader } from '@/components/ui/PageHeader';

const { Text } = Typography;

export default function ReportsPage() {
  const now = dayjs();
  const [dashboardMonth, setDashboardMonth] = useState<Dayjs>(now);
  const [dailyCashierId, setDailyCashierId] = useState<string | undefined>(undefined);
  const [dailyDate, setDailyDate] = useState<Dayjs>(now);
  const [exporting, setExporting] = useState(false);

  const year = dashboardMonth.year();
  const month = dashboardMonth.month() + 1;

  const {
    data: dashboard,
    isLoading: dashLoading,
    refetch: refetchDash,
    isFetching: dashFetching,
  } = useDashboard({ year, month });

  const {
    data: monthly = [],
    isLoading: monthlyLoading,
    refetch: refetchMonthly,
    isFetching: monthlyFetching,
  } = useMonthlyReport({ year, month });

  const {
    data: daily = [],
    isLoading: dailyLoading,
    isFetching: dailyFetching,
    refetch: refetchDaily,
  } = useDailyReport(
    dailyCashierId && dailyDate
      ? { cashierId: dailyCashierId, date: dailyDate.format('YYYY-MM-DD') }
      : undefined,
  );

  const { data: users = [] } = useUsers();
  const cashierOptions = users
    .filter((u) => u.isActive)
    .map((u) => ({ label: u.fullName, value: u.id }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportExcel({ year, month });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-playa-${year}-${String(month).padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Reporte descargado');
    } catch {
      message.error('Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard mensual',
      children: (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Mes:</Text>
            <DatePicker
              picker="month"
              value={dashboardMonth}
              onChange={(v) => v && setDashboardMonth(v)}
              format="MMMM YYYY"
              style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined spin={dashFetching} />}
              onClick={() => refetchDash()}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              size="small"
            >
              Actualizar
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              size="small"
            >
              Exportar Excel
            </Button>
          </div>

          {dashLoading ? (
            <Skeleton active />
          ) : dashboard ? (
            <Row gutter={[20, 20]}>
              <Col xs={24}>
                <DashboardStats data={dashboard} />
              </Col>
              <Col xs={24}>
                <RevenueChart data={dashboard} />
              </Col>
            </Row>
          ) : (
            <Text style={{ color: '#666' }}>Sin datos para este período</Text>
          )}
        </div>
      ),
    },
    {
      key: 'monthly',
      label: 'Resumen por turno',
      children: (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Mes:</Text>
            <DatePicker
              picker="month"
              value={dashboardMonth}
              onChange={(v) => v && setDashboardMonth(v)}
              format="MMMM YYYY"
              style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined spin={monthlyFetching} />}
              onClick={() => refetchMonthly()}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              size="small"
            >
              Actualizar
            </Button>
          </div>
          <MonthlyReportTable shifts={monthly} loading={monthlyLoading} />
        </div>
      ),
    },
    {
      key: 'daily',
      label: 'Reporte diario',
      children: (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Cajero:</Text>
            <Select
              value={dailyCashierId}
              onChange={setDailyCashierId}
              options={cashierOptions}
              placeholder="Selecciona cajero"
              style={{ width: 220 }}
              allowClear
            />
            <Text style={{ color: '#888', fontSize: 13 }}>Fecha:</Text>
            <DatePicker
              value={dailyDate}
              onChange={(v) => v && setDailyDate(v)}
              format="DD/MM/YYYY"
              style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined spin={dailyFetching} />}
              onClick={() => refetchDaily()}
              disabled={!dailyCashierId}
              style={{ background: '#1a1a1a', border: '1px solid #2d2d2d' }}
              size="small"
            >
              Buscar
            </Button>
          </div>

          {!dailyCashierId ? (
            <Text style={{ color: '#666' }}>Selecciona un cajero y fecha para ver el reporte</Text>
          ) : (
            <DailyReportTable tickets={daily} loading={dailyLoading} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Reportes" subtitle={dashboardMonth.format('MMMM YYYY')} />

      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #2d2d2d',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <Tabs items={tabItems} defaultActiveKey="dashboard" />
      </div>
    </>
  );
}
