import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  clientsService,
  ClientEventsParams,
  CreateClientDto,
  UpdateClientDto,
} from '@/services/clients.service';

export function useClients() {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsService.getClients,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENT(id ?? ''),
    queryFn: () => clientsService.getClientById(id!),
    enabled: !!id,
  });
}

export function useClientEvents(id: string | undefined, params?: ClientEventsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENT_EVENTS(id ?? '', {
      date: params?.date,
      eventColor: params?.eventColor,
    }),
    queryFn: () => clientsService.getClientEvents(id!, params),
    enabled: !!id,
  });
}

export function useClientByPlate(plate: string, options?: { enabled?: boolean }) {
  const normalized = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const enabled = (options?.enabled ?? true) && normalized.length >= 6;

  return useQuery({
    queryKey: QUERY_KEYS.CLIENT_BY_PLATE(normalized),
    queryFn: () => clientsService.getClientByPlate(normalized),
    enabled,
    staleTime: 0,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.createClient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      message.success('Cliente registrado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al registrar cliente');
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsService.updateClient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      message.success('Cliente actualizado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al actualizar cliente');
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsService.deleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      message.success('Cliente eliminado permanentemente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al eliminar cliente');
    },
  });
}
