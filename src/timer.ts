/**
 * Formats a duration in total seconds as "hh:mm".
 * e.g. formatTime(5400) → "01:30"
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Returns the number of seconds until the given ISO 8601 timestamp.
 * Returns null if the timestamp is in the past, invalid, unavailable, or unknown.
 */
export function getRemainingSeconds(isoTimestamp: string): number | null {
  const finish = new Date(isoTimestamp).getTime();
  if (isNaN(finish)) return null;
  const remaining = Math.floor((finish - Date.now()) / 1000);
  return remaining > 0 ? remaining : null;
}

/**
 * Normalises the elapsed time entity value (h:mm format from home-connect-hass)
 * to padded hh:mm. Returns "--:--" for unavailable/unknown/invalid values.
 *
 * The entity reports values like "0:03" or "1:45" — we just pad hours to 2 digits.
 */
export function parseElapsedEntity(value: string): string {
  if (!value || value === 'unavailable' || value === 'unknown') return '--:--';
  const parts = value.split(':');
  if (parts.length !== 2) return '--:--';
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '--:--';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
