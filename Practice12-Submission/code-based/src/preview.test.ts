import { describe, expect, it } from 'vitest';
import { previewInterval } from './preview';

describe('timeline preview', () => {
  it('shows a valid whole-minute interval', () => {
    expect(previewInterval('660', '720')).toEqual({ start: 660, end: 720 });
  });

  it('does not round malformed or fractional input into a valid interval', () => {
    expect(previewInterval('660.5', '720')).toBeNull();
    expect(previewInterval('660junk', '720')).toBeNull();
    expect(previewInterval('', '720')).toBeNull();
  });

  it('uses the same boundary and duration limits as the checker', () => {
    expect(previewInterval('540', '600')).toBeNull();
    expect(previewInterval('720', '841')).toBeNull();
    expect(previewInterval('720', '840')).toEqual({ start: 720, end: 840 });
  });
});
