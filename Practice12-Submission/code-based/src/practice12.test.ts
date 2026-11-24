import { describe, expect, it } from 'vitest';
import { checkAvailability, EXISTING_BOOKINGS } from './availability';

describe('Practice 12 shared acceptance cases', () => {
  const cases = [
    ['T1 free', 660, 720, false, 'available', ''],
    ['T2 overlap', 630, 690, false, 'unavailable', 'Overlaps'],
    ['T3 blocked', 660, 720, true, 'unavailable', 'blocked'],
    ['T4 duration zero', 660, 660, false, 'unavailable', 'after the start'],
    ['T5 duration 121', 660, 781, false, 'unavailable', 'maximum'],
    ['T6 past start', 540, 600, false, 'unavailable', 'strictly later'],
    ['T7 adjacent', 660, 690, false, 'available', ''],
  ] as const;
  for (const [name, start, end, blocked, kind, reason] of cases) {
    it(name, () => {
      const result = checkAvailability(start, end, blocked);
      expect(result.kind).toBe(kind);
      if (reason && result.kind === 'unavailable') expect(result.reason).toContain(reason);
    });
  }
  it('T8 bookings unchanged', () => {
    const before = JSON.stringify(EXISTING_BOOKINGS);
    for (const [, start, end, blocked] of cases) checkAvailability(start, end, blocked);
    expect(JSON.stringify(EXISTING_BOOKINGS)).toBe(before);
  });
});
