'use client';

import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { QUERY_KEYS } from '@/lib/constants';
import { useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/**
 * Orchestrates attendance vs caja actions.
 *
 * PLAYA-301: Attendance and caja are independent lifecycles.
 * PLAYA-303: Logout does NOT auto check-out attendance.
 * PLAYA-307: Cannot check-out or logout while caja is open — must cuadrar first.
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

  /**
   * PLAYA-307: If caja is open, redirect to cuadrar first.
   * Otherwise proceed with check-out.
   */
  const requestCheckOut = () => {
    if (workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja abierta',
        content:
          'Debes cerrar/cuadrar tu turno de caja antes de poder marcar tu salida de asistencia.',
        okText: 'Ir a Caja',
        cancelText: 'Cancelar',
        onOk: () => router.push('/cash-register'),
      });
      return;
    }

    Modal.confirm({
      title: '¿Marcar salida de asistencia?',
      content: 'Se registrará tu salida de asistencia.',
      okText: 'Marcar salida',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: doCheckOut,
    });
  };

  /**
   * PLAYA-307: If caja is open, must cuadrar before logout.
   * PLAYA-303: If caja is closed (or absent), logout directly without auto check-out.
   */
  const requestLogout = () => {
    if (!workflow.isCashier) {
      logout();
      return;
    }

    if (workflow.isShiftOpen) {
      Modal.confirm({
        title: 'Caja abierta',
        content:
          'Debes cerrar/cuadrar tu turno de caja antes de cerrar sesión.',
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
          'Tu asistencia seguirá activa. Marca tu salida desde la barra superior cuando termines tu jornada.',
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
