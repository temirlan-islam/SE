import { describe, expect, it } from 'vitest';
import {
  checkAvailability,
  NOW,
  type Minutes,
} from './availability';

type Booking = [Minutes, Minutes];

function freshBookings(): Booking[] {
  return [[600, 660]];
}

describe('checkAvailability', () => {
  it('rejects start equal to or after end', () => {
    const bookings = freshBookings();

    expect(checkAvailability(660, 660, false, bookings)).toEqual({
      kind: 'unavailable',
      reason: 'End time must be after the start time.',
    });
    expect(checkAvailability(720, 660, false, bookings)).toEqual({
      kind: 'unavailable',
      reason: 'End time must be after the start time.',
    });
  });

  it('rejects requests in the past', () => {
    expect(checkAvailability(NOW - 1, 600, false, freshBookings())).toEqual({
      kind: 'unavailable',
      reason: 'Start time must be strictly later than now (09:00).',
    });
  });

  it('rejects start exactly equal to NOW', () => {
    expect(checkAvailability(NOW, 600, false, freshBookings())).toEqual({
      kind: 'unavailable',
      reason: 'Start time must be strictly later than now (09:00).',
    });
  });

  it('allows exactly 120 minutes and rejects 121 minutes', () => {
    expect(checkAvailability(720, 840, false, freshBookings())).toEqual({
      kind: 'available',
    });
    expect(checkAvailability(720, 841, false, freshBookings())).toEqual({
      kind: 'unavailable',
      reason: 'Booking duration is 121 min, but the maximum is 120 min.',
    });
  });

  it('rejects a request when the room is blocked', () => {
    expect(checkAvailability(720, 780, true, freshBookings())).toEqual({
      kind: 'unavailable',
      reason: 'The room is currently blocked and cannot be booked.',
    });
  });

  it('rejects overlapping bookings', () => {
    expect(checkAvailability(630, 690, false, freshBookings())).toEqual({
      kind: 'unavailable',
      reason: 'Overlaps an existing booking (10:00–11:00).',
    });
  });

  it('allows an interval touching the existing booking on either side', () => {
    expect(checkAvailability(541, 600, false, freshBookings())).toEqual({
      kind: 'available',
    });
    expect(checkAvailability(660, 720, false, freshBookings())).toEqual({
      kind: 'available',
    });
  });

  it('returns available for a valid interval', () => {
    expect(checkAvailability(720, 780, false, freshBookings())).toEqual({
      kind: 'available',
    });
  });

  it('does not change booking data after repeated calls', () => {
    const bookings = freshBookings();
    const originalBookings = structuredClone(bookings);

    checkAvailability(630, 690, false, bookings);
    checkAvailability(660, 720, false, bookings);
    checkAvailability(720, 780, false, bookings);

    expect(bookings).toEqual(originalBookings);
  });
});
