import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import {
  sessionsService,
  SessionsFilterParams,
} from '@/services/sessions.service';

function apiErrorMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

/** [Admin] Paginated sessions report */
export function useSessions(params?: SessionsFilterParams, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.SESSIONS((params ?? {}) as Record<string, unknown>),
    queryFn: () => sessionsService.list(params),
    enabled,
  });
}

/** Current user's active sessions */
export function useMySessions(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.SESSIONS_ME,
    queryFn: () => sessionsService.getMine(),
    enabled,
  });
}

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SESSION(id),
    queryFn: () => sessionsService.getById(id),
    enabled: !!id,
  });
}

/** [Admin] Revoke (force-close) a session */
export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsService.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      message.success('Sesión revocada');
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al revocar la sesión'));
    },
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sessionsService.revokeOthers(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      message.success(data.message);
    },
    onError: (err: unknown) => {
      message.error(apiErrorMessage(err, 'Error al cerrar otras sesiones'));
    },
  });
}
