import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
  colors: string[]
  sizes: string[]
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

export type CatalogFilters = {
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

export type AccountProfile = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
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
  tagTypes: ['Catalog', 'Cart', 'Account'],
  endpoints: (build) => ({
    getCollections: build.query<Collection[], void>({
      query: () => 'collections',
      providesTags: ['Catalog'],
    }),
    getCategories: build.query<Category[], void>({
      query: () => 'categories',
      providesTags: ['Catalog'],
    }),
    getProducts: build.query<CatalogPage, CatalogFilters | void>({
      query: (filters) => ({ url: 'products', params: withoutUndefinedFilters({ ...filters }) }),
      providesTags: ['Catalog'],
    }),
    getProduct: build.query<ProductDetail, string>({
      query: (slug) => `products/${slug}`,
      providesTags: ['Catalog'],
    }),
    getCart: build.query<CartView, string>({
      query: (sessionId) => `cart/${sessionId}`,
      providesTags: ['Cart'],
    }),
    addCartItem: build.mutation<CartView, { sessionId: string; variantId: string; quantity: number }>({
      query: (body) => ({ url: 'cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: build.mutation<CartView, { sessionId: string; variantId: string; quantity: number }>({
      query: (body) => ({ url: 'cart/items', method: 'PATCH', body }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: build.mutation<CartView, { sessionId: string; variantId: string }>({
      query: ({ sessionId, variantId }) => ({ url: 'cart/items', method: 'DELETE', params: { sessionId, variantId } }),
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
} = catalogApi
