/** Colombia-only store, same assumption as `lib/store-country.ts` on the web side. */
const CUSTOM_DESIGN_TIME_ZONE = 'America/Bogota'
const CUSTOM_DESIGN_WINDOW_START_HOUR = 9
const CUSTOM_DESIGN_WINDOW_END_HOUR = 18

const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: CUSTOM_DESIGN_TIME_ZONE, hour: 'numeric', hour12: false })

/** `hour12: false` can format midnight as `"24"` instead of `"0"`; both mean the same hour of the day. */
function currentHour(now: Date): number {
  const hour = Number(hourFormatter.format(now))
  return hour === 24 ? 0 : hour
}

/**
 * Custom design (fursona) requests can only be submitted from 9am to 6pm Bogotá time; outside that
 * window an artist could not even start the queue clock on the request until the next day.
 */
export function isCustomDesignWindowOpen(now: Date = new Date()): boolean {
  const hour = currentHour(now)
  return hour >= CUSTOM_DESIGN_WINDOW_START_HOUR && hour < CUSTOM_DESIGN_WINDOW_END_HOUR
}
