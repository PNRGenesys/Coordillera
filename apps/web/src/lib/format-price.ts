const CENTS_PER_UNIT = 100

export function formatPrice(valueInCents: number, currency = 'COP', locale = 'es-CO'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(centsToUnits(valueInCents))
}

/** Prices are stored in cents, but the admin panel edits them in whole currency units. */
export function centsToUnits(valueInCents: number): number {
  return valueInCents / CENTS_PER_UNIT
}

export function unitsToCents(value: number): number {
  return Math.round(value * CENTS_PER_UNIT)
}
