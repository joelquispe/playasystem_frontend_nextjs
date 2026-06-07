import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface RucIdentity {
  ruc: string;
  razonSocial: string;
  direccion: string | null;
  direccionCompleta: string | null;
  estado: string | null;
  condicion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  ubigeo: string | null;
}

export interface DniIdentity {
  dni: string;
  nombreCompleto: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  codVerifica: string | null;
}

export interface TaxpayerInfo extends RucIdentity {
  businessName: string;
}

export const identityService = {
  getByRuc: async (ruc: string): Promise<TaxpayerInfo> => {
    const res = await apiClient.get<ApiResponse<RucIdentity>>(`/identity/ruc/${ruc}`);
    return { ...res.data.data, businessName: res.data.data.razonSocial };
  },

  getByDni: async (dni: string): Promise<DniIdentity> => {
    const res = await apiClient.get<ApiResponse<DniIdentity>>(`/identity/dni/${dni}`);
    return res.data.data;
  },
};

/** Builds display name from a DNI lookup result. */
export function formatDniDisplayName(person: DniIdentity): string {
  if (person.nombreCompleto?.trim()) return person.nombreCompleto.trim();
  return [person.nombres, person.apellidoPaterno, person.apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim();
}
