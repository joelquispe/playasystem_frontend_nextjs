'use client';

import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { QUERY_KEYS } from '@/lib/constants';
import { useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/**
 * Orchestrates attendance vs caja actions (PLAYA-301 separation):
 *
 *  - Attendance (check-in / check-out) is independent of caja.
 *  - Caja is opened explicitly; closing it does NOT close attendance.
 *  - Logout (PLAYA-303) does NOT auto check-out. Worker must mark exit themselves.
 *  - If caja has cobros the worker must cuadrar before checking out or logging out.
 */
export function useCashierSession() {
  const router = useRouter();
  const { logout } = useAuth();
  const workflow = useCashierWorkflow();
  const checkOut = useCheckOut();
  const qc = useQueryClient();

  const refreshAfterCheckOut = async () => {
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE_TODAY });
  };

  const doCheckOut = async () => {
    await checkOut.mutateAsync(undefined);
    await refreshAfterCheckOut();
  };

  const requestCheckOut = () => {
    if (workflow.hasShiftActivity && workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja con movimientos',
        content:
          'Hay cobros registrados. Debes cuadrar la caja antes de marcar tu salida.',
        okText: 'Ir a Caja',
        cancelText: 'Cancelar',
        onOk: () => router.push('/cash-register'),
      });
      return;
    }

    Modal.confirm({
      title: '¿Marcar salida de asistencia?',
      content: workflow.isShiftOpen
        ? 'Se registrará tu salida y se cerrará el turno de caja activo.'
        : 'Se registrará tu salida de asistencia.',
      okText: 'Marcar salida',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: doCheckOut,
    });
  };

  /**
   * PLAYA-303: Logout ≠ check-out.
   * Closing the session does not auto-register attendance exit.
   * The worker marks their own exit from the AppHeader button.
   */
  const requestLogout = () => {
    if (!workflow.isCashier) {
      logout();
      return;
    }

    if (workflow.hasShiftActivity && workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja con movimientos',
        content:
          'Hay cobros registrados. Debes cuadrar la caja antes de cerrar sesión.',
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
          'Tu asistencia seguirá abierta. Marca tu salida desde el botón en la barra superior cuando termines tu jornada.',
        okText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        onOk: logout,
      });
      return;
    }

    logout();
  };

  return {
    workflow,
    requestLogout,
    requestCheckOut,
    isPending: checkOut.isPending,
  };
}
