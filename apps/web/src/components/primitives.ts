import { styled } from '@linaria/react'
import { Link } from 'react-router-dom'

export const Section = styled.section`
  padding: clamp(3.5rem, 8vw, 7rem) clamp(1.25rem, 4vw, 4rem);
`
export const SectionHeader = styled.div`
  align-items: end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 2rem;
`
export const SectionTitle = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 4vw, 4rem);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  margin: 0;
`
export const Kicker = styled.p`
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0 0 1.25rem;
  text-transform: uppercase;
`
export const TextLink = styled(Link)`
  color: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-decoration: underline;
  text-underline-offset: 0.35rem;
  text-transform: uppercase;
`
export const Field = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`
export const FieldRow = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`
export const Input = styled.input`
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  padding: 0.6rem 0.75rem;
`
export const Select = styled.select`
  background: var(--color-background);
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  padding: 0.6rem 0.75rem;
`
export const PrimaryButton = styled.button`
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-background);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 1rem 1.5rem;
  text-transform: uppercase;

  &:disabled {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-border);
    cursor: not-allowed;
  }
`
export const FormGrid = styled.form`
  display: grid;
  gap: 1rem;
  max-width: 460px;
`
export const Legend = styled.h3`
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  margin: 1rem 0 0;
  text-transform: uppercase;
`
export const Note = styled.p`
  color: var(--color-accent);
  font-size: 0.75rem;
  margin: 0;
`
export const TextButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 800;
  justify-self: start;
  letter-spacing: 0.06em;
  padding: 0;
  text-decoration: underline;
  text-transform: uppercase;
`
/** Same look as `PrimaryButton` for the actions that are a link rather than a form control. */
export const PrimaryLink = styled(Link)`
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-background);
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 800;
  justify-self: start;
  letter-spacing: 0.08em;
  padding: 1rem 1.5rem;
  text-decoration: none;
  text-transform: uppercase;
`
export const ProductGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`
