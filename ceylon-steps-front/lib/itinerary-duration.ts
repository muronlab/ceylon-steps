/**
 * Format a total-minutes duration (used by DURATION-type itineraries) into a
 * short human label, e.g. 240 → "4h", 270 → "4h 30m", 45 → "45m".
 *
 * Returns an empty string for null / non-positive values so callers can fall
 * back to other duration sources.
 */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return ""
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
