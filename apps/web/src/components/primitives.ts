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
  font-weight: 400;
  letter-spacing: -0.07em;
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
export const ProductGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`
