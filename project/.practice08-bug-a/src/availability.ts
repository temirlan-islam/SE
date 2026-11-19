export type Minutes = number;

export const NOW: Minutes = 540;
export const MAX_DURATION = 120;
export const DAY_END: Minutes = 1440;
export const EXISTING_BOOKINGS: ReadonlyArray<[Minutes, Minutes]> = [[600, 660]];

export type Verdict =
  | { kind: 'available' }
  | { kind: 'unavailable'; reason: string };

function overlaps(aStart: Minutes, aEnd: Minutes, bStart: Minutes, bEnd: Minutes): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function checkAvailability(
  start: Minutes,
  end: Minutes,
  blocked: boolean,
  bookings: ReadonlyArray<[Minutes, Minutes]> = EXISTING_BOOKINGS,
): Verdict {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { kind: 'unavailable', reason: 'Start and end times must be whole minutes.' };
  }
  if (start < 0 || end > DAY_END) {
    return { kind: 'unavailable', reason: 'Times must be between 00:00 and 24:00 (0 and 1440).' };
  }
  if (start >= end) {
    return { kind: 'unavailable', reason: 'End time must be after the start time.' };
  }
  if (start <= NOW) {
    return { kind: 'unavailable', reason: `Start time must be strictly later than now (${formatMinutes(NOW)}).` };
  }

  const duration = end - start;
  if (duration > MAX_DURATION) {
    return { kind: 'unavailable', reason: `Booking duration is ${duration} min, but the maximum is ${MAX_DURATION} min.` };
  }

  if (blocked) {
    return { kind: 'unavailable', reason: 'The room is currently blocked and cannot be booked.' };
  }

  for (const [bStart, bEnd] of bookings) {
    if (overlaps(start, end, bStart, bEnd)) {
      return {
        kind: 'unavailable',
        reason: `Overlaps an existing booking (${formatMinutes(bStart)}–${formatMinutes(bEnd)}).`,
      };
    }
  }

  return { kind: 'available' };
}

function formatMinutes(minutes: Minutes): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const remainingMinutes = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${remainingMinutes}`;
}
