import type { ProductVariant } from '../store/catalog-api'

/**
 * The API returns variants sorted alphabetically, which reads as L, M, S, XL.
 * The size guide already lists the sizes in their real order, so it is used as the reference.
 * The first column of the guide is the one holding the size name.
 */
export function sortVariantsBySizeGuide(
  variants: ProductVariant[],
  sizeGuideColumns: string[] | null,
  sizeGuideRows: Record<string, string>[] | null,
): ProductVariant[] {
  const sizeColumn = sizeGuideColumns?.[0]
  if (!sizeColumn || !sizeGuideRows?.length) return variants

  const guideOrder = sizeGuideRows.map((row) => row[sizeColumn])
  const rankOf = (variant: ProductVariant): number => {
    const index = variant.size ? guideOrder.indexOf(variant.size) : -1
    return index === -1 ? guideOrder.length : index
  }

  return [...variants].sort((left, right) => rankOf(left) - rankOf(right))
}
