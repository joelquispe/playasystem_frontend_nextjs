'use client';

import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { QUERY_KEYS } from '@/lib/constants';
import { useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/**
 * Orchestrates caja vs asistencia.
 * - Check-in (backend) opens a new caja.
 * - Cuadre (close shift) also checks out attendance automatically.
 * - Check-out (backend) closes the open caja if it is still open.
 * - Caja with cobros → must cuadrar in /cash-register before exit.
 */
export function useCashierSession() {
  const router = useRouter();
  const { logout } = useAuth();
  const workflow = useCashierWorkflow();
  const checkOut = useCheckOut();
  const qc = useQueryClient();

  const refreshAfterExit = async () => {
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE_TODAY });
  };

  const checkOutIfNeeded = async () => {
    if (!workflow.hasOpenSession) return;
    await checkOut.mutateAsync(undefined);
    await refreshAfterExit();
  };

  const finishLogout = async () => {
    await checkOutIfNeeded();
    await logout();
  };

  const requestCheckOut = () => {
    if (workflow.hasShiftActivity && workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja con movimientos',
        content:
          'Hay cobros registrados. Debes cuadrar la caja en Caja. Al cuadrar también se marca la salida de asistencia.',
        okText: 'Ir a Caja',
        cancelText: 'Cancelar',
        onOk: () => router.push('/cash-register'),
      });
      return;
    }

    Modal.confirm({
      title: '¿Marcar salida de asistencia?',
      content:
        'Se registrará tu salida y se cerrará la caja del turno. Después podrás marcar una nueva asistencia (abre caja nueva).',
      okText: 'Marcar salida',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: checkOutIfNeeded,
    });
  };

  const requestLogout = () => {
    if (!workflow.isCashier) {
      logout();
      return;
    }

    if (workflow.hasShiftActivity && workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja con movimientos',
        content:
          'Hay cobros registrados. Debes cuadrar la caja y cerrar el turno antes de cerrar sesión.',
        okText: 'Ir a Caja',
        cancelText: 'Cancelar',
        onOk: () => router.push('/cash-register'),
      });
      return;
    }

    if (workflow.hasOpenSession) {
      Modal.confirm({
        title: '¿Cerrar sesión?',
        content:
          'Se marcará tu salida de asistencia y se cerrará la caja. No quedará turno activo.',
        okText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        okButtonProps: { danger: true },
        onOk: finishLogout,
      });
      return;
    }

    logout();
  };

  return {
    workflow,
    requestLogout,
    requestCheckOut,
    finishLogout,
    isPending: checkOut.isPending,
  };
}
