import { styled } from '@linaria/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Field, FieldRow, Input, PrimaryButton, Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { selectSessionId } from '../store/cart-slice'
import { useCheckoutMutation, type CheckoutInput, type ShippingAddress } from '../store/catalog-api'
import { useAccount } from '../lib/use-account'
import { useAppSelector } from '../store/hooks'
import { formatPrice } from '../lib/format-price'
import { orderStatusKeys } from '../lib/order-status'
import { useTranslation } from '../lib/use-translation'

const Form = styled.form`
  display: grid;
  gap: 1rem;
  max-width: 480px;
`
const SubmitButton = styled(PrimaryButton)`
  margin-top: 1rem;
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
  const { account } = useAccount()
  const [form, setForm] = useState<CheckoutInput>({ ...emptyForm, sessionId })

  // Only the fields still empty are filled, so the account data never overwrites what the customer typed.
  useEffect(() => {
    if (!account) return
    setForm((current) => ({
      ...current,
      email: current.email || account.email,
      firstName: current.firstName || (account.firstName ?? ''),
      lastName: current.lastName || (account.lastName ?? ''),
      phone: current.phone || (account.phone ?? ''),
    }))
  }, [account])

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
        <FieldRow>
          <Field>
            {t('checkout.firstName')}
            <Input required value={form.firstName} onChange={updateField('firstName')} />
          </Field>
          <Field>
            {t('checkout.lastName')}
            <Input required value={form.lastName} onChange={updateField('lastName')} />
          </Field>
        </FieldRow>
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
        <FieldRow>
          <Field>
            {t('checkout.city')}
            <Input required value={form.shippingAddress.city} onChange={updateAddressField('city')} />
          </Field>
          <Field>
            {t('checkout.region')}
            <Input required value={form.shippingAddress.region} onChange={updateAddressField('region')} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field>
            {t('checkout.postalCode')}
            <Input required value={form.shippingAddress.postalCode} onChange={updateAddressField('postalCode')} />
          </Field>
          <Field>
            {t('checkout.country')}
            <Input required maxLength={2} value={form.shippingAddress.country} onChange={updateAddressField('country')} />
          </Field>
        </FieldRow>
        <SubmitButton type="submit" disabled={checkoutState.isLoading}>
          {t('checkout.placeOrder')}
        </SubmitButton>
      </Form>
    </Section>
  )
}
