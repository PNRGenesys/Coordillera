import { styled } from '@linaria/react'
import { useState, type FormEvent } from 'react'
import { formatPrice } from '../lib/format-price'
import { orderStatusKeys } from '../lib/order-status'
import { useTranslation } from '../lib/use-translation'
import { useUpdateAdminOrderMutation, type AdminOrder, type OrderStatus } from '../store/catalog-api'
import { Field, FieldRow, Input, PrimaryButton, Select } from './primitives'
import { StateMessage } from './StateMessage'

const Card = styled.article`
  border: 1px solid var(--color-border);
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
`
const OrderNumber = styled.h3`
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  margin: 0;
`
const Detail = styled.p`
  font-size: 0.8rem;
  margin: 0;
`
const Muted = styled.p`
  color: var(--color-accent);
  font-size: 0.75rem;
  margin: 0;
`
const Legend = styled.h4`
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
`
const Form = styled.form`
  display: grid;
  gap: 0.75rem;
`

export type AdminOrderCardProps = {
  order: AdminOrder
}

export function AdminOrderCard({ order }: AdminOrderCardProps) {
  const { t, numberLocale } = useTranslation()
  const [updateOrder, updateOrderState] = useUpdateAdminOrderMutation()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [carrier, setCarrier] = useState(order.carrier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '')

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void updateOrder({ id: order.id, changes: { status, carrier, trackingNumber } })
  }

  const customerName = [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ')
  const address = [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.region, order.shippingAddress.country]
    .filter(Boolean).join(', ')

  return (
    <Card>
      <OrderNumber>{order.number}</OrderNumber>
      <Muted>{t('admin.orderDate', { date: new Date(order.createdAt).toLocaleString(numberLocale) })}</Muted>
      <Detail>{t('admin.customer', { name: customerName, email: order.customerEmail })}</Detail>
      <Detail>{t('admin.orderTotal', { amount: formatPrice(order.totalCents, order.currency, numberLocale) })}</Detail>
      <Legend>{t('admin.shippingAddress')}</Legend>
      <Muted>{address}</Muted>
      <Legend>{t('admin.items')}</Legend>
      {order.items.map((item) => (
        <Muted key={item.sku}>{t('admin.itemLine', { quantity: item.quantity, name: item.name, sku: item.sku })}</Muted>
      ))}
      <Form onSubmit={save}>
        <Field>
          {t('admin.orderStatusLabel')}
          <Select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>
            {Object.entries(orderStatusKeys).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
          </Select>
        </Field>
        <FieldRow>
          <Field>
            {t('admin.carrier')}
            <Input value={carrier} onChange={(event) => setCarrier(event.target.value)} />
          </Field>
          <Field>
            {t('admin.trackingNumber')}
            <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
          </Field>
        </FieldRow>
        <PrimaryButton type="submit" disabled={updateOrderState.isLoading}>
          {updateOrderState.isSuccess ? t('admin.saved') : t('admin.save')}
        </PrimaryButton>
        {updateOrderState.isError && <StateMessage kind="error">{t('admin.updateError')}</StateMessage>}
      </Form>
    </Card>
  )
}
