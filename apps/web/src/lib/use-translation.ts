import { selectLanguage } from '../store/ui-slice'
import { useAppSelector } from '../store/hooks'
import { numberLocaleByLanguage, translations, type TranslationKey } from './translations'

export function useTranslation() {
  const language = useAppSelector(selectLanguage)

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const template = translations[language][key]
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
  }

  return { language, numberLocale: numberLocaleByLanguage[language], t }
}
