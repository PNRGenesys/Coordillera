import { describe, expect, it } from 'vitest'
import type { CatalogProductSummary } from '../store/catalog-api'
import { buildHeroSlides, driftFor, HERO_SLIDE_COUNT } from './hero-slides'

function product(slug: string, imageUrl: string | null): CatalogProductSummary {
  return {
    id: slug,
    slug,
    name: `Producto ${slug}`,
    release: 'available',
    availableAt: null,
    categorySlug: null,
    collectionSlug: null,
    collectionName: null,
    minPriceCents: 100,
    maxPriceCents: 100,
    compareAtPriceCents: null,
    colors: [],
    sizes: [],
    availableUnits: 1,
    imageUrl,
  }
}

describe('buildHeroSlides', () => {
  it('returns the number of slides the keyframes expect', () => {
    const slides = buildHeroSlides([product('a', '/a.jpg'), product('b', '/b.jpg')])
    expect(slides).toHaveLength(HERO_SLIDE_COUNT)
  })

  it('keeps the order the catalog returned', () => {
    const slides = buildHeroSlides([product('a', '/a.jpg'), product('b', '/b.jpg'), product('c', '/c.jpg'), product('d', '/d.jpg')])
    expect(slides.map((slide) => slide.url)).toEqual(['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg'])
  })

  it('cycles what it has when there are fewer images than slides', () => {
    const slides = buildHeroSlides([product('a', '/a.jpg'), product('b', '/b.jpg')])
    expect(slides.map((slide) => slide.url)).toEqual(['/a.jpg', '/b.jpg', '/a.jpg', '/b.jpg'])
  })

  it('uses the product name as the alternative text', () => {
    expect(buildHeroSlides([product('a', '/a.jpg')])[0]).toEqual({ url: '/a.jpg', alt: 'Producto a' })
  })

  it('skips products without an image instead of leaving a gap', () => {
    const slides = buildHeroSlides([product('a', null), product('b', '/b.jpg')])
    expect(slides.every((slide) => slide.url === '/b.jpg')).toBe(true)
  })

  it('returns nothing when no product has an image', () => {
    expect(buildHeroSlides([product('a', null)])).toEqual([])
  })
})

describe('driftFor', () => {
  function amounts(url: string, index: number): number[] {
    const drift = driftFor(url, index)
    return [drift.fromX, drift.fromY, drift.toX, drift.toY].map((value) => Number.parseFloat(value))
  }

  it('gives the same slide the same direction every time, so a re-render never makes it jump', () => {
    expect(driftFor('/a.jpg', 0)).toEqual(driftFor('/a.jpg', 0))
  })

  it('starts part way through the travel instead of at rest', () => {
    const [fromX, fromY, toX, toY] = amounts('/a.jpg', 0)
    expect(Math.abs(fromX ?? 0) + Math.abs(fromY ?? 0)).toBeGreaterThan(0)
    expect(Math.abs(fromX ?? 0)).toBeLessThan(Math.abs(toX ?? 0) || Infinity)
    expect(Math.abs(fromY ?? 0)).toBeLessThan(Math.abs(toY ?? 0) || Infinity)
  })

  it('keeps the travel small enough for the zoom to cover it', () => {
    for (const [index, url] of ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg'].entries()) {
      for (const amount of amounts(url, index)) expect(Math.abs(amount)).toBeLessThanOrEqual(2)
    }
  })

  it('spreads slides over different directions instead of moving them all the same way', () => {
    const directions = new Set(['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg', '/f.jpg', '/g.jpg', '/h.jpg'].map((url, index) => {
      const drift = driftFor(url, index)
      return `${drift.toX}|${drift.toY}`
    }))
    expect(directions.size).toBeGreaterThan(2)
  })
})
