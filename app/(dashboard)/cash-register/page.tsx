'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Divider,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CloseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCurrentShift } from '@/hooks/useCashRegister';
import { useTickets } from '@/hooks/useTickets';
import { ShiftSummaryCard } from '@/components/cash-register/ShiftSummaryCard';
import { AddExpenseModal } from '@/components/cash-register/AddExpenseModal';
import { CloseShiftModal } from '@/components/cash-register/CloseShiftModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { cardStyle, colors } from '@/lib/theme';

const { Text } = Typography;

export default function CashRegisterPage() {
  const { data: shift, isLoading, isFetching, refetch } = useCurrentShift();
  const { data: pendingTickets = [] } = useTickets(true);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const isOpen = shift && !shift.closedAt;

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle={
          isOpen ? (
            <Tag color="green" style={{ fontWeight: 600 }}>
              Turno abierto · {dayjs(shift.createdAt).format('DD/MM/YYYY HH:mm')}
            </Tag>
          ) : shift ? (
            <Tag color="red" style={{ fontWeight: 600 }}>
              Turno cerrado
            </Tag>
          ) : null
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>
              Actualizar
            </Button>
            {isOpen && (
              <>
                <Button icon={<PlusOutlined />} onClick={() => setExpenseOpen(true)}>
                  Agregar gasto
                </Button>
                <Button icon={<CloseCircleOutlined />} danger onClick={() => setCloseOpen(true)}>
                  Cerrar turno
                </Button>
              </>
            )}
          </Space>
        }
      />

      {isLoading ? (
        <Skeleton active style={{ ...cardStyle, padding: 24 }} />
      ) : !shift ? (
        <Empty
          description={
            <Text style={{ color: colors.textMuted }}>No se encontró turno activo para este usuario</Text>
          }
          style={{ marginTop: 80 }}
        />
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            <ShiftSummaryCard shift={shift} />
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ ...cardStyle, padding: 20, height: '100%' }}>
              <Text strong style={{ color: colors.text, fontSize: 14, display: 'block', marginBottom: 16 }}>
                Resumen rápido
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Tickets pendientes</Text>}
                  value={pendingTickets.length}
                  valueStyle={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}
                />

                <Divider style={{ margin: '4px 0', borderColor: colors.divider }} />

                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Total recaudado</Text>}
                  prefix="S/."
                  value={parseFloat(shift.totalAmount).toFixed(2)}
                  valueStyle={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}
                />

                <Divider style={{ margin: '4px 0', borderColor: colors.divider }} />

                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Gastos extra</Text>}
                  prefix="S/."
                  value={parseFloat(shift.extraExpenses).toFixed(2)}
                  valueStyle={{ color: '#ef4444', fontSize: 22, fontWeight: 700 }}
                />

                <Divider style={{ margin: '4px 0', borderColor: colors.divider }} />

                <Statistic
                  title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>Descuentos</Text>}
                  prefix="S/."
                  value={parseFloat(shift.discountsTotal).toFixed(2)}
                  valueStyle={{ color: colors.textMuted, fontSize: 22, fontWeight: 700 }}
                />
              </div>

              {!isOpen && shift.closedAt && (
                <>
                  <Divider style={{ borderColor: colors.divider }} />
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        Turno cerrado el {dayjs(shift.closedAt).format('DD/MM/YYYY [a las] HH:mm')}
                      </Text>
                    }
                  />
                </>
              )}
            </div>
          </Col>
        </Row>
      )}

      <AddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <CloseShiftModal open={closeOpen} onClose={() => setCloseOpen(false)} shift={shift ?? null} />
    </>
  );
}
