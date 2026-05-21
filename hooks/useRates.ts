import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { ratesService } from '@/services/rates.service';
import { RateType } from '@/types/api';

export function useRates(vehicleTypeId?: string, rateType?: RateType) {
  return useQuery({
    queryKey: QUERY_KEYS.RATES(vehicleTypeId, rateType),
    queryFn: () => ratesService.getRates({ vehicleTypeId, rateType }),
    staleTime: 5 * 60 * 1000,
  });
}
