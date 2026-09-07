import type { ProductVariant } from '../store/catalog-api'

/** Fallback order for categories without a size guide, such as pants or accessories. */
const STANDARD_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One size']

type SizeOrColor = ProductVariant['size']

function rankIn(order: readonly SizeOrColor[], value: SizeOrColor): number {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

/**
 * The API returns variants grouped by size, which reads as L, M, S, XL and mixes colours.
 * They are regrouped by colour, keeping the order in which each colour appears, and inside every
 * colour the sizes follow the size guide. The first column of the guide holds the size name.
 */
export function sortVariantsBySizeGuide(
  variants: ProductVariant[],
  sizeGuideColumns: string[] | null,
  sizeGuideRows: Record<string, string>[] | null,
): ProductVariant[] {
  const sizeColumn = sizeGuideColumns?.[0]
  const sizeOrder = sizeColumn && sizeGuideRows?.length ? sizeGuideRows.map((row) => row[sizeColumn] ?? null) : STANDARD_SIZE_ORDER
  const colorOrder = [...new Set(variants.map((variant) => variant.color))]

  return [...variants].sort((left, right) => {
    const byColor = rankIn(colorOrder, left.color) - rankIn(colorOrder, right.color)
    return byColor === 0 ? rankIn(sizeOrder, left.size) - rankIn(sizeOrder, right.size) : byColor
  })
}
