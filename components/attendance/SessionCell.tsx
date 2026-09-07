'use client';

import { Tooltip, Typography } from 'antd';
import { UserSessionSummary } from '@/types/api';
import { formatLimaDateTime } from '@/lib/datetime';
import { colors } from '@/lib/theme';

const { Text } = Typography;

/** Compact cell: session short id + login time (tooltip with full id / IP). */
export function SessionCell({
  session,
  sessionId,
}: {
  session?: UserSessionSummary | null;
  sessionId?: string | null;
}) {
  const id = session?.id ?? sessionId;
  if (!id) {
    return <Text style={{ color: colors.textSubtle }}>—</Text>;
  }

  const short = `${id.slice(0, 8)}…`;
  const loginAt = session?.loggedInAt
    ? formatLimaDateTime(session.loggedInAt)
    : null;

  return (
    <Tooltip
      title={
        <div style={{ fontSize: 12 }}>
          <div>ID: {id}</div>
          {loginAt && <div>Inicio sesión: {loginAt}</div>}
          {session?.ipAddress && <div>IP: {session.ipAddress}</div>}
          {session && (
            <div>Estado: {session.isActive ? 'Activa' : 'Cerrada'}</div>
          )}
        </div>
      }
    >
      <div style={{ lineHeight: 1.35 }}>
        <Text code style={{ fontSize: 11 }}>
          {short}
        </Text>
        {loginAt && (
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              color: colors.textMuted,
              marginTop: 2,
            }}
          >
            {loginAt}
          </Text>
        )}
      </div>
    </Tooltip>
  );
}
