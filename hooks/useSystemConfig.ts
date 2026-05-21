import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import { systemConfigService, UpsertConfigDto } from '@/services/system-config.service';

export function useSystemConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM_CONFIG,
    queryFn: systemConfigService.getAll,
  });
}

export function useUpsertConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertConfigDto) => systemConfigService.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SYSTEM_CONFIG });
      message.success('Configuración guardada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al guardar configuración');
    },
  });
}
