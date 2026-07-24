'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/**
 * The old flat "Reportes" screen was replaced by the submenu:
 * Reportes → Dashboard / Cajeros / Asistencia. Keep this route as a
 * redirect so old links/bookmarks still land somewhere useful.
 */
export default function ReportsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports/reportes');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <Spin size="large" />
    </div>
  );
}
