import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  usersService,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from '@/services/users.service';

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersService.getUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      message.success('Usuario creado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al crear usuario');
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      message.success('Usuario actualizado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al actualizar usuario');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordDto }) =>
      usersService.changePassword(id, data),
    onSuccess: () => {
      message.success('Contraseña actualizada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al cambiar contraseña');
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      message.success('Usuario desactivado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al desactivar usuario');
    },
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersService.adminResetPassword(id, newPassword),
    onSuccess: () => {
      message.success('Contraseña restablecida');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al restablecer contraseña');
    },
  });
}
