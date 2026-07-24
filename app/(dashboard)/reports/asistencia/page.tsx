'use client';

import { useState } from 'react';
import { Button, DatePicker, Select, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAttendanceReport } from '@/hooks/useReports';
import { useUsers } from '@/hooks/useUsers';
import { reportsService } from '@/services/reports.service';
import { AttendanceReportTable } from '@/components/reports/AttendanceReportTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors } from '@/lib/theme';

const { Text } = Typography;

export default function ReportsAsistenciaPage() {
  const now = dayjs();

  const [cashierId, setCashierId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<Dayjs>(now);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [exporting, setExporting] = useState(false);

  const { data: users = [] } = useUsers();
  const cashierOptions = users
    .filter((u) => u.isActive)
    .map((u) => ({ label: u.fullName, value: u.id }));

  const params = {
    cashierId,
    year: month.year(),
    month: month.month() + 1,
    page,
    limit,
  };

  const { data: report, isLoading, isFetching, refetch } = useAttendanceReport(params);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsService.exportAttendanceReport(params);
      message.success('Reporte descargado');
    } catch {
      message.error('Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader title="Asistencia" subtitle={month.format('MMMM YYYY')} />

      <div
        style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cajero:</Text>
        <Select
          value={cashierId}
          onChange={(v) => {
            setCashierId(v);
            setPage(1);
          }}
          options={cashierOptions}
          placeholder="Todos los cajeros"
          style={{ width: 220 }}
          allowClear
        />
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Mes:</Text>
        <DatePicker
          picker="month"
          value={month}
          onChange={(v) => {
            if (v) {
              setMonth(v);
              setPage(1);
            }
          }}
          format="MMMM YYYY"
          allowClear={false}
        />
        <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} size="small">
          Actualizar
        </Button>
        {/* <Button
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
          size="small"
          type="primary"
        >
          Exportar Excel
        </Button> */}
      </div>

      <AttendanceReportTable
        items={report?.items ?? []}
        meta={report?.meta}
        loading={isLoading}
        onPageChange={(p, l) => {
          setPage(p);
          setLimit(l);
        }}
      />
    </>
  );
}
