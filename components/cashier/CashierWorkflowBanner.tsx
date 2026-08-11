'use client';

import { Alert, Button, Space } from 'antd';
import { LoginOutlined, LogoutOutlined, WalletOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useCheckIn, useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

interface CashierWorkflowBannerProps {
  /** Where the banner is shown — adjusts messaging */
  context?: 'sistema' | 'cash-register' | 'general';
}

export function CashierWorkflowBanner({ context = 'general' }: CashierWorkflowBannerProps) {
  const workflow = useCashierWorkflow();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  if (!workflow.isCashier || workflow.isLoading || workflow.phase === 'working' || workflow.phase === 'done') {
    return null;
  }

  if (workflow.phase === 'check-in') {
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Turno abierto — marca tu asistencia para comenzar"
        description={
          context === 'cash-register'
            ? 'Tu turno de caja ya está activo. Marca tu ingreso de asistencia antes de operar o cerrar la caja.'
            : 'Al iniciar sesión se abre tu turno de caja. Marca tu asistencia de ingreso para usar el sistema.'
        }
        action={
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={checkIn.isPending}
            onClick={() => checkIn.mutate(undefined)}
          >
            Marcar asistencia
          </Button>
        }
      />
    );
  }

  if (workflow.phase === 'close-shift') {
    if (context === 'cash-register') return null;

    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Cierra tu turno en Caja"
        description="Al finalizar tu jornada, cuadra la caja, cierra el turno y luego marca tu salida de asistencia."
        action={
          <Link href="/cash-register">
            <Button type="primary" icon={<WalletOutlined />}>
              Ir a Caja
            </Button>
          </Link>
        }
      />
    );
  }

  if (workflow.phase === 'check-out') {
    return (
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="Turno cerrado — marca tu salida de asistencia"
        description="La caja ya fue cuadrada. Registra tu salida y luego cierra sesión."
        action={
          <Space>
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              loading={checkOut.isPending}
              onClick={() => checkOut.mutate(undefined)}
            >
              Marcar salida
            </Button>
          </Space>
        }
      />
    );
  }

  return null;
}
