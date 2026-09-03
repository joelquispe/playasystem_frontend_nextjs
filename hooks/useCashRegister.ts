import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  cashRegisterService,
  AddExpenseDto,
  CloseShiftDto,
} from '@/services/cash-register.service';

function apiErrorMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export function useCurrentShift(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT,
    queryFn: cashRegisterService.getCurrentShift,
    enabled,
    refetchInterval: 60_000,
  });
}

/** Explicitly open a cash shift (PLAYA-301 / PLAYA-304) */
export function useOpenShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cashRegisterService.openShift,
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.CASH_REGISTER_CURRENT, data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      message.success('Turno de caja abierto');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al abrir turno de caja'));
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddExpenseDto) => cashRegisterService.addExpense(data),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.CASH_REGISTER_CURRENT, data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      message.success('Gasto registrado');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al registrar gasto'));
    },
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CloseShiftDto) => cashRegisterService.closeShift(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      // Attendance is NOT closed on cuadre (PLAYA-301)
      message.success('Turno de caja cerrado correctamente');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al cerrar turno'));
    },
  });
}
