import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { vehiclesService } from '@/services/vehicles.service';

export function useVehicles() {
  return useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesService.getVehicles,
    staleTime: 5 * 60 * 1000, // 5 min — rarely changes
  });
}
