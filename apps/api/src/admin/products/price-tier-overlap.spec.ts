import { describe, it, expect } from 'vitest';
import { rangesOverlap } from './price-tier-overlap.util';

describe('rangesOverlap', () => {
  it('adjacentRangesDoNotOverlap', () => {
    expect(rangesOverlap(1, 5, 6, 10)).toBe(false);
  });

  it('overlappingRangesDetected', () => {
    expect(rangesOverlap(1, 10, 5, 15)).toBe(true);
  });

  it('unlimitedRangeOverlapsFiniteRange', () => {
    expect(rangesOverlap(10, null, 8, 20)).toBe(true);
  });

  it('unlimitedRangesOverlapEachOther', () => {
    expect(rangesOverlap(5, null, 10, null)).toBe(true);
  });

  it('singleQtyRangesAtBoundary', () => {
    expect(rangesOverlap(5, 5, 6, 6)).toBe(false);
  });

  it('identical ranges overlap', () => {
    expect(rangesOverlap(1, 10, 1, 10)).toBe(true);
  });

  it('contained range overlaps', () => {
    expect(rangesOverlap(1, 20, 5, 10)).toBe(true);
  });

  it('touching ranges overlap (boundary inclusive)', () => {
    expect(rangesOverlap(1, 5, 5, 10)).toBe(true);
  });

  it('finite range below unlimited does not overlap', () => {
    expect(rangesOverlap(1, 5, 10, null)).toBe(false);
  });

  it('unlimited starting at 1 overlaps everything', () => {
    expect(rangesOverlap(1, null, 100, 200)).toBe(true);
  });
});
