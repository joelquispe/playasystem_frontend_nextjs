'use client';

import { useState } from 'react';
import { Button, Col, DatePicker, Row, Skeleton, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useDashboard } from '@/hooks/useReports';
import { reportsService } from '@/services/reports.service';
import { DashboardStats } from '@/components/reports/DashboardStats';
import { RevenueChart } from '@/components/reports/RevenueChart';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors } from '@/lib/theme';

const { Text } = Typography;

export default function ReportsDashboardPage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [exporting, setExporting] = useState(false);

  const year = month.year();
  const monthNum = month.month() + 1;

  const { data: dashboard, isLoading, isFetching, refetch } = useDashboard({ year, month: monthNum });

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportExcel({ year, month: monthNum });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-playa-${year}-${String(monthNum).padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Reporte descargado');
    } catch {
      message.error('Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle={month.format('MMMM YYYY')}
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DatePicker
              picker="month"
              value={month}
              onChange={(v) => v && setMonth(v)}
              format="MMMM YYYY"
              allowClear={false}
            />
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
              Actualizar
            </Button>
            {/* <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
            >
              Exportar Excel
            </Button> */}
          </div>
        }
      />

      {isLoading ? (
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
        <Text style={{ color: colors.textMuted }}>Sin datos para este período</Text>
      )}
    </>
  );
}
