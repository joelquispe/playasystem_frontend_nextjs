import { apiClient } from '@/lib/axios';
import { ApiResponse, EventColor, PlateEvent } from '@/types/api';

export interface CreatePlateEventDto {
  plate: string;
  eventColor: EventColor;
  observation: string;
  ticketId?: string;
}

export const eventsService = {
  getEventsByPlate: async (plate: string): Promise<PlateEvent[]> => {
    const res = await apiClient.get<ApiResponse<PlateEvent[]>>('/events', {
      params: { plate },
    });
    return res.data.data;
  },

  createEvent: async (data: CreatePlateEventDto): Promise<PlateEvent> => {
    const res = await apiClient.post<ApiResponse<PlateEvent>>('/events', data);
    return res.data.data;
  },
};
