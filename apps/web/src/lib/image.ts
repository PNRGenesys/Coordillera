/**
 * The seed writes one canonical image URL per product (`/products/<slug>.jpg`), and a matching
 * `-thumb.jpg` (480px wide) is generated alongside it on disk. This derives the thumbnail URL by
 * convention instead of the API returning multiple sizes, to avoid a schema change for one field.
 */
export function toThumbUrl(url: string): string {
  return url.replace(/(\.[a-z0-9]+)$/i, '-thumb$1')
}
