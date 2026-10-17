'use client';

import { Alert, Button, Spin } from 'antd';
import { PlusCircleOutlined, WalletOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';
import { useOpenShift } from '@/hooks/useCashRegister';

const CASH_REGISTER_PATH = '/cash-register';

/**
 * PLAYA-302: Attendance buttons (check-in / check-out) live exclusively in
 * AppHeader. This banner shows only cash-register operational guidance and
 * owns the single "Abrir caja" action of the app.
 */
export function CashierWorkflowBanner() {
  const workflow = useCashierWorkflow();
  const openShift = useOpenShift();
  const router = useRouter();
  const pathname = usePathname();
  const isOnCashRegister = pathname === CASH_REGISTER_PATH;

  if (!workflow.isCashier) return null;

  if (workflow.isLoading) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Cargando turno…"
        description={<Spin size="small" />}
      />
    );
  }

  // Normal operation — nothing to show.
  if (workflow.phase === 'working') return null;

  // Attendance open but no caja → open one directly.
  if (workflow.phase === 'open-shift') {
    const handleOpenShift = () =>
      openShift.mutate(undefined, {
        onSuccess: () => {
          if (!isOnCashRegister) router.push(CASH_REGISTER_PATH);
        },
      });

    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        title="Sin turno de caja activo"
        description="Abre un turno de caja para poder cobrar tickets. Si ya terminaste tu jornada, marca tu salida desde el menú de tu usuario (arriba a la derecha)."
        action={
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            loading={openShift.isPending}
            onClick={handleOpenShift}
          >
            Abrir caja
          </Button>
        }
      />
    );
  }

  // Caja has activity → must cuadrar before checking out.
  if (workflow.canCloseShift && !isOnCashRegister) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Cuadra la caja antes de salir"
        description="Hay cobros registrados. Cuadra el turno antes de marcar tu salida."
        action={
          <Link href={CASH_REGISTER_PATH}>
            <Button type="primary" icon={<WalletOutlined />}>
              Cuadrar caja
            </Button>
          </Link>
        }
      />
    );
  }

  return null;
}
