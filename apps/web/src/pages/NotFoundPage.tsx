import { Link } from 'react-router-dom'
import { Section, SectionHeader, SectionTitle } from '../components/primitives'
import { useTranslation } from '../lib/use-translation'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('notFound.title')}</SectionTitle>
      </SectionHeader>
      <Link to="/">{t('notFound.backToShop')}</Link>
    </Section>
  )
}
