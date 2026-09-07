import type { CatalogProductSummary } from '../store/catalog-api'

/** The crossfade keyframes in `HeroSlideshow` are written for exactly this many slides. */
export const HERO_SLIDE_COUNT = 4

/** Seconds each slide owns; the whole cycle lasts `HERO_SLIDE_COUNT * HERO_SLIDE_SECONDS`. */
export const HERO_SLIDE_SECONDS = 5

export type HeroSlide = { url: string; alt: string }

/** How far a slide travels, as a percentage of its own size, by the time it leaves. */
const DRIFT_DISTANCE_PERCENT = 2

/**
 * Portion of the travel already done when the slide appears. Without it a slide would enter with the
 * effect still at zero next to the one leaving, which is fully drifted, and the swap would show.
 */
const DRIFT_HEAD_START = 0.4

/** Sideways, up, down and the four diagonals. */
const DRIFT_DIRECTIONS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
] as const

export type HeroDrift = { fromX: string; fromY: string; toX: string; toY: string }

/** Stable hash of the slide, so the direction looks random but never changes between renders. */
function hashOf(url: string, index: number): number {
  let hash = index + 1
  for (const character of url) hash = (hash * 31 + character.charCodeAt(0)) % 100_000
  return hash
}

function percent(direction: number, ratio: number): string {
  return `${(direction * DRIFT_DISTANCE_PERCENT * ratio).toFixed(2)}%`
}

/**
 * Picks the direction each slide drifts towards. Two slides in a row rarely move the same way, and the
 * same slide always moves the same way, so nothing jumps when React re-renders the hero.
 */
export function driftFor(url: string, index: number): HeroDrift {
  const direction = DRIFT_DIRECTIONS[hashOf(url, index) % DRIFT_DIRECTIONS.length] ?? DRIFT_DIRECTIONS[0]
  return {
    fromX: percent(direction.x, DRIFT_HEAD_START),
    fromY: percent(direction.y, DRIFT_HEAD_START),
    toX: percent(direction.x, 1),
    toY: percent(direction.y, 1),
  }
}

/**
 * Builds a fixed length list from the latest products that have an image. Shorter lists are padded by
 * cycling what is available, so the keyframes always find a slide and a catalog with a single image
 * simply leaves the hero still. With nothing to show it returns an empty list and the hero stays blank.
 */
export function buildHeroSlides(products: CatalogProductSummary[]): HeroSlide[] {
  const available = products.flatMap((product) => (product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : []))
  const [first] = available
  if (!first) return []
  return Array.from({ length: HERO_SLIDE_COUNT }, (_, index) => available[index % available.length] ?? first)
}
