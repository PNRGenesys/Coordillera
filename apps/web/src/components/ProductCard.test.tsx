import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { store } from '../store'
import type { CatalogProductSummary } from '../store/catalog-api'
import { ProductCard } from './ProductCard'

const baseProduct: CatalogProductSummary = {
  id: 'product-1',
  slug: 'ridgeline-tee',
  name: 'Ridgeline Tee',
  release: 'available',
  availableAt: null,
  categorySlug: 't-shirts',
  collectionSlug: null,
  collectionName: null,
  minPriceCents: 12_5000,
  maxPriceCents: 12_5000,
  compareAtPriceCents: null,
  colors: [{ value: 'Moss', label: 'Musgo' }],
  sizes: [{ value: 'M', label: 'M' }],
  availableUnits: 10,
  imageUrl: null,
}

function renderCard(product: CatalogProductSummary) {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProductCard', () => {
  it('shows a single price when every variant shares the same price', () => {
    renderCard(baseProduct)
    expect(screen.getByText(/^\$/)).toBeInTheDocument()
    expect(screen.queryByText(/^Desde/)).not.toBeInTheDocument()
  })

  it('shows a "Desde" price when variants have different prices', () => {
    renderCard({ ...baseProduct, minPriceCents: 100_00, maxPriceCents: 150_00 })
    expect(screen.getByText(/^Desde/)).toBeInTheDocument()
  })

  it('flags out-of-stock products as sold out', () => {
    renderCard({ ...baseProduct, availableUnits: 0 })
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })

  it('flags low stock as last stock without marking it sold out', () => {
    renderCard({ ...baseProduct, availableUnits: 2 })
    expect(screen.getByText('Última existencia')).toBeInTheDocument()
    expect(screen.queryByText('Agotado')).not.toBeInTheDocument()
  })

  it('flags preorder releases regardless of stock', () => {
    renderCard({ ...baseProduct, release: 'preorder' })
    expect(screen.getByText('Preventa')).toBeInTheDocument()
  })

  it('shows the discount badge and the struck-through price when a compare-at price is set', () => {
    renderCard({ ...baseProduct, minPriceCents: 70_00, maxPriceCents: 70_00, compareAtPriceCents: 100_00 })
    expect(screen.getByText('-30%')).toBeInTheDocument()
  })

  it('does not show a discount badge without a compare-at price', () => {
    renderCard(baseProduct)
    expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument()
  })

  it('shows how many colors are available when there is more than one', () => {
    renderCard({ ...baseProduct, colors: [{ value: 'Moss', label: 'Musgo' }, { value: 'Sand', label: 'Arena' }] })
    expect(screen.getByText('2 colores')).toBeInTheDocument()
  })

  it('does not show a color count with a single color', () => {
    renderCard(baseProduct)
    expect(screen.queryByText(/colores$/)).not.toBeInTheDocument()
  })

  it('links the product image to the product page', () => {
    renderCard(baseProduct)
    expect(screen.getByRole('link', { name: baseProduct.name })).toHaveAttribute('href', '/product/ridgeline-tee')
  })
})
