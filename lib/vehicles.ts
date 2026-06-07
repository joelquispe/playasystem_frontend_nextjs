import { Rate, RateType, VehicleType } from '@/types/api';

export const VEHICLE_ICON_OPTIONS = [
  { value: 'moto', label: 'Moto' },
  { value: 'auto', label: 'Auto' },
  { value: 'suv', label: 'SUV' },
  { value: 'pickup_large', label: 'Camioneta grande' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Camión' },
];

export function getVehicleRates(vehicle: VehicleType | undefined, rateType?: RateType): Rate[] {
  const rates = (vehicle?.rates ?? []).filter((rate) => rate.isActive);
  if (!rateType) return rates;
  return rates.filter((rate) => rate.rateType === rateType);
}

export function getDefaultHourRate(vehicle: VehicleType | undefined): Rate | undefined {
  const hourRates = getVehicleRates(vehicle, 'hour_fraction');
  return pickDefaultRate(hourRates);
}

export function pickDefaultRate(rates: Rate[]): Rate | undefined {
  return [...rates]
    .filter((rate) => rate.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder || Number(a.amount) - Number(b.amount))[0];
}

export function formatRateOption(rate: Rate): { value: string; label: string } {
  return {
    value: rate.id,
    label: `${rate.label || rate.rateType} — s/. ${parseFloat(rate.amount).toFixed(2)}`,
  };
}
