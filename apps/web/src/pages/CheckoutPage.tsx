import { styled } from '@linaria/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { selectSessionId } from '../store/cart-slice'
import { useCheckoutMutation, type CheckoutInput, type OrderStatus, type ShippingAddress } from '../store/catalog-api'
import { useAppSelector } from '../store/hooks'
import { formatPrice } from '../lib/format-price'
import { useTranslation } from '../lib/use-translation'
import type { TranslationKey } from '../lib/translations'

const orderStatusKeys: Record<OrderStatus, TranslationKey> = {
  pending_payment: 'orderStatus.pending_payment',
  paid: 'orderStatus.paid',
  processing: 'orderStatus.processing',
  fulfilled: 'orderStatus.fulfilled',
  shipped: 'orderStatus.shipped',
  delivered: 'orderStatus.delivered',
  cancelled: 'orderStatus.cancelled',
  refunded: 'orderStatus.refunded',
}

const Form = styled.form`
  display: grid;
  gap: 1rem;
  max-width: 480px;
`
const Row = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
`
const Field = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`
const Input = styled.input`
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  padding: 0.6rem 0.75rem;
`
const SubmitButton = styled.button`
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-background);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  text-transform: uppercase;

  &:disabled {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-border);
    cursor: not-allowed;
  }
`
const Confirmation = styled.div`
  border: 1px solid var(--color-accent);
  max-width: 480px;
  padding: 2rem;
`

const emptyForm: CheckoutInput = {
  sessionId: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  shippingAddress: { line1: '', line2: '', city: '', region: '', postalCode: '', country: 'CO' },
}

export function CheckoutPage() {
  const { t, numberLocale } = useTranslation()
  const sessionId = useAppSelector(selectSessionId)
  const [checkout, checkoutState] = useCheckoutMutation()
  const [form, setForm] = useState<CheckoutInput>({ ...emptyForm, sessionId })

  function updateField(field: keyof Omit<CheckoutInput, 'shippingAddress' | 'sessionId'>) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm((current) => ({ ...current, [field]: value }))
    }
  }

  function updateAddressField(field: keyof ShippingAddress) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm((current) => ({ ...current, shippingAddress: { ...current.shippingAddress, [field]: value } }))
    }
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void checkout(form)
  }

  if (checkoutState.isSuccess) {
    const order = checkoutState.data
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>{t('checkout.confirmedTitle')}</SectionTitle>
        </SectionHeader>
        <Confirmation>
          <p>{t('checkout.orderStatus', { number: order.number, status: t(orderStatusKeys[order.status]) })}</p>
          <p>{t('checkout.total', { amount: formatPrice(order.totalCents, order.currency, numberLocale) })}</p>
          <p>{t('checkout.reservationNotice', { minutes: order.reservationExpiresInMinutes })}</p>
        </Confirmation>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('checkout.title')}</SectionTitle>
      </SectionHeader>
      {checkoutState.isError && <StateMessage kind="error">{t('checkout.error')}</StateMessage>}
      <Form onSubmit={submit}>
        <Field>
          {t('checkout.email')}
          <Input type="email" required value={form.email} onChange={updateField('email')} />
        </Field>
        <Row>
          <Field>
            {t('checkout.firstName')}
            <Input required value={form.firstName} onChange={updateField('firstName')} />
          </Field>
          <Field>
            {t('checkout.lastName')}
            <Input required value={form.lastName} onChange={updateField('lastName')} />
          </Field>
        </Row>
        <Field>
          {t('checkout.phone')}
          <Input required value={form.phone} onChange={updateField('phone')} />
        </Field>
        <Field>
          {t('checkout.line1')}
          <Input required value={form.shippingAddress.line1} onChange={updateAddressField('line1')} />
        </Field>
        <Field>
          {t('checkout.line2')}
          <Input value={form.shippingAddress.line2 ?? ''} onChange={updateAddressField('line2')} />
        </Field>
        <Row>
          <Field>
            {t('checkout.city')}
            <Input required value={form.shippingAddress.city} onChange={updateAddressField('city')} />
          </Field>
          <Field>
            {t('checkout.region')}
            <Input required value={form.shippingAddress.region} onChange={updateAddressField('region')} />
          </Field>
        </Row>
        <Row>
          <Field>
            {t('checkout.postalCode')}
            <Input required value={form.shippingAddress.postalCode} onChange={updateAddressField('postalCode')} />
          </Field>
          <Field>
            {t('checkout.country')}
            <Input required maxLength={2} value={form.shippingAddress.country} onChange={updateAddressField('country')} />
          </Field>
        </Row>
        <SubmitButton type="submit" disabled={checkoutState.isLoading}>
          {t('checkout.placeOrder')}
        </SubmitButton>
      </Form>
    </Section>
  )
}
