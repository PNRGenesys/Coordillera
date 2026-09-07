export const LOCALES = ['es', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * Returns the overrides stored for a language. Callers merge them field by field over the base columns,
 * so a missing translation degrades to the copy as it was authored instead of to an empty string.
 * The argument is nullable because category, collection and size guide arrive through a left join.
 */
export function overridesFor<Fields>(translations: Record<string, Partial<Fields>> | null, locale: Locale): Partial<Fields> {
  return translations?.[locale] ?? {}
}
