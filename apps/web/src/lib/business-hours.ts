import { STORE_TIME_ZONE } from './store-country'

/**
 * Mirrors `apps/api/src/business-hours.ts`. The API is the source of truth (it rejects the request
 * regardless), but checking here too avoids sending a customer through the whole form just to be
 * rejected at the last step.
 */
const CUSTOM_DESIGN_WINDOW_START_HOUR = 9
const CUSTOM_DESIGN_WINDOW_END_HOUR = 18

const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: STORE_TIME_ZONE, hour: 'numeric', hour12: false })

/** `hour12: false` can format midnight as `"24"` instead of `"0"`; both mean the same hour of the day. */
function currentHour(now: Date): number {
  const hour = Number(hourFormatter.format(now))
  return hour === 24 ? 0 : hour
}

export function isCustomDesignWindowOpen(now: Date = new Date()): boolean {
  const hour = currentHour(now)
  return hour >= CUSTOM_DESIGN_WINDOW_START_HOUR && hour < CUSTOM_DESIGN_WINDOW_END_HOUR
}
