import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Language } from '../lib/translations'

export type ProductRelease = 'available' | 'preorder' | 'coming_soon'

export type Collection = {
  id: string
  name: string
  slug: string
  tagline: string | null
  heroImageUrl: string | null
  releasedAt: string | null
  featured: boolean
}

export type Category = {
  id: string
  name: string
  slug: string
  position: number
}

/** `value` is the stored text used to filter; `label` is the same attribute in the language of the interface. */
export type CatalogFacet = { value: string; label: string }

export type CatalogProductSummary = {
  id: string
  slug: string
  name: string
  release: ProductRelease
  availableAt: string | null
  categorySlug: string | null
  collectionSlug: string | null
  collectionName: string | null
  minPriceCents: number
  maxPriceCents: number
  colors: CatalogFacet[]
  sizes: CatalogFacet[]
  availableUnits: number
  imageUrl: string | null
}

export type CatalogPage = {
  page: number
  pageSize: number
  total: number
  items: CatalogProductSummary[]
}

export type CatalogAvailability = 'all' | 'in_stock'

/** `lang` travels in every catalog request: it is part of the cache key, so switching language refetches the copy. */
export type CatalogFilters = {
  lang: Language
  collection?: string
  category?: string
  color?: string
  size?: string
  availability?: CatalogAvailability
  page?: number
  pageSize?: number
}

export type ProductImage = { url: string; alt: string | null; position: number }

export type ProductVariant = {
  id: string
  sku: string
  name: string
  color: string | null
  size: string | null
  priceCents: number
  compareAtPriceCents: number | null
  availableUnits: number
}

export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  composition: string | null
  release: ProductRelease
  availableAt: string | null
  categoryName: string | null
  categorySlug: string | null
  collectionName: string | null
  collectionSlug: string | null
  sizeGuideName: string | null
  sizeGuideUnit: string | null
  sizeGuideColumns: string[] | null
  sizeGuideRows: Record<string, string>[] | null
  images: ProductImage[]
  variants: ProductVariant[]
}

export type CartLine = {
  variantId: string
  sku: string
  productName: string
  productSlug: string
  variantName: string
  color: string | null
  size: string | null
  unitPriceCents: number
  quantity: number
  availableUnits: number
  imageUrl: string | null
}

export type CartView = {
  sessionId: string
  currency: string
  items: CartLine[]
  itemCount: number
  subtotalCents: number
}

export type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  region: string
  postalCode: string
  country: string
}

export type CheckoutInput = {
  sessionId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress: ShippingAddress
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type CustomerRole = 'customer' | 'admin'

export type AccountProfile = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: CustomerRole
}

export type RegisterInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export type LoginInput = { email: string; password: string }

/** `account` is absent while browsing as a guest. */
export type AccountSession = { account?: AccountProfile }

export type ProductStatus = 'draft' | 'active' | 'archived'

export type AdminVariant = {
  id: string
  sku: string
  name: string
  color: string | null
  size: string | null
  priceCents: number
  compareAtPriceCents: number | null
  onHand: number
  reserved: number
  availableUnits: number
  lowStock: boolean
}

export type AdminProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  composition: string | null
  status: ProductStatus
  release: ProductRelease
  categoryName: string | null
  collectionName: string | null
  imageUrl: string | null
  variants: AdminVariant[]
}

export type AdminOrderItem = { sku: string; name: string; quantity: number; unitPriceCents: number }

export type AdminOrder = {
  id: string
  number: string
  status: OrderStatus
  currency: string
  totalCents: number
  shippingAddress: Record<string, string>
  carrier: string | null
  trackingNumber: string | null
  createdAt: string
  customerEmail: string
  customerFirstName: string | null
  customerLastName: string | null
  customerPhone: string | null
  items: AdminOrderItem[]
}

export type ProductUpdate = { name?: string; description?: string; composition?: string; status?: ProductStatus; release?: ProductRelease }
export type VariantUpdate = { name?: string; color?: string; size?: string; priceCents?: number; compareAtPriceCents?: number }
export type OrderUpdate = { status?: OrderStatus; carrier?: string; trackingNumber?: string }
export type InventoryAdjustment = { variantId: string; quantity: number; note: string }

export type CheckoutConfirmation = {
  number: string
  status: OrderStatus
  totalCents: number
  currency: string
  reservationExpiresInMinutes: number
}

function withoutUndefinedFilters(filters: CatalogFilters): Partial<CatalogFilters> {
  const entries = Object.entries(filters) as [keyof CatalogFilters, CatalogFilters[keyof CatalogFilters]][]
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined)) as Partial<CatalogFilters>
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  // `credentials` sends the session cookie when the web app runs on a different origin than the API.
  baseQuery: fetchBaseQuery({ baseUrl: '/api/', credentials: 'include' }),
  tagTypes: ['Catalog', 'Cart', 'Account', 'Admin'],
  endpoints: (build) => ({
    getCollections: build.query<Collection[], Language>({
      query: (lang) => ({ url: 'collections', params: { lang } }),
      providesTags: ['Catalog'],
    }),
    getCategories: build.query<Category[], Language>({
      query: (lang) => ({ url: 'categories', params: { lang } }),
      providesTags: ['Catalog'],
    }),
    getProducts: build.query<CatalogPage, CatalogFilters>({
      query: (filters) => ({ url: 'products', params: withoutUndefinedFilters({ ...filters }) }),
      providesTags: ['Catalog'],
    }),
    getProduct: build.query<ProductDetail, { slug: string; lang: Language }>({
      query: ({ slug, lang }) => ({ url: `products/${slug}`, params: { lang } }),
      providesTags: ['Catalog'],
    }),
    getCart: build.query<CartView, { sessionId: string; lang: Language }>({
      query: ({ sessionId, lang }) => ({ url: `cart/${sessionId}`, params: { lang } }),
      providesTags: ['Cart'],
    }),
    addCartItem: build.mutation<CartView, { sessionId: string; variantId: string; quantity: number; lang: Language }>({
      query: ({ lang, ...body }) => ({ url: 'cart/items', method: 'POST', body, params: { lang } }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: build.mutation<CartView, { sessionId: string; variantId: string; quantity: number; lang: Language }>({
      query: ({ lang, ...body }) => ({ url: 'cart/items', method: 'PATCH', body, params: { lang } }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: build.mutation<CartView, { sessionId: string; variantId: string; lang: Language }>({
      query: ({ sessionId, variantId, lang }) => ({ url: 'cart/items', method: 'DELETE', params: { sessionId, variantId, lang } }),
      invalidatesTags: ['Cart'],
    }),
    checkout: build.mutation<CheckoutConfirmation, CheckoutInput>({
      query: (body) => ({ url: 'checkout', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    requestRestock: build.mutation<{ status: string }, { variantId: string; email: string }>({
      query: (body) => ({ url: 'restock-requests', method: 'POST', body }),
    }),
    getAccount: build.query<AccountSession, void>({
      query: () => 'auth/me',
      providesTags: ['Account'],
    }),
    register: build.mutation<AccountProfile, RegisterInput>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),
    login: build.mutation<AccountProfile, LoginInput>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: 'auth/logout', method: 'POST' }),
      invalidatesTags: ['Account'],
    }),
    getAdminProducts: build.query<AdminProduct[], void>({
      query: () => 'admin/products',
      providesTags: ['Admin'],
    }),
    updateAdminProduct: build.mutation<AdminProduct, { id: string; changes: ProductUpdate }>({
      query: ({ id, changes }) => ({ url: `admin/products/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: ['Admin', 'Catalog'],
    }),
    updateAdminVariant: build.mutation<AdminVariant, { id: string; changes: VariantUpdate }>({
      query: ({ id, changes }) => ({ url: `admin/variants/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: ['Admin', 'Catalog', 'Cart'],
    }),
    adjustInventory: build.mutation<{ onHand: number; reserved: number }, InventoryAdjustment>({
      query: (body) => ({ url: 'admin/inventory/adjustments', method: 'POST', body }),
      invalidatesTags: ['Admin', 'Catalog'],
    }),
    getAdminOrders: build.query<AdminOrder[], void>({
      query: () => 'admin/orders',
      providesTags: ['Admin'],
    }),
    updateAdminOrder: build.mutation<AdminOrder, { id: string; changes: OrderUpdate }>({
      query: ({ id, changes }) => ({ url: `admin/orders/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: ['Admin', 'Catalog'],
    }),
  }),
})

export const {
  useGetCollectionsQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useCheckoutMutation,
  useRequestRestockMutation,
  useGetAccountQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetAdminProductsQuery,
  useUpdateAdminProductMutation,
  useUpdateAdminVariantMutation,
  useAdjustInventoryMutation,
  useGetAdminOrdersQuery,
  useUpdateAdminOrderMutation,
} = catalogApi
