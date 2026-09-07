import { describe, expect, it } from 'vitest'
import { centsToUnits, formatPrice, unitsToCents } from './format-price'

describe('formatPrice', () => {
  it('formats cents as Colombian pesos', () => {
    expect(formatPrice(1250000)).toContain('12.500')
  })
})

describe('cents and units', () => {
  it('converts cents into the units shown in the admin panel', () => {
    expect(centsToUnits(18_900_000)).toBe(189_000)
  })

  it('converts the edited units back into cents', () => {
    expect(unitsToCents(189_000)).toBe(18_900_000)
  })

  it('rounds a fractional amount instead of storing fractional cents', () => {
    expect(unitsToCents(1234.567)).toBe(123_457)
  })
})
