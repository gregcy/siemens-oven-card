/**
 * Formats a duration in total seconds as a numeric string.
 * Under one hour: "mm:ss"  e.g. formatTime(3599) → "59:59"
 * One hour or more: "hh:mm"  e.g. formatTime(5400) → "01:30"
 * The caller is responsible for rendering the styled 'h' / 'min' unit labels
 * (use isHourFormat to decide which mode applies).
 */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Returns true when totalSeconds requires the hh:mm display mode (≥ 1 hour). */
export function isHourFormat(totalSeconds: number): boolean {
  return totalSeconds >= 3600;
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
 * Parses the elapsed time entity value (h:mm format from home-connect-hass)
 * into total seconds. Returns null for unavailable/unknown/invalid values.
 */
export function parseElapsedToSeconds(value: string): number | null {
  if (!value || value === 'unavailable' || value === 'unknown') return null;
  const parts = value.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 3600 + m * 60;
}

/**
 * Returns the number of seconds elapsed since the given ISO 8601 timestamp.
 * Returns null if the timestamp is invalid.
 */
export function getSecondsSince(isoTimestamp: string): number | null {
  const ts = new Date(isoTimestamp).getTime();
  if (isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 1000));
}
