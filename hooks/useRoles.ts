import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  rolesService,
  CreateRoleDto,
  UpdateRoleDto,
} from '@/services/roles.service';

export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES,
    queryFn: rolesService.getRoles,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleDto) => rolesService.createRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
      message.success('Rol creado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al crear rol');
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
      rolesService.updateRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
      message.success('Rol actualizado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al actualizar rol');
    },
  });
}

export function useDeactivateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesService.deactivateRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
      message.success('Rol desactivado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al desactivar rol');
    },
  });
}
