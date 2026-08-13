import { styled } from '@linaria/react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/use-translation'
import type { CatalogProductSummary } from '../store/catalog-api'
import { Price } from './Price'

const LAST_STOCK_THRESHOLD = 3

const Card = styled.article`
  min-width: 0;
`
const Visual = styled.div`
  aspect-ratio: 0.82;
  background: var(--color-surface);
  margin-bottom: 0.9rem;
  overflow: hidden;
  position: relative;

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`
const Placeholder = styled.div`
  align-items: center;
  color: var(--color-accent);
  display: flex;
  font-family: var(--font-display);
  font-size: 1.4rem;
  height: 100%;
  justify-content: center;
  text-align: center;
`
const Badge = styled.span`
  background: var(--color-ink);
  color: var(--color-background);
  font-size: 0.68rem;
  font-weight: 800;
  left: 0.6rem;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.5rem;
  position: absolute;
  text-transform: uppercase;
  top: 0.6rem;
`
const Name = styled.h3`
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  margin: 0 0 0.4rem;
  text-transform: uppercase;
`
const ProductPrice = styled.p`
  font-size: 0.9rem;
  margin: 0 0 0.4rem;
`
const ViewLink = styled(Link)`
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-decoration: underline;
  text-underline-offset: 0.3rem;
  text-transform: uppercase;
`

export type ProductCardProps = {
  product: CatalogProductSummary
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation()
  const isOutOfStock = product.availableUnits <= 0
  const isLastStock = !isOutOfStock && product.availableUnits <= LAST_STOCK_THRESHOLD

  function statusBadge(): string | undefined {
    if (product.release === 'preorder') return t('product.preorder')
    if (product.release === 'coming_soon') return t('product.comingSoon')
    if (isOutOfStock) return t('product.soldOut')
    if (isLastStock) return t('product.lastStock')
    return undefined
  }

  const badge = statusBadge()

  return (
    <Card>
      <Visual>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <Placeholder>{product.colors[0] ?? 'Coordillera'}</Placeholder>}
        {badge && <Badge>{badge}</Badge>}
      </Visual>
      <Name>{product.name}</Name>
      <ProductPrice>
        <Price minCents={product.minPriceCents} maxCents={product.maxPriceCents} />
      </ProductPrice>
      <ViewLink to={`/product/${product.slug}`}>{t('product.view')}</ViewLink>
    </Card>
  )
}
