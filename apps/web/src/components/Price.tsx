import { formatPrice } from '../lib/format-price'
import { useTranslation } from '../lib/use-translation'

export type PriceProps = {
  minCents: number
  maxCents: number
  currency?: string
}

export function Price({ minCents, maxCents, currency }: PriceProps) {
  const { numberLocale, t } = useTranslation()
  const price = formatPrice(minCents, currency, numberLocale)
  if (minCents === maxCents) return <>{price}</>
  return <>{t('product.priceFrom', { price })}</>
}
