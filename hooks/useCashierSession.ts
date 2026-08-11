'use client';

import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { QUERY_KEYS } from '@/lib/constants';
import { IDLE_SHIFT_CLOSE_NOTES, isShiftIdle } from '@/lib/cash-register';
import { cashRegisterService } from '@/services/cash-register.service';
import { useCheckOut } from '@/hooks/useAttendance';
import { useCashierWorkflow } from '@/hooks/useCashierWorkflow';

/**
 * Orchestrates caja vs asistencia on session end.
 * - Caja with activity → must cuadrar manually in /cash-register.
 * - Idle caja (no cobros) → auto-close on logout or attendance exit.
 * - Asistencia → separate step; auto on logout when applicable.
 */
export function useCashierSession() {
  const router = useRouter();
  const { logout } = useAuth();
  const workflow = useCashierWorkflow();
  const checkOut = useCheckOut();
  const qc = useQueryClient();

  const closeIdleShiftIfOpen = async () => {
    const shift = workflow.shift;
    if (!workflow.isShiftOpen || !shift || !isShiftIdle(shift)) return;

    await cashRegisterService.closeShift({
      balanceStatus: 'balanced',
      differenceAmount: 0,
      balanceNotes: null,
      extraNotes: IDLE_SHIFT_CLOSE_NOTES,
    });
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
    await qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE_TODAY });
  };

  const checkOutIfNeeded = async () => {
    if (workflow.isCheckedIn && !workflow.isCheckedOut) {
      await checkOut.mutateAsync(undefined);
    }
  };

  const finishLogout = async () => {
    await closeIdleShiftIfOpen();
    await checkOutIfNeeded();
    await logout();
  };

  const requestCheckOut = () => {
    if (workflow.hasShiftActivity && workflow.isShiftOpen) {
      Modal.warning({
        title: 'Caja con movimientos',
        content:
          'Debes cuadrar y cerrar la caja en Caja antes de marcar tu salida de asistencia.',
        okText: 'Entendido',
      });
      return;
    }

    Modal.confirm({
      title: '¿Marcar salida de asistencia?',
      content: workflow.isShiftOpen
        ? 'No hubo cobros en la caja; se cerrará automáticamente al registrar tu salida.'
        : 'Se registrará tu hora de salida de asistencia.',
      okText: 'Marcar salida',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        await closeIdleShiftIfOpen();
        await checkOutIfNeeded();
      },
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

    if (workflow.isShiftOpen && workflow.isIdleShift) {
      Modal.confirm({
        title: '¿Cerrar sesión?',
        content: workflow.isCheckedIn
          ? 'No hubo cobros en este turno. Se cerrará la caja automáticamente, se registrará tu salida de asistencia y luego cerrarás sesión.'
          : 'No hubo cobros en este turno. Se cerrará la caja automáticamente y luego cerrarás sesión.',
        okText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        okButtonProps: { danger: true },
        onOk: finishLogout,
      });
      return;
    }

    if (workflow.isCheckedIn && !workflow.isCheckedOut) {
      Modal.confirm({
        title: 'Salida de asistencia pendiente',
        content:
          'La caja ya está cerrada. Se registrará tu salida de asistencia y luego cerrarás sesión.',
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
    closeIdleShiftIfOpen,
    isPending: checkOut.isPending,
  };
}
