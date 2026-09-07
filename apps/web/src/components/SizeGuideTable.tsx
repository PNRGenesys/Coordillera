import { styled } from '@linaria/react'
import { useTranslation } from '../lib/use-translation'

const Wrapper = styled.figure`
  margin: 0;
`
const Caption = styled.figcaption`
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  text-transform: uppercase;
`
/** Scrolls horizontally instead of breaking the page width if a guide ever carries more columns than a narrow phone can fit. */
const TableScroll = styled.div`
  overflow-x: auto;
`
const Table = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border: 1px solid var(--color-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
    white-space: nowrap;
  }

  th {
    background: var(--color-surface-alt);
  }
`

export type SizeGuideTableProps = {
  name: string
  unit: string
  columns: string[]
  rows: Record<string, string>[]
}

export function SizeGuideTable({ name, unit, columns, rows }: SizeGuideTableProps) {
  const { t } = useTranslation()
  return (
    <Wrapper>
      <Caption>{t('product.sizeGuideCaption', { name, unit })}</Caption>
      <TableScroll>
        <Table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{row[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </Wrapper>
  )
}
