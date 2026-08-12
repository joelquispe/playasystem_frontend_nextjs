'use client';

import { Alert, Button, Spin } from 'antd';
import { LoginOutlined, LogoutOutlined, WalletOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useCheckIn } from '@/hooks/useAttendance';
import { useCashierSession } from '@/hooks/useCashierSession';

interface CashierWorkflowBannerProps {
  context?: 'sistema' | 'cash-register' | 'general';
}

export function CashierWorkflowBanner({ context = 'general' }: CashierWorkflowBannerProps) {
  const { workflow, requestCheckOut, isPending } = useCashierSession();
  const checkIn = useCheckIn();

  if (!workflow.isCashier) return null;

  if (workflow.isLoading) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Cargando asistencia…"
        description={<Spin size="small" />}
      />
    );
  }

  if (workflow.phase === 'working') return null;

  if (workflow.canCheckIn || workflow.phase === 'check-in') {
    const resumed = !!workflow.attendance?.checkedOutAt;
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={resumed ? 'Nueva sesión — marca tu asistencia' : 'Marca tu asistencia para comenzar'}
        description={
          resumed
            ? 'Al marcar asistencia se abre una caja nueva para esta sesión.'
            : context === 'cash-register'
              ? 'No hay caja activa sin asistencia. Marca tu ingreso para abrir el turno de caja.'
              : 'Al marcar asistencia se abre tu turno de caja. Sin asistencia no hay caja activa.'
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

  if (workflow.canCloseShift && context !== 'cash-register') {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Cuadra la caja antes de salir"
        description="Hay cobros registrados. Ve a Caja para cuadrar. Al marcar salida también se cierra la caja."
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

  if (workflow.canCheckOut || workflow.phase === 'check-out') {
    return (
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="Marca tu salida de asistencia"
        description="Al marcar salida se cierra la caja. No se abrirá otra hasta que marques asistencia de nuevo."
        action={
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            loading={isPending}
            onClick={requestCheckOut}
          >
            Marcar salida
          </Button>
        }
      />
    );
  }

  return null;
}
