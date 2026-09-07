import { styled } from '@linaria/react'
import { formatPrice } from '../lib/format-price'
import { useTranslation } from '../lib/use-translation'

const DiscountWrapper = styled.span`
  align-items: baseline;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`
const ComparePrice = styled.span`
  color: var(--color-accent);
  text-decoration: line-through;
`
const DiscountBadge = styled.span`
  background: var(--color-ink);
  color: var(--color-background);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
`

export type PriceProps = {
  minCents: number
  maxCents: number
  currency?: string
  /** Regular price before the discount; only rendered when it prices a single value, not a range. */
  compareAtCents?: number | null
}

export function Price({ minCents, maxCents, currency, compareAtCents }: PriceProps) {
  const { numberLocale, t } = useTranslation()
  const price = formatPrice(minCents, currency, numberLocale)
  const hasDiscount = minCents === maxCents && compareAtCents != null && compareAtCents > minCents

  if (hasDiscount) {
    const percentOff = Math.round(((compareAtCents - minCents) / compareAtCents) * 100)
    return (
      <DiscountWrapper>
        <ComparePrice>{formatPrice(compareAtCents, currency, numberLocale)}</ComparePrice>
        <span>{price}</span>
        <DiscountBadge>{t('product.discountBadge', { percent: percentOff })}</DiscountBadge>
      </DiscountWrapper>
    )
  }
  if (minCents === maxCents) return <>{price}</>
  return <>{t('product.priceFrom', { price })}</>
}
