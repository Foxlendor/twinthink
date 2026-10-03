import { describe, expect, it } from 'vitest';
import { FOUNDER_ALLOCATION, allowanceFor } from './entitlements';

describe('entitlement seams', () => {
  it('an entitlement changes no one’s room until its unit is defined', () => {
    expect(allowanceFor(12, [])).toBe(12);
    expect(allowanceFor(12, [{ id: 'e1', source: 'anything' }])).toBe(12);
  });

  it('the founder allocation is kept as it was set: 47 and 427, 474 in all', () => {
    expect(FOUNDER_ALLOCATION).toEqual({ unverified: 47, verified: 427, total: 474 });
    expect(FOUNDER_ALLOCATION.unverified + FOUNDER_ALLOCATION.verified).toBe(FOUNDER_ALLOCATION.total);
  });
});
