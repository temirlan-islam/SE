import { describe, expect, it, vi } from 'vitest';
import { checkAvailability, EXISTING_BOOKINGS } from './availability';
import {
  buildExplanationRequest,
  createMockAdapter,
  explainAvailability,
  isValidExplanationRequest,
  reasonCodeFor,
  type ExplanationRequest,
} from './explanation';

function request(start = 720, end = 780, blocked = false): ExplanationRequest {
  const verdict = checkAvailability(start, end, blocked);
  return buildExplanationRequest('Room 301', start, end, verdict);
}

describe('Explain availability', () => {
  it('explains an available interval without creating a booking', async () => {
    const before = structuredClone(EXISTING_BOOKINGS);
    expect(await explainAvailability(request())).toEqual({
      text: 'Room 301 is available from 12:00 to 13:00. This check does not create a booking.',
      source: 'mock',
    });
    expect(EXISTING_BOOKINGS).toEqual(before);
    expect(checkAvailability(720, 780, false).kind).toBe('available');
  });

  it('uses the existing overlap reason and booking times', async () => {
    const result = await explainAvailability(request(630, 690));
    expect(result.source).toBe('mock');
    expect(result.text).toContain('Overlaps an existing booking (10:00–11:00).');
    expect(checkAvailability(630, 690, false).kind).toBe('unavailable');
  });

  it('explains blocked room using the deterministic reason', async () => {
    const result = await explainAvailability(request(720, 780, true));
    expect(result.source).toBe('mock');
    expect(result.text).toContain('The room is currently blocked');
  });

  it('preserves allowed touching endpoints', async () => {
    expect((await explainAvailability(request(541, 600))).text).toContain('is available');
    expect((await explainAvailability(request(660, 720))).text).toContain('is available');
  });

  it('rejects empty, malformed and overly long room labels', async () => {
    for (const label of ['', '<script>', 'R'.repeat(41)]) {
      const result = await explainAvailability({ ...request(), roomLabel: label });
      expect(result.source).toBe('fallback');
      expect(result.text).toBe('An explanation cannot be generated for this input.');
    }
  });

  it('rejects noninteger or out-of-range times', () => {
    expect(isValidExplanationRequest({ ...request(), start: 720.5 })).toBe(false);
    expect(isValidExplanationRequest({ ...request(), end: 1441 })).toBe(false);
    expect(isValidExplanationRequest({ ...request(), start: 780, end: 720 })).toBe(false);
  });

  it('returns a safe fallback for malformed top-level payloads without calling the adapter', async () => {
    const adapter = vi.fn(async () => ({}));
    for (const input of [null, undefined, '', 0, true, [], {}]) {
      await expect(explainAvailability(input, adapter)).resolves.toEqual({
        text: 'An explanation cannot be generated for this input.',
        source: 'fallback',
      });
    }
    expect(adapter).not.toHaveBeenCalled();
  });

  it('rejects a room label consisting only of spaces before calling the adapter', async () => {
    const adapter = vi.fn(async () => ({}));
    expect(await explainAvailability({ ...request(), roomLabel: '   ' }, adapter)).toEqual({
      text: 'An explanation cannot be generated for this input.',
      source: 'fallback',
    });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('rejects unknown or missing reason codes even when the room is unavailable', async () => {
    const adapter = vi.fn(async () => ({}));
    for (const reasonCode of ['NOT_A_CODE', null, undefined]) {
      expect(await explainAvailability({ ...request(720, 780, true), reasonCode }, adapter)).toEqual({
        text: 'An explanation cannot be generated for this input.',
        source: 'fallback',
      });
    }
    expect(adapter).not.toHaveBeenCalled();
  });

  it('rejects contradictory status and reason codes', () => {
    expect(isValidExplanationRequest({ ...request(), isAvailable: false })).toBe(false);
    expect(isValidExplanationRequest({ ...request(), reasonCode: 'OVERLAP' })).toBe(false);
  });

  it('falls back when the adapter fails', async () => {
    const result = await explainAvailability(request(), async () => { throw new Error('offline'); });
    expect(result.source).toBe('fallback');
    expect(result.text).toContain('is available');
  });

  it('falls back on timeout', async () => {
    const result = await explainAvailability(request(), () => new Promise(() => {}), 5);
    expect(result.source).toBe('fallback');
  });

  it('rejects malformed, long and HTML-like adapter output', async () => {
    for (const output of [null, { explanation: 'x'.repeat(241), isAvailable: true, reasonCode: 'AVAILABLE' }, { explanation: '<b>Available</b>', isAvailable: true, reasonCode: 'AVAILABLE' }]) {
      expect((await explainAvailability(request(), async () => output)).source).toBe('fallback');
    }
  });

  it('rejects an adapter response that changes status or reason code', async () => {
    const req = request(630, 690);
    expect((await explainAvailability(req, async () => ({ explanation: 'Room 301 is available.', isAvailable: true, reasonCode: 'AVAILABLE' }))).source).toBe('fallback');
  });

  it('recognizes known reasons without modifying the verdict', () => {
    const verdict = checkAvailability(630, 690, false);
    const before = structuredClone(verdict);
    expect(reasonCodeFor(verdict)).toBe('OVERLAP');
    expect(reasonCodeFor(checkAvailability(720, 720, false))).toBe('INVALID_TIME');
    expect(verdict).toEqual(before);
  });

  it('compares all three prompt variants on the same inputs', async () => {
    const cases = [request(), request(630, 690), request(720, 780, true)];
    for (const variant of ['minimal', 'friendly', 'constrained'] as const) {
      for (const [index, item] of cases.entries()) {
        const result = await explainAvailability(item, createMockAdapter(variant));
        expect(result.text).toContain(item.isAvailable ? 'available' : 'unavailable');
        expect(result.text).toContain(item.roomLabel);
        expect(result.source).toBe(variant === 'friendly' && index === 0 ? 'fallback' : 'mock');
      }
    }
  });
});
