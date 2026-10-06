'use client';

import { Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { UserSessionSummary } from '@/types/api';
import { formatLimaDateTime } from '@/lib/datetime';
import { colors } from '@/lib/theme';

const { Text } = Typography;

/**
 * Attendance check-in/out time. The login session used to mark it is
 * secondary info for the admin, so it lives in a tooltip instead of a column.
 */
export function AttendanceTimeCell({
  time,
  session,
}: {
  time: string | null;
  session?: UserSessionSummary | null;
}) {
  if (!time) {
    return <Text style={{ color: colors.textSubtle }}>—</Text>;
  }

  const label = dayjs(time).format('HH:mm');
  if (!session) return <Text>{label}</Text>;

  return (
    <Tooltip
      title={
        <div style={{ fontSize: 12 }}>
          <div>Marcado desde la sesión iniciada el {formatLimaDateTime(session.loggedInAt)}</div>
          <div>Sesión {session.isActive ? 'activa' : 'cerrada'}</div>
        </div>
      }
    >
      <Text style={{ cursor: 'help' }}>
        {label} <InfoCircleOutlined style={{ fontSize: 11, color: colors.textMuted }} />
      </Text>
    </Tooltip>
  );
}
