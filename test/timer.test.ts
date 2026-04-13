import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, getRemainingSeconds, getElapsedSeconds } from '../src/timer';

describe('formatTime', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 90 seconds as 01:30', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('formats 5400 seconds as 90:00', () => {
    expect(formatTime(5400)).toBe('90:00');
  });

  it('pads single-digit minutes with leading zero', () => {
    expect(formatTime(65)).toBe('01:05');
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

describe('getElapsedSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds since a past timestamp', () => {
    const start = '2026-04-11T11:15:00Z';
    expect(getElapsedSeconds(start)).toBe(45 * 60);
  });

  it('returns 0 for a future timestamp', () => {
    const future = '2026-04-11T12:30:00Z';
    expect(getElapsedSeconds(future)).toBe(0);
  });

  it('returns null for invalid timestamp', () => {
    expect(getElapsedSeconds('unavailable')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getElapsedSeconds('')).toBeNull();
  });
});
