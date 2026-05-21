import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  clientsService,
  CreateClientDto,
  UpdateClientDto,
} from '@/services/clients.service';

export function useClients() {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsService.getClients,
  });
}

export function useClientByPlate(plate: string) {
  return useQuery({
    queryKey: ['clients', 'plate', plate],
    queryFn: () => clientsService.getClientByPlate(plate),
    enabled: plate.length >= 3,
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
      message.success('Cliente eliminado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al eliminar cliente');
    },
  });
}
