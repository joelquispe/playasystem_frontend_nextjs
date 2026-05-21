import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  subscribersService,
  CreateSubscriberDto,
  RenewSubscriberDto,
  UpdateSubscriberDto,
} from '@/services/subscribers.service';
import { SubscriberStatus } from '@/types/api';

export function useSubscribers(status?: SubscriberStatus) {
  return useQuery({
    queryKey: QUERY_KEYS.SUBSCRIBERS(status),
    queryFn: () => subscribersService.getAll(status),
  });
}

export function useCreateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubscriberDto) => subscribersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      message.success('Abonado registrado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al registrar abonado');
    },
  });
}

export function useUpdateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriberDto }) =>
      subscribersService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      message.success('Abonado actualizado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al actualizar abonado');
    },
  });
}

export function useRenewSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenewSubscriberDto }) =>
      subscribersService.renew(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      message.success('Abono renovado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al renovar abono');
    },
  });
}

export function useCancelSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscribersService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      message.success('Abonado cancelado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al cancelar abonado');
    },
  });
}
