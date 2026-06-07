import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  vehiclesService,
  CreateVehicleTypeDto,
  UpdateVehicleTypeDto,
} from '@/services/vehicles.service';

function getErrorMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

function invalidateVehicleQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES_MANAGE });
  qc.invalidateQueries({ queryKey: ['rates'] });
}

export function useVehicles() {
  return useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesService.getVehicles,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVehiclesManage() {
  return useQuery({
    queryKey: QUERY_KEYS.VEHICLES_MANAGE,
    queryFn: vehiclesService.getVehiclesForManage,
  });
}

export function useCreateVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleTypeDto) => vehiclesService.createVehicleType(data),
    onSuccess: () => {
      invalidateVehicleQueries(qc);
      message.success('Tipo de vehículo creado');
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err) ?? 'Error al crear tipo de vehículo');
    },
  });
}

export function useUpdateVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleTypeDto }) =>
      vehiclesService.updateVehicleType(id, data),
    onSuccess: () => {
      invalidateVehicleQueries(qc);
      message.success('Tipo de vehículo actualizado');
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err) ?? 'Error al actualizar tipo de vehículo');
    },
  });
}

export function useDeactivateVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesService.deactivateVehicleType(id),
    onSuccess: () => {
      invalidateVehicleQueries(qc);
      message.success('Tipo de vehículo desactivado');
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err) ?? 'Error al desactivar tipo de vehículo');
    },
  });
}
