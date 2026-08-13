import { styled } from '@linaria/react'
import { useTranslation } from '../lib/use-translation'
import type { ProductVariant } from '../store/catalog-api'

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

function variantLabel(variant: ProductVariant): string {
  return [variant.color, variant.size].filter(Boolean).join(' / ') || variant.name
}

export type VariantSelectorProps = {
  variants: ProductVariant[]
  selectedVariantId: string | undefined
  onSelect: (variantId: string) => void
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const { t } = useTranslation()
  return (
    <List role="radiogroup" aria-label={t('product.variantGroupLabel')}>
      {variants.map((variant) => (
        <Option
          key={variant.id}
          type="button"
          role="radio"
          aria-checked={variant.id === selectedVariantId}
          $selected={variant.id === selectedVariantId}
          $disabled={variant.availableUnits <= 0}
          onClick={() => onSelect(variant.id)}
        >
          {variantLabel(variant)}
        </Option>
      ))}
    </List>
  )
}
