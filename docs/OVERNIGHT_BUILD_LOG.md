# Overnight build log — Shadow Field

Branch: `shadow-field-z`

## Inspected
- `/canvas` prototype: 1,400 seeded dots, CSS-style zoom, side panel. Useful ideas kept: near-blank field, backing semantics, per-device persistence.
- Twin routes, `lib/types.ts`, API proxy routes, `docs/SHADOW_PROTOCOL_0_1.md`, `docs/ROADMAP.md`, Python package (schema, crypto, BOM, MCP).
- Git history: 74 commits, Aug 26 → Sep 24, with a real dormant gap (Aug 30 → Sep 15) and a revival burst.

## Decisions
- **No fabricated ideas on the public Canvas.** Seeded "demo Twins" would fake exactly the thing TwinThink exists to prove: real continuity. The public Canvas holds only:
  1. **TwinThink's own Twin**, built from this repo's real history (`scripts/build_twinthink_continuity.mjs`). Commit messages are used only to classify changes locally and are never written out; the record is timestamps, short hashes, category, kind. A test enforces this.
  2. **Shadows the viewer casts** (`sources/local.ts`). Every thought, rewrite, let-go and return is a real event, stored on-device for now behind a `ShadowStore` interface.
- **Nested-frame camera** (`lib/shadowfield/camera.ts`). The camera lives in the frame of the deepest idea it is inside. Entering a child is a change of coordinates, not a scene change, so Z is continuous, reversible and precise at any depth. Hysteresis (enter at 0.9 of the screen, leave at 0.45) prevents flicker.
- **Semantic LOD by on-screen radius** (`render.ts`). One number per node, R, drives the cross-fades: dot → ink drop → filaments (most-developed first) → wash and lattice of the inner world. The parent's content fades as the child becomes the environment.
- **Filaments are history.** Distance along a strand is time. Density comes from the number of real events; silence longer than a threshold renders as sparse dots; pruned directions become tapering twigs; later thoughts fork from earlier strands heading the same way. Nothing is decorative randomness except the seed-stable shape.
- **Zoom anchors on the idea under the cursor**, so the thing you point at grows in place and becomes the world. Soft elastic limits stop you from zooming into blank space.
- **Canvas2D, not WebGL.** At this scale (tens of strands, thousands of dots per frame) Canvas2D is fast, and the dot/gradient vocabulary is easier to make delicate. Hierarchical dot sampling (2^L levels, finest level fades in) keeps dots stable while zooming, and each strand is clipped to its visible parameter range.

## Timeline
- Engine modules: rng, model, layout, camera, navigate, render, sources, world.
- First browser run: zoom stalled because gravity dragged the target away from the cursor. Replaced with an anchored zoom.
- Children vanished after entering: the parent's fade-out was inherited. Separated "reveal" from "fade".
- Double-counted changes (sessions repeat branch events): added `summarizes`.
- Leaf ledgers were invisible inside the leaf: rescaled text LOD.
- Verified the full loop in Chromium: canvas → TwinThink → the Twin page → aug 29, night → back to canvas at the same coordinate.
- Tests: 11 passing (`npm test` in apps/web).
