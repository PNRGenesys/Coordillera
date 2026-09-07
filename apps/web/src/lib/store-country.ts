/**
 * The store ships only inside Colombia for now, so the interface takes that for granted: it does not
 * ask for the country and it offers the real list of departments instead of a free text field.
 * Widening to another country means turning these into data that comes from the API.
 */

/** Order dates are read by the shop, so they are shown in the time zone the shop works in. */
export const STORE_TIME_ZONE = 'America/Bogota'

/** Example phone shown in the forms: a Colombian mobile number. */
export const PHONE_EXAMPLE = '3001234567'

/** The 32 departments plus the capital district, as DANE names them. */
export const COLOMBIA_REGIONS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
] as const
