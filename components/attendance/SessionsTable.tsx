'use client';

import { Button, Popconfirm, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { StopOutlined } from '@ant-design/icons';
import {
  PaginationMeta,
  SessionRevokeReason,
  UserSession,
} from '@/types/api';
import { SESSION_REVOKE_REASON_LABELS } from '@/lib/constants';
import { formatLimaDateTime } from '@/lib/datetime';
import { getSessionId } from '@/lib/auth';
import { cardStyle, colors } from '@/lib/theme';
import { useRevokeSession } from '@/hooks/useSessions';

const { Text } = Typography;

interface SessionsTableProps {
  items: UserSession[];
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
  /** Show admin revoke action */
  allowRevoke?: boolean;
}

export function SessionsTable({
  items,
  meta,
  loading,
  onPageChange,
  allowRevoke = true,
}: SessionsTableProps) {
  const revoke = useRevokeSession();
  const currentSessionId = getSessionId();

  const columns: ColumnsType<UserSession> = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_: unknown, r: UserSession) => (
        <div>
          <Text style={{ color: colors.text, display: 'block' }}>
            {r.user?.fullName ?? '—'}
          </Text>
          {r.user?.username && (
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              @{r.user.username}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Inicio sesión',
      dataIndex: 'loggedInAt',
      key: 'loggedInAt',
      width: 150,
      render: (v: string) => (
        <Text style={{ fontSize: 12 }}>{formatLimaDateTime(v)}</Text>
      ),
    },
    {
      title: 'Cierre sesión',
      dataIndex: 'loggedOutAt',
      key: 'loggedOutAt',
      width: 150,
      render: (v: string | null | undefined) =>
        v ? (
          <Text style={{ fontSize: 12 }}>{formatLimaDateTime(v)}</Text>
        ) : (
          <Text style={{ color: colors.textSubtle }}>—</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (active: boolean, r: UserSession) =>
        active ? (
          <Tag color="success">Activa</Tag>
        ) : (
          <Tooltip
            title={
              r.revokedReason
                ? SESSION_REVOKE_REASON_LABELS[r.revokedReason as SessionRevokeReason] ??
                  r.revokedReason
                : undefined
            }
          >
            <Tag>Cerrada</Tag>
          </Tooltip>
        ),
    },
    ...(allowRevoke
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: UserSession) =>
              r.id === currentSessionId ? (
                <Tag color="blue">Tu sesión</Tag>
              ) : r.isActive ? (
                <Popconfirm
                  title="¿Forzar cierre de esta sesión?"
                  description="El usuario será expulsado del sistema en menos de un minuto. Su asistencia y su caja no se cierran."
                  okText="Revocar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => revoke.mutate(r.id)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    loading={revoke.isPending}
                  >
                    Revocar
                  </Button>
                </Popconfirm>
              ) : null,
          } as ColumnsType<UserSession>[number],
        ]
      : []),
  ];

  const pagination: TablePaginationConfig | false = meta
    ? {
        current: meta.page,
        pageSize: meta.limit,
        total: meta.totalItems,
        showSizeChanger: false,
        onChange: onPageChange,
      }
    : false;

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={pagination}
      size="small"
      scroll={{ x: 800 }}
      style={cardStyle}
    />
  );
}
