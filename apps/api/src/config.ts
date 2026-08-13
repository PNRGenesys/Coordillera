const MINUTE_IN_MS = 60 * 1000

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const config = {
  currency: process.env.STORE_CURRENCY ?? 'COP',
  reservationTtlMs: readNumber('RESERVATION_TTL_MINUTES', 20) * MINUTE_IN_MS,
  catalogPageSize: readNumber('CATALOG_PAGE_SIZE', 24),
  catalogMaxPageSize: readNumber('CATALOG_MAX_PAGE_SIZE', 60),
  cartMaxQuantityPerItem: readNumber('CART_MAX_QUANTITY_PER_ITEM', 20),
  lowStockThreshold: readNumber('LOW_STOCK_THRESHOLD', 5),
}
