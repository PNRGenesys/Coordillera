import { z } from 'zod'
import { config } from './config.js'

export const sessionSchema = z.object({ sessionId: z.string().uuid() })
export const slugSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })

export const catalogQuerySchema = z.object({
  collection: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  availability: z.enum(['all', 'in_stock']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(config.catalogMaxPageSize).default(config.catalogPageSize),
})

export const cartItemSchema = sessionSchema.extend({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(config.cartMaxQuantityPerItem),
})
export const cartItemUpdateSchema = cartItemSchema.extend({ quantity: z.number().int().min(0).max(config.cartMaxQuantityPerItem) })
export const cartItemRemovalSchema = sessionSchema.extend({ variantId: z.string().uuid() })

export const checkoutSchema = sessionSchema.extend({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(7).max(40),
  shippingAddress: z.object({
    line1: z.string().min(3).max(180),
    line2: z.string().max(180).optional(),
    city: z.string().min(2).max(120),
    region: z.string().min(2).max(120),
    postalCode: z.string().min(2).max(20),
    country: z.string().length(2),
  }),
})

export const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(config.passwordMinLength).max(200),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(7).max(40).optional(),
})
export const loginSchema = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(200) })

export const restockRequestSchema = z.object({ variantId: z.string().uuid(), email: z.string().email() })

export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'] as const

export const idParamSchema = z.object({ id: z.string().uuid() })

/** Every admin update is partial, but an empty body would be a silent no-op. */
function requireAtLeastOneField<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema.refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })
}

export const productUpdateSchema = requireAtLeastOneField(z.object({
  name: z.string().min(2).max(180).optional(),
  description: z.string().max(10_000).optional(),
  composition: z.string().max(240).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  release: z.enum(['available', 'preorder', 'coming_soon']).optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
}))

export const variantUpdateSchema = requireAtLeastOneField(z.object({
  name: z.string().min(1).max(180).optional(),
  color: z.string().max(60).optional(),
  size: z.string().max(30).optional(),
  priceCents: z.number().int().positive().optional(),
  compareAtPriceCents: z.number().int().positive().optional(),
}))

export const orderUpdateSchema = requireAtLeastOneField(z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  carrier: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
}))

export const inventoryAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().refine((value) => value !== 0, { message: 'Quantity must not be zero' }),
  note: z.string().min(3).max(500),
})

export const productCreateSchema = z.object({
  name: z.string().min(2).max(180),
  slug: slugSchema.shape.slug,
  description: z.string().max(10_000).optional(),
  composition: z.string().max(240).optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  release: z.enum(['available', 'preorder', 'coming_soon']).default('available'),
  variants: z.array(z.object({
    sku: z.string().min(1).max(80),
    name: z.string().min(1).max(180),
    priceCents: z.number().int().positive(),
    color: z.string().max(60).optional(),
    size: z.string().max(30).optional(),
    initialStock: z.number().int().min(0).default(0),
  })).min(1),
})
