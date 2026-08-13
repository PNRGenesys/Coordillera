export function formatPrice(valueInCents: number, currency = 'COP', locale = 'es-CO'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(valueInCents / 100)
}
