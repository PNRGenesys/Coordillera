import { styled } from '@linaria/react'
import { useTranslation } from '../lib/use-translation'

/**
 * The width is pinned to the content: as a flex item of a column, `inline-flex` alone would still be
 * stretched to the full width of the column by the default `align-items: stretch`.
 */
const Stepper = styled.div`
  align-items: center;
  border: 1px solid var(--color-border);
  display: inline-flex;
  gap: 0;
  width: fit-content;
`
const StepButton = styled.button`
  background: transparent;
  border: 0;
  color: var(--color-ink);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.4rem 0.8rem;

  &:disabled {
    color: var(--color-border);
    cursor: not-allowed;
  }
`
const Value = styled.span`
  min-width: 2rem;
  padding: 0 0.4rem;
  text-align: center;
`

export type QuantityStepperProps = {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function QuantityStepper({ value, min = 1, max = 20, onChange }: QuantityStepperProps) {
  const { t } = useTranslation()
  return (
    <Stepper>
      <StepButton type="button" aria-label={t('product.decreaseQuantity')} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </StepButton>
      <Value>{value}</Value>
      <StepButton type="button" aria-label={t('product.increaseQuantity')} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </StepButton>
    </Stepper>
  )
}
