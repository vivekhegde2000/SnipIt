const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' })
const absoluteFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** "just now", "5 min. ago", "yesterday", "3 wk. ago" — in the user's locale. */
export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = timestamp - now
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return relativeFormatter.format(Math.round(diff / ms), unit)
  }
  return 'just now'
}

/** Full date and time, e.g. for tooltips and `<time title>`. */
export function formatDateTime(timestamp: number): string {
  return absoluteFormatter.format(timestamp)
}
