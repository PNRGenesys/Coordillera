import { styled } from '@linaria/react'
import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Price } from '../components/Price'
import { QuantityStepper } from '../components/QuantityStepper'
import { Section } from '../components/primitives'
import { SizeGuideTable } from '../components/SizeGuideTable'
import { StateMessage } from '../components/StateMessage'
import { VariantSelector } from '../components/VariantSelector'
import { useTranslation } from '../lib/use-translation'
import { sortVariantsBySizeGuide } from '../lib/variant-order'
import { selectSessionId } from '../store/cart-slice'
import { useAddCartItemMutation, useGetProductQuery, useRequestRestockMutation } from '../store/catalog-api'
import { useAppSelector } from '../store/hooks'

const LAST_STOCK_THRESHOLD = 3

const Layout = styled.div`
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`
const Gallery = styled.div`
  display: grid;
  gap: 0.75rem;
`
const GalleryImage = styled.img`
  background: var(--color-surface);
  width: 100%;
`
const GalleryPlaceholder = styled.div`
  align-items: center;
  aspect-ratio: 0.9;
  background: var(--color-surface);
  color: var(--color-accent);
  display: flex;
  font-family: var(--font-display);
  font-size: 1.6rem;
  justify-content: center;
`
const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`
const ProductName = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 400;
  letter-spacing: -0.05em;
  margin: 0;
`
const ProductPrice = styled.p`
  font-size: 1.2rem;
  margin: 0;
`
const Description = styled.p`
  line-height: 1.6;
  margin: 0;
`
const Composition = styled.p`
  color: var(--color-accent);
  font-size: 0.8rem;
  margin: 0;
`
const AddButton = styled.button`
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-background);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 1rem 1.5rem;
  text-transform: uppercase;

  &:disabled {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-border);
    cursor: not-allowed;
  }
`
const RestockForm = styled.form`
  display: flex;
  gap: 0.75rem;
`
const RestockInput = styled.input`
  border: 1px solid var(--color-border);
  flex: 1;
  padding: 0.6rem 0.75rem;
`
const Confirmation = styled.p`
  color: var(--color-accent);
  font-size: 0.8rem;
  margin: 0;
`

export function ProductPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const sessionId = useAppSelector(selectSessionId)
  const { data: product, isLoading, isError } = useGetProductQuery(slug ?? '', { skip: !slug })
  const [addCartItem, addCartItemState] = useAddCartItemMutation()
  const [requestRestock, requestRestockState] = useRequestRestockMutation()
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [restockEmail, setRestockEmail] = useState('')

  const variants = useMemo(
    () => (product ? sortVariantsBySizeGuide(product.variants, product.sizeGuideColumns, product.sizeGuideRows) : []),
    [product],
  )

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId],
  )

  if (isLoading) return <Section><StateMessage kind="loading">{t('product.loading')}</StateMessage></Section>
  if (isError || !product) return <Section><StateMessage kind="error">{t('product.notFound')}</StateMessage></Section>

  const isOutOfStock = (selectedVariant?.availableUnits ?? 0) <= 0
  const isLastStock = !isOutOfStock && (selectedVariant?.availableUnits ?? 0) <= LAST_STOCK_THRESHOLD

  function addToCart(): void {
    if (!selectedVariant) return
    void addCartItem({ sessionId, variantId: selectedVariant.id, quantity })
  }

  function selectVariant(variantId: string): void {
    setSelectedVariantId(variantId)
    setQuantity(1)
  }

  function submitRestockRequest(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!selectedVariant) return
    void requestRestock({ variantId: selectedVariant.id, email: restockEmail })
  }

  return (
    <Section>
      <Layout>
        <Gallery>
          {product.images.length > 0
            ? product.images.map((image) => <GalleryImage key={image.url} src={image.url} alt={image.alt ?? product.name} />)
            : <GalleryPlaceholder>{product.name}</GalleryPlaceholder>}
        </Gallery>
        <Info>
          <div>
            <ProductName>{product.name}</ProductName>
            {selectedVariant && (
              <ProductPrice>
                <Price minCents={selectedVariant.priceCents} maxCents={selectedVariant.priceCents} />
              </ProductPrice>
            )}
          </div>
          {product.description && <Description>{product.description}</Description>}
          {product.composition && <Composition>{product.composition}</Composition>}
          <VariantSelector variants={variants} selectedVariantId={selectedVariant?.id} onSelect={selectVariant} />
          {isOutOfStock && (
            <>
              <StateMessage kind="empty">{t('product.restockNotice')}</StateMessage>
              {requestRestockState.isSuccess ? (
                <Confirmation>{t('product.restockConfirmation')}</Confirmation>
              ) : (
                <RestockForm onSubmit={submitRestockRequest}>
                  <RestockInput
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={restockEmail}
                    onChange={(event) => setRestockEmail(event.target.value)}
                  />
                  <AddButton type="submit" disabled={requestRestockState.isLoading}>
                    {t('product.notifyMe')}
                  </AddButton>
                </RestockForm>
              )}
            </>
          )}
          {!isOutOfStock && (
            <>
              {isLastStock && (
                <StateMessage kind="empty">{t('product.lastStockDetail', { units: selectedVariant?.availableUnits ?? 0 })}</StateMessage>
              )}
              <QuantityStepper value={quantity} max={selectedVariant?.availableUnits ?? 1} onChange={setQuantity} />
              <AddButton type="button" onClick={addToCart} disabled={addCartItemState.isLoading}>
                {addCartItemState.isSuccess ? t('product.addedToBag') : t('product.addToBag')}
              </AddButton>
              {addCartItemState.isError && <StateMessage kind="error">{t('product.addError')}</StateMessage>}
            </>
          )}
          {product.sizeGuideColumns && product.sizeGuideRows && product.sizeGuideUnit && (
            <SizeGuideTable
              name={product.sizeGuideName ?? t('product.sizeGuideDefaultName')}
              unit={product.sizeGuideUnit}
              columns={product.sizeGuideColumns}
              rows={product.sizeGuideRows}
            />
          )}
        </Info>
      </Layout>
    </Section>
  )
}
