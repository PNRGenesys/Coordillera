import { styled } from '@linaria/react'
import { useTranslation } from '../lib/use-translation'
import type { ProductVariant } from '../store/catalog-api'

const Group = styled.div`
  display: grid;
  gap: 0.5rem;
`
const GroupLabel = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
`
const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`
const Option = styled.button<{ $selected: boolean; $disabled: boolean }>`
  background: ${(props) => (props.$selected ? 'var(--color-ink)' : 'transparent')};
  border: 1px solid ${(props) => (props.$disabled ? 'var(--color-border)' : 'var(--color-ink)')};
  color: ${(props) => {
    if (props.$disabled) return 'var(--color-border)'
    return props.$selected ? 'var(--color-background)' : 'var(--color-ink)'
  }};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.55rem 0.9rem;
  text-decoration: ${(props) => (props.$disabled ? 'line-through' : 'none')};
`

export type VariantSelectorProps = {
  variants: ProductVariant[]
  selectedVariantId: string | undefined
  onSelect: (variantId: string) => void
}

/**
 * Colour and size are picked in separate groups. Listing every combination in one row made each button
 * repeat the colour name, which said nothing on a garment sold in a single colour and read as noise on
 * the rest: what the customer picks there is the size.
 */
export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const { t } = useTranslation()
  const selected = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0]
  const colors = [...new Set(variants.map((variant) => variant.color))]
  const sizesOfSelectedColor = variants.filter((variant) => variant.color === selected?.color)

  /** Changing colour keeps the size already chosen when that colour has it, so the choice is not lost. */
  function selectColor(color: string | null): void {
    const sameSize = variants.find((variant) => variant.color === color && variant.size === selected?.size)
    const firstInStock = variants.find((variant) => variant.color === color && variant.availableUnits > 0)
    const first = variants.find((variant) => variant.color === color)
    const target = sameSize ?? firstInStock ?? first
    if (target) onSelect(target.id)
  }

  return (
    <>
      {colors.length > 1 && (
        <Group>
          <GroupLabel id="variant-color-label">{t('product.colorLabel')}</GroupLabel>
          <List role="radiogroup" aria-labelledby="variant-color-label">
            {colors.map((color) => {
              const ofColor = variants.filter((variant) => variant.color === color)
              const soldOut = ofColor.every((variant) => variant.availableUnits <= 0)
              return (
                <Option
                  key={color ?? ''}
                  type="button"
                  role="radio"
                  aria-checked={color === selected?.color}
                  $selected={color === selected?.color}
                  $disabled={soldOut}
                  onClick={() => selectColor(color)}
                >
                  {color ?? ofColor[0]?.name}
                </Option>
              )
            })}
          </List>
        </Group>
      )}
      {sizesOfSelectedColor.length > 0 && (
        <Group>
          <GroupLabel id="variant-size-label">{t('product.sizeLabel')}</GroupLabel>
          <List role="radiogroup" aria-labelledby="variant-size-label">
            {sizesOfSelectedColor.map((variant) => (
              <Option
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={variant.id === selected?.id}
                $selected={variant.id === selected?.id}
                $disabled={variant.availableUnits <= 0}
                onClick={() => onSelect(variant.id)}
              >
                {variant.size ?? variant.name}
              </Option>
            ))}
          </List>
        </Group>
      )}
    </>
  )
}
