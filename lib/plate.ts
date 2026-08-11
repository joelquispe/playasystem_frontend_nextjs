/**
 * Normalizes a vehicle plate for comparison/lookup.
 * ABC-123, ABC 123 and ABC123 all become ABC123.
 */
export function normalizePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** True if `plate` matches another plate ignoring hyphens, spaces and case. */
export function platesEqual(a: string, b: string): boolean {
  return normalizePlate(a) === normalizePlate(b);
}
