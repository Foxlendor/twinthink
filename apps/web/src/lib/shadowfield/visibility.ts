// Semantic visibility orchestration.
// At any Z-depth, controls which representation classes are visible and at what opacity.
// The goal: distance creates clarity, not clutter.
// Deeper Z means previous context fades while next context gains resolution.

import { smoothstep } from './rng';

/** Visibility values for all representation classes at a given Z depth. */
export interface SemanticVisibility {
  // Parent world (what you're leaving)
  parentWorld: number; // environmental presence of parent
  parentStructure: number; // parent's topology lines/filaments
  parentLabels: number; // parent's text labels
  parentDetail: number; // parent's artifacts, history, secondary branches

  // Target/focus (what you're entering)
  childShadow: number; // the target idea as a visual point
  childStructure: number; // emerging topology/filaments
  childNodes: number; // child points starting to separate
  childLabels: number; // child text becoming readable
  childDetail: number; // child artifacts, history, secondary info

  // Environment (context)
  environmentalPoints: number; // distant unrelated nodes
  environmentalFilaments: number; // faint connecting threads
  focusHalo: number; // subtle glow around focused node
}

/**
 * Compute semantic visibility based on Z progress.
 * Progress is continuous [0, 1] representing movement from far (0) to fully inside (1).
 * Different element types fade/appear at different rates to avoid overcrowding.
 */
export function semanticVisibilityAt(progress: number): SemanticVisibility {
  // Clamp to valid range
  const p = Math.max(0, Math.min(1, progress));

  // Parent fades out as child fades in, with different timings per element type
  const parentWorldFade = Math.max(0, 1 - smoothstep(0, 0.35, p));
  const parentStructureFade = Math.max(0, 1 - smoothstep(0.05, 0.45, p));
  const parentLabelsFade = Math.max(0, 1 - smoothstep(0, 0.2, p));
  const parentDetailFade = Math.max(0, 1 - smoothstep(0, 0.15, p));

  // Child emerges in phases
  const childShadowRise = smoothstep(0, 0.3, p); // rises fast
  const childStructureRise = smoothstep(0.2, 0.55, p); // emerges mid-range
  const childNodesRise = smoothstep(0.35, 0.65, p); // points separate gradually
  const childLabelsRise = smoothstep(0.65, 0.85, p); // labels arrive late
  const childDetailRise = smoothstep(0.82, 1, p); // deep info arrives very late

  // Environmental always present but faint
  const envPoints = 0.12;
  const envFilaments = 0.06;

  return {
    // Parent world (what you're leaving)
    parentWorld: parentWorldFade,
    parentStructure: parentStructureFade,
    parentLabels: parentLabelsFade,
    parentDetail: parentDetailFade,

    // Child (what you're entering)
    childShadow: childShadowRise,
    childStructure: childStructureRise,
    childNodes: childNodesRise,
    childLabels: childLabelsRise,
    childDetail: childDetailRise,

    // Environment
    environmentalPoints: envPoints,
    environmentalFilaments: envFilaments,
    focusHalo: 0, // filled in by focus logic
  };
}

/**
 * Apply focus dampening: when a node is focused, emphasize it and quiet surroundings.
 * Subtle—not a spotlight—just a slight shift in attention.
 *
 * NOTE: Defined but not yet integrated into render path. Deferred pending focus system implementation.
 */
export function applyFocus(base: SemanticVisibility, isFocused: boolean, isConnected: boolean, isNearby: boolean): SemanticVisibility {
  if (!isFocused && !isConnected && !isNearby) {
    // Unrelated to focus; reduce visibility slightly
    return {
      ...base,
      childNodes: base.childNodes * 0.6,
      childLabels: base.childLabels * 0.5,
      childStructure: base.childStructure * 0.7,
      childDetail: base.childDetail * 0.5,
      environmentalPoints: base.environmentalPoints * 0.7,
      environmentalFilaments: base.environmentalFilaments * 0.7,
    };
  }

  if (isFocused) {
    // Primary focus; full visibility
    return {
      ...base,
      focusHalo: 1,
      childNodes: Math.min(1, base.childNodes * 1.2),
      childLabels: Math.min(1, base.childLabels * 1.1),
    };
  }

  if (isConnected) {
    // Directly connected to focus; high but not maximum
    return {
      ...base,
      childStructure: Math.min(1, base.childStructure * 0.95),
      childNodes: Math.min(1, base.childNodes * 0.9),
    };
  }

  if (isNearby) {
    // Nearby but not connected; quiet but present
    return {
      ...base,
      childNodes: base.childNodes * 0.5,
      childLabels: base.childLabels * 0.4,
    };
  }

  return base;
}

/**
 * Classify information into attention tiers.
 * Used to determine what should be rendered prominently vs. suppressed.
 *
 * NOTE: Defined but not yet integrated into render path. Requires implementation of
 * priority-based selection (focused, connected, topological weight, coherence).
 * Deferred pending attention system design.
 */
export type VisibilityTier = 'foreground' | 'environmental' | 'latent';

export function classifyByAttentionBudget(
  nodeIndex: number,
  totalNodes: number,
  isFocused: boolean,
  coherence: number // 0–1 importance/coherence metric
): VisibilityTier {
  if (isFocused) return 'foreground';

  // Roughly 3–7 foreground, 10–15 environmental, rest latent
  const foregroundBudget = 7;
  const environmentalBudget = 15;

  // Rank by coherence (importance)
  const expectedForeground = Math.ceil(Math.min(foregroundBudget, totalNodes / 2));
  if (nodeIndex < expectedForeground) return 'foreground';

  if (nodeIndex < environmentalBudget) return 'environmental';

  return 'latent';
}

/**
 * Map visibility tier to opacity multiplier for all element types.
 */
export function tierOpacity(tier: VisibilityTier): number {
  switch (tier) {
    case 'foreground':
      return 1;
    case 'environmental':
      return 0.3;
    case 'latent':
      return 0.05; // barely visible; revealed by Z later
  }
}
