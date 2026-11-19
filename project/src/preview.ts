import { DAY_END, MAX_DURATION, NOW, type Minutes } from './availability';

export function previewInterval(startInput: string, endInput: string): { start: Minutes; end: Minutes } | null {
  const startRaw = startInput.trim();
  const endRaw = endInput.trim();
  if (!startRaw || !endRaw) return null;
  const start = Number(startRaw);
  const end = Number(endRaw);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start <= NOW ||
    start >= end ||
    end > DAY_END ||
    end - start > MAX_DURATION
  ) return null;
  return { start, end };
}
