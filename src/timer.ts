/**
 * Formats a duration in total seconds as "mm:ss".
 * e.g. formatTime(5400) → "90:00"
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
 * Returns the number of seconds elapsed since the given ISO 8601 timestamp.
 * Returns null if the timestamp is invalid.
 */
export function getElapsedSeconds(isoTimestamp: string): number | null {
  const start = new Date(isoTimestamp).getTime();
  if (isNaN(start)) return null;
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}
