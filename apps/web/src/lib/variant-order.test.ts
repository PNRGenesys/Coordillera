import { describe, expect, it } from 'vitest'
import type { ProductVariant } from '../store/catalog-api'
import { sortVariantsBySizeGuide } from './variant-order'

const columns = ['Size', 'Chest']
const rows = [{ Size: 'S', Chest: '96' }, { Size: 'M', Chest: '104' }, { Size: 'L', Chest: '112' }, { Size: 'XL', Chest: '120' }]

function variant(size: string | null, color = 'Bone'): ProductVariant {
  return { id: `${color}-${size}`, sku: `SKU-${color}-${size}`, name: `Tee ${color} ${size}`, color, size, priceCents: 100, compareAtPriceCents: null, availableUnits: 1 }
}

function idsOf(variants: ProductVariant[]): string[] {
  return variants.map((entry) => entry.id)
}

describe('sortVariantsBySizeGuide', () => {
  it('orders sizes as listed in the size guide instead of alphabetically', () => {
    const sorted = sortVariantsBySizeGuide([variant('L'), variant('M'), variant('S'), variant('XL')], columns, rows)
    expect(idsOf(sorted)).toEqual(['Bone-S', 'Bone-M', 'Bone-L', 'Bone-XL'])
  })

  it('groups variants by colour keeping the order each colour first appears', () => {
    const sorted = sortVariantsBySizeGuide([variant('M', 'Bone'), variant('M', 'Moss'), variant('S', 'Bone'), variant('S', 'Moss')], columns, rows)
    expect(idsOf(sorted)).toEqual(['Bone-S', 'Bone-M', 'Moss-S', 'Moss-M'])
  })

  it('pushes sizes missing from the guide to the end', () => {
    const sorted = sortVariantsBySizeGuide([variant('One size'), variant('M')], columns, rows)
    expect(idsOf(sorted)).toEqual(['Bone-M', 'Bone-One size'])
  })

  it('falls back to the standard size order when there is no size guide', () => {
    const sorted = sortVariantsBySizeGuide([variant('XL'), variant('M'), variant('L'), variant('S')], null, null)
    expect(idsOf(sorted)).toEqual(['Bone-S', 'Bone-M', 'Bone-L', 'Bone-XL'])
  })
})
