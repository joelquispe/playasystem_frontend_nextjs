import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface RucIdentity {
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  telefonos: string[];
  estado: string;
  condicion: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo?: string;
  capital?: string;
}

export interface DniIdentity {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  codVerifica: string;
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
