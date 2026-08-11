'use client';

import { Alert, Button } from 'antd';
import { LoginOutlined, LogoutOutlined, WalletOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useCheckIn } from '@/hooks/useAttendance';
import { useCashierSession } from '@/hooks/useCashierSession';

interface CashierWorkflowBannerProps {
  /** Where the banner is shown — adjusts messaging */
  context?: 'sistema' | 'cash-register' | 'general';
}

export function CashierWorkflowBanner({ context = 'general' }: CashierWorkflowBannerProps) {
  const { workflow, requestCheckOut, isPending } = useCashierSession();
  const checkIn = useCheckIn();

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
        message="Cuadra la caja antes de salir"
        description="Hay cobros registrados. Ve a Caja para cuadrar y cerrar el turno. Después marca tu salida de asistencia."
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
    const idleOpen = workflow.isIdleShift;
    return (
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message={idleOpen ? 'Sin cobros — puedes marcar salida o cerrar sesión' : 'Caja cerrada — marca tu salida de asistencia'}
        description={
          idleOpen
            ? 'La caja no registró movimientos. Al marcar salida se cerrará el turno automáticamente.'
            : 'La caja ya fue cuadrada. Registra tu salida de asistencia (distinto del cierre de caja).'
        }
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
