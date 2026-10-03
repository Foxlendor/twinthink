// Seams for what is decided later, and nothing more.
//
// Capacity: the room a person's world has for structure (today, forks). One day a person may
// widen it, like unlocking a larger region, not buying storage. What one unit is, how it is
// measured, what the default is, what an expansion holds, and what it costs are all OPEN (spec
// D-08). So an entitlement exists as a shape the room is computed through, and changes nothing.
//
// Founders: the allocation is set, as history: 47 unverified positions, then 427 verified, 474 in
// all. What "verified" requires, and what founders receive, are OPEN (spec D-10). These numbers
// are dormant metadata: no code may grant money, room, permissions, status or access from them
// until that contract exists.

/** A right to more room, from somewhere. What it grants is not yet defined. */
export interface CapacityEntitlement {
  id: string;
  /** Where it came from (kept, never interpreted yet). */
  source: string;
}

/**
 * The room a person has: the base allowance, through their entitlements. Until the unit of
 * capacity is defined, an entitlement adds nothing; this is the one place that will change.
 */
export function allowanceFor(base: number, entitlements: readonly CapacityEntitlement[]): number {
  void entitlements;
  return base;
}

/** The founder allocation, as it was set. Dormant: read by nothing that decides anything. */
export const FOUNDER_ALLOCATION = {
  unverified: 47,
  verified: 427,
  total: 474,
} as const;
