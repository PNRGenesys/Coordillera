import { describe, expect, it } from 'vitest'
import { formatPrice } from './format-price'

describe('formatPrice', () => {
  it('formats cents as Colombian pesos', () => {
    expect(formatPrice(1250000)).toContain('12.500')
  })
})
