import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, isHourFormat, getRemainingSeconds, parseElapsedToSeconds, getSecondsSince } from '../src/timer';

describe('formatTime', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 90 seconds as 01:30', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  it('pads single-digit minutes with leading zero', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 3599 seconds (59:59) still as mm:ss', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats 3600 seconds (1h) as hh:mm', () => {
    expect(formatTime(3600)).toBe('01:00');
  });

  it('formats 5400 seconds (1h30m) as hh:mm', () => {
    expect(formatTime(5400)).toBe('01:30');
  });

  it('formats 7384 seconds (2h03m) as hh:mm', () => {
    expect(formatTime(7384)).toBe('02:03');
  });
});

describe('isHourFormat', () => {
  it('returns false for 3599 seconds', () => {
    expect(isHourFormat(3599)).toBe(false);
  });

  it('returns true for 3600 seconds', () => {
    expect(isHourFormat(3600)).toBe(true);
  });

  it('returns true for values over one hour', () => {
    expect(isHourFormat(7200)).toBe(true);
  });
});

describe('getRemainingSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds until a future timestamp', () => {
    const future = '2026-04-11T12:45:00Z';
    expect(getRemainingSeconds(future)).toBe(45 * 60);
  });

  it('returns null for a past timestamp', () => {
    const past = '2026-04-11T11:00:00Z';
    expect(getRemainingSeconds(past)).toBeNull();
  });

  it('returns null for unavailable', () => {
    expect(getRemainingSeconds('unavailable')).toBeNull();
  });

  it('returns null for unknown', () => {
    expect(getRemainingSeconds('unknown')).toBeNull();
  });
});

describe('parseElapsedToSeconds', () => {
  it('converts 0:03 to 180 seconds', () => {
    expect(parseElapsedToSeconds('0:03')).toBe(180);
  });

  it('converts 1:45 to 6300 seconds', () => {
    expect(parseElapsedToSeconds('1:45')).toBe(6300);
  });

  it('returns null for unavailable', () => {
    expect(parseElapsedToSeconds('unavailable')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseElapsedToSeconds('')).toBeNull();
  });
});

describe('getSecondsSince', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds since a past timestamp', () => {
    expect(getSecondsSince('2026-04-11T11:15:00Z')).toBe(45 * 60);
  });

  it('returns 0 for a future timestamp', () => {
    expect(getSecondsSince('2026-04-11T12:30:00Z')).toBe(0);
  });

  it('returns null for invalid timestamp', () => {
    expect(getSecondsSince('unavailable')).toBeNull();
  });
});
