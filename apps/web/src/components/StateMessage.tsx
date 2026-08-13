import { styled } from '@linaria/react'
import type { ReactNode } from 'react'

const Box = styled.div<{ $kind: StateMessageKind }>`
  border: 1px solid ${(props) => (props.$kind === 'error' ? 'var(--color-danger)' : 'var(--color-border)')};
  color: ${(props) => (props.$kind === 'error' ? 'var(--color-danger)' : 'inherit')};
  padding: 2rem;
  grid-column: 1 / -1;
`

export type StateMessageKind = 'loading' | 'error' | 'empty'

export type StateMessageProps = {
  kind: StateMessageKind
  children: ReactNode
}

export function StateMessage({ kind, children }: StateMessageProps) {
  return <Box $kind={kind}>{children}</Box>
}
