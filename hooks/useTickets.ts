import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  ticketsService,
  AdditionalChargeDto,
  CancelTicketDto,
  ChargeTicketDto,
  CreateTicketDto,
  ManualTicketDto,
  PostPaymentReceiptDto,
} from '@/services/tickets.service';

export function useTickets(pending?: boolean) {
  return useQuery({
    queryKey: pending ? QUERY_KEYS.PENDING_TICKETS : QUERY_KEYS.TICKETS,
    queryFn: () => ticketsService.getTickets(pending),
    refetchInterval: 30_000,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.TICKET(id),
    queryFn: () => ticketsService.getTicketById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketDto) => ticketsService.createTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
      message.success('Ticket creado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al crear ticket');
    },
  });
}

export function useChargeTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChargeTicketDto }) =>
      ticketsService.chargeTicket(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTER_CURRENT });
      message.success('Pago registrado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al cobrar ticket');
    },
  });
}

export function useCancelTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelTicketDto }) =>
      ticketsService.cancelTicket(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
      message.success('Ticket cancelado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al cancelar ticket');
    },
  });
}

export function useRevertTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketsService.revertTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      message.success('Ticket revertido a pendiente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al revertir ticket');
    },
  });
}

export function useToggleKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketsService.toggleKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error');
    },
  });
}

export function useAdditionalCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdditionalChargeDto }) =>
      ticketsService.addAdditionalCharge(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
      message.success('Cargo adicional agregado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al agregar cargo');
    },
  });
}

export function useManualTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualTicketDto) => ticketsService.createManualTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_TICKETS });
      message.success('Ticket manual registrado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al crear ticket manual');
    },
  });
}

export function usePostPaymentReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PostPaymentReceiptDto }) =>
      ticketsService.postPaymentReceipt(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
      message.success('Comprobante emitido correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al emitir comprobante');
    },
  });
}

export function useScanTicket() {
  return useMutation({
    mutationFn: (code: string) => ticketsService.getTicketByCode(code),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Ticket no encontrado');
    },
  });
}
