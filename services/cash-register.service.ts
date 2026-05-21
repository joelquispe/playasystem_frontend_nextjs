import { apiClient } from '@/lib/axios';
import { ApiResponse, BalanceStatus, CashRegister } from '@/types/api';

export interface AddExpenseDto {
  extraExpenses?: number;
  extraNotes?: string;
}

export interface CloseShiftDto {
  balanceStatus: BalanceStatus;
  differenceAmount?: number;
  balanceNotes?: string | null;
  extraNotes?: string;
}

export const cashRegisterService = {
  getCurrentShift: async (): Promise<CashRegister> => {
    const res = await apiClient.get<ApiResponse<CashRegister>>('/cash-register/current');
    return res.data.data;
  },

  getShiftById: async (id: string): Promise<CashRegister> => {
    const res = await apiClient.get<ApiResponse<CashRegister>>(`/cash-register/${id}`);
    return res.data.data;
  },

  addExpense: async (data: AddExpenseDto): Promise<CashRegister> => {
    const res = await apiClient.post<ApiResponse<CashRegister>>('/cash-register/expense', data);
    return res.data.data;
  },

  closeShift: async (data: CloseShiftDto): Promise<CashRegister> => {
    const res = await apiClient.post<ApiResponse<CashRegister>>('/cash-register/close', data);
    return res.data.data;
  },
};
