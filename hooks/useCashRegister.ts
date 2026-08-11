import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  cashRegisterService,
  AddExpenseDto,
  CloseShiftDto,
} from '@/services/cash-register.service';

export function useCurrentShift(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT,
    queryFn: cashRegisterService.getCurrentShift,
    enabled,
    refetchInterval: 60_000,
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al registrar gasto');
    },
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CloseShiftDto) => cashRegisterService.closeShift(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE_TODAY });
      message.success('Turno de caja cerrado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al cerrar turno');
    },
  });
}
