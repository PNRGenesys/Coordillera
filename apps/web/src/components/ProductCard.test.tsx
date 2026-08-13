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
  colors: ['Moss'],
  sizes: ['M'],
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
})
