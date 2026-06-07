import { useQuery } from '@tanstack/react-query';
import { identityService } from '@/services/identity.service';

/**
 * Look up taxpayer info by RUC from APIS Peru.
 * Only runs when `ruc` is exactly 11 digits.
 */
export function useTaxpayer(ruc: string) {
  return useQuery({
    queryKey: ['identity', 'ruc', ruc],
    queryFn: () => identityService.getByRuc(ruc),
    enabled: /^\d{11}$/.test(ruc),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Look up person name by DNI from APIS Peru.
 * Only runs when `dni` is exactly 8 digits.
 */
export function usePersonByDni(dni: string) {
  return useQuery({
    queryKey: ['identity', 'dni', dni],
    queryFn: () => identityService.getByDni(dni),
    enabled: /^\d{8}$/.test(dni),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
