import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '@/lib/constants';
import { eventsService, CreatePlateEventDto } from '@/services/events.service';

export function usePlateEvents(plate: string, options?: { enabled?: boolean }) {
  const normalized = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const enabled = (options?.enabled ?? true) && normalized.length >= 3;

  return useQuery({
    queryKey: QUERY_KEYS.PLATE_EVENTS(normalized),
    queryFn: () => eventsService.getEventsByPlate(normalized),
    enabled,
  });
}

export function useCreatePlateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlateEventDto) => eventsService.createEvent(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PLATE_EVENTS(vars.plate) });
      message.success('Observación registrada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg ?? 'Error al registrar observación');
    },
  });
}
