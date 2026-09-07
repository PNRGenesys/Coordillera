import type { OrderStatus } from '../store/catalog-api'
import type { TranslationKey } from './translations'

/** Shared by the checkout confirmation and the admin panel, so both name the states the same way. */
export const orderStatusKeys: Record<OrderStatus, TranslationKey> = {
  pending_payment: 'orderStatus.pending_payment',
  paid: 'orderStatus.paid',
  processing: 'orderStatus.processing',
  fulfilled: 'orderStatus.fulfilled',
  shipped: 'orderStatus.shipped',
  delivered: 'orderStatus.delivered',
  cancelled: 'orderStatus.cancelled',
  refunded: 'orderStatus.refunded',
}
