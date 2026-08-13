import { styled } from '@linaria/react'
import { Link } from 'react-router-dom'
import { Price } from '../components/Price'
import { QuantityStepper } from '../components/QuantityStepper'
import { Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { selectSessionId } from '../store/cart-slice'
import { useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../store/catalog-api'
import { useAppSelector } from '../store/hooks'
import { formatPrice } from '../lib/format-price'
import { useTranslation } from '../lib/use-translation'

const Line = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  display: grid;
  gap: 1rem;
  grid-template-columns: 96px 1fr auto auto auto;
  padding: 1.25rem 0;

  @media (max-width: 640px) {
    grid-template-columns: 72px 1fr;
    grid-template-rows: auto auto;
  }
`
const Thumb = styled.div`
  align-items: center;
  aspect-ratio: 0.82;
  background: var(--color-surface);
  display: flex;
  justify-content: center;
  overflow: hidden;

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`
const LineInfo = styled.div``
const LineName = styled.p`
  font-size: 0.9rem;
  margin: 0 0 0.25rem;
  text-transform: uppercase;
`
const LineVariant = styled.p`
  color: var(--color-accent);
  font-size: 0.78rem;
  margin: 0;
`
const RemoveButton = styled.button`
  background: transparent;
  border: 0;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-decoration: underline;
  text-transform: uppercase;
`
const Summary = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
`
const SummaryBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: right;
`
const Subtotal = styled.p`
  font-size: 1.1rem;
  margin: 0;
`
const CheckoutAction = styled(Link)`
  background: var(--color-ink);
  color: var(--color-background);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 1rem 1.5rem;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
`

export function CartPage() {
  const { t, numberLocale } = useTranslation()
  const sessionId = useAppSelector(selectSessionId)
  const { data: cart, isLoading, isError } = useGetCartQuery(sessionId)
  const [updateCartItem, updateState] = useUpdateCartItemMutation()
  const [removeCartItem, removeState] = useRemoveCartItemMutation()

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('cart.title')}</SectionTitle>
      </SectionHeader>
      {isLoading && <StateMessage kind="loading">{t('cart.loading')}</StateMessage>}
      {isError && <StateMessage kind="error">{t('cart.error')}</StateMessage>}
      {(updateState.isError || removeState.isError) && <StateMessage kind="error">{t('cart.updateError')}</StateMessage>}
      {!isLoading && !isError && cart?.items.length === 0 && <StateMessage kind="empty">{t('cart.empty')}</StateMessage>}
      {cart?.items.map((item) => (
        <Line key={item.variantId}>
          <Thumb>{item.imageUrl && <img src={item.imageUrl} alt={item.productName} />}</Thumb>
          <LineInfo>
            <LineName>{item.productName}</LineName>
            <LineVariant>{[item.color, item.size].filter(Boolean).join(' / ')}</LineVariant>
          </LineInfo>
          <QuantityStepper
            value={item.quantity}
            max={item.availableUnits}
            onChange={(quantity) => updateCartItem({ sessionId, variantId: item.variantId, quantity })}
          />
          <Price minCents={item.unitPriceCents * item.quantity} maxCents={item.unitPriceCents * item.quantity} currency={cart.currency} />
          <RemoveButton type="button" onClick={() => removeCartItem({ sessionId, variantId: item.variantId })}>
            {t('cart.remove')}
          </RemoveButton>
        </Line>
      ))}
      {cart && cart.items.length > 0 && (
        <Summary>
          <SummaryBox>
            <Subtotal>{t('cart.subtotal', { amount: formatPrice(cart.subtotalCents, cart.currency, numberLocale) })}</Subtotal>
            <CheckoutAction to="/checkout">{t('cart.checkout')}</CheckoutAction>
          </SummaryBox>
        </Summary>
      )}
    </Section>
  )
}
