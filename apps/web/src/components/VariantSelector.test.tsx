import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { store } from '../store'
import type { ProductVariant } from '../store/catalog-api'
import { VariantSelector } from './VariantSelector'

function variant(color: string, size: string, availableUnits = 5): ProductVariant {
  return {
    id: `${color}-${size}`,
    sku: `SKU-${color}-${size}`,
    name: `Camiseta ${color} ${size}`,
    color,
    size,
    priceCents: 100,
    compareAtPriceCents: null,
    availableUnits,
  }
}

function renderSelector(variants: ProductVariant[], selectedVariantId: string, onSelect = vi.fn()) {
  render(
    <Provider store={store}>
      <VariantSelector variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelect} />
    </Provider>,
  )
  return onSelect
}

describe('VariantSelector', () => {
  it('names the size group and never puts the colour inside a size button', () => {
    renderSelector([variant('Crema', 'S'), variant('Crema', 'M')], 'Crema-S')

    expect(screen.getByText('Talla')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'S' })).toBeInTheDocument()
    expect(screen.queryByText(/crema/i)).not.toBeInTheDocument()
  })

  it('hides the colour group when the garment comes in a single colour', () => {
    renderSelector([variant('Crema', 'S')], 'Crema-S')
    expect(screen.queryByText('Color')).not.toBeInTheDocument()
  })

  it('lists the colours apart and only the sizes of the chosen colour', () => {
    renderSelector([variant('Crema', 'S'), variant('Crema', 'M'), variant('Negro', 'S')], 'Crema-S')

    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Crema' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio', { name: 'S' })).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'M' })).toBeInTheDocument()
  })

  it('keeps the chosen size when the customer switches colour', () => {
    const onSelect = renderSelector([variant('Crema', 'S'), variant('Crema', 'M'), variant('Negro', 'M')], 'Crema-M')
    screen.getByRole('radio', { name: 'Negro' }).click()
    expect(onSelect).toHaveBeenCalledWith('Negro-M')
  })

  it('falls back to a size in stock when the new colour lacks the chosen one', () => {
    const onSelect = renderSelector([variant('Crema', 'S'), variant('Negro', 'M')], 'Crema-S')
    screen.getByRole('radio', { name: 'Negro' }).click()
    expect(onSelect).toHaveBeenCalledWith('Negro-M')
  })

  it('still lets a sold out size be picked, which is what brings up the restock form', () => {
    const onSelect = renderSelector([variant('Crema', 'S', 0), variant('Crema', 'M')], 'Crema-M')
    screen.getByRole('radio', { name: 'S' }).click()
    expect(onSelect).toHaveBeenCalledWith('Crema-S')
  })
})
