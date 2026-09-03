'use client';

import { Alert, Button, Spin } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/**
 * PLAYA-302: Attendance buttons (check-in / check-out) live exclusively in
 * AppHeader. This banner shows only cash-register operational guidance.
 */
export function CashierWorkflowBanner() {
  const workflow = useCashierWorkflow();

  if (!workflow.isCashier) return null;

  if (workflow.isLoading) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Cargando turno…"
        description={<Spin size="small" />}
      />
    );
  }

  // Normal operation — nothing to show.
  if (workflow.phase === 'working') return null;

  // Attendance open but no caja → guide to open one.
  if (workflow.phase === 'open-shift') {
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Sin turno de caja activo"
        description="Tienes asistencia marcada pero no hay un turno de caja abierto. Ábrelo para poder cobrar tickets."
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

  // Caja has activity → must cuadrar before checking out.
  if (workflow.canCloseShift) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Cuadra la caja antes de salir"
        description="Hay cobros registrados. Ve a Caja para cuadrar el turno."
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

  return null;
}
