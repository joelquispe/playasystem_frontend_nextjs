import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { ratesService } from '@/services/rates.service';
import { RateType } from '@/types/api';

interface UseRatesOptions {
  enabled?: boolean;
}

export function useRates(
  vehicleTypeId?: string,
  rateType?: RateType,
  options?: UseRatesOptions,
) {
  return useQuery({
    queryKey: QUERY_KEYS.RATES(vehicleTypeId, rateType),
    queryFn: () => ratesService.getRates({ vehicleTypeId, rateType }),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
