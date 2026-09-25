# Morning handoff

## 1. What exists now
`/canvas` is a new medium, the **Shadow Field**. It opens onto an almost blank warm-white coordinate field with one faint mark on it: **TwinThink itself**. Scroll toward the mark and it becomes an ink drop. Fine dotted filaments grow out of it. Keep going and you are *inside* TwinThink, among its branches ("the Twin page", "what to show, what to keep", "the reality engine", …). Each branch holds the individual work sessions, and each session is a ledger of real times and commit hashes. Reverse the wheel and everything collapses back to the one mark.

Everything on the public Canvas is real:
- **TwinThink's Twin** is built from this repository's git history. Only timestamps, short hashes, categories and kinds are stored; commit messages never leave the build script, and a test enforces that.
- **Your own Shadows.** "cast a shadow" (or double-click empty space) plants a sentence. Inside it you can add thoughts (click "add a thought", or double-click), rewrite them, let them go, and keep a JSON copy. Every action is a dated event. It is stored on your device for now.

## 2. What changed visually
- The old dot grid and side panel are replaced by an immersive field with no navbar. Chrome is one italic serif line at each edge: breadcrumb bottom-left, quiet actions bottom-right, and a depth hairline on the right.
- Near-white paper, graphite ink, Cormorant italic labels, JetBrains Mono for dates.
- Dots → ink drops → dotted silk filaments → a faint wash and a lattice for the inner world.
- Recently active ideas give off a slow, faint ripple. Dormant ones are paler and still.

## 3. What changed technically
- `apps/web/src/lib/shadowfield/` is a pure-TS engine:
  - `camera.ts`: a nested-frame camera, precise at any depth, with enter/exit hysteresis
  - `navigate.ts`: cursor-anchored zoom, elastic limits, flights
  - `layout.ts`: topology derived from history
  - `render.ts`: Canvas2D semantic LOD
  - `spatial.ts`: grid index
  - `sources/`: data sources
- `apps/web/src/components/shadowfield/ShadowField.tsx`: input (wheel, trackpad pinch, touch pinch, drag with inertia, keyboard), overlays, URL-hash deep links, replay.
- `apps/api/shadows.py`: a server-side continuity log (append-only, server-timestamped, hash-chained).
- Tests: `npm test` in `apps/web` (14 tests), `pytest apps/api/tests` (76 tests).

## 4. Genuinely working
- The full loop, verified in Chromium on a production build: Canvas → TwinThink → a branch → a session → back out to the exact starting coordinate. It works by wheel, trackpad pinch, touch pinch, clicks, breadcrumbs, and Esc/Backspace.
- Casting and growing your own Shadow, persisting across reloads, with the URL restoring where you were.
- Replay and scrubbing, following, returning-viewer rings, and reduced-motion support.

## 5. Still simulated or local
- Your Shadows live in localStorage. The server log exists and is tested but is **not wired in**, because public posting needs a moderation decision from you (see 10).
- Following is per-device.
- "Sealed" (not yet open) nodes are enforced visually only. The public Canvas has none today.

## 6. Failed or abandoned
- **Demo Twins:** dropped, as you pointed out. Fabricated continuity defeats the point.
- **Rehearsal field route:** built for scale testing, then removed from the site.
- **Gravity that re-centred the target** fought the cursor anchor. It was replaced by anchoring the zoom on the idea itself.

## 7. Discovered along the way
- The repo's own history is a perfect first Twin. It has a real dormant gap (Aug 30 → Sep 15) and a revival burst, and they are visible as sparse filament stretches.
- Replay turned out to be the strongest "this idea is alive" moment.
- Server timestamps plus a hash chain turn "continuity" from a claim into evidence.
- Visual cryptography is prior art for the Lens reveal, and a better mechanism than near-white obfuscation (see the protocol doc).

## 8. Where to go first
`/canvas` on the deployment. Don't click anything at first: look for the faint mark just right of centre.

## 9. The best interaction to try
Put the cursor on the mark and scroll slowly and continuously all the way into TwinThink, then into "what to show, what to keep". Stop halfway and reverse. Then press **watch it grow**.

## 10. Next three highest-leverage things
1. **Decide public casting.** If yes: wire `ShadowStore` to `/api/shadows` (the shape already matches), add rate limits and a light moderation queue, and show server-verified continuity.
2. **Server-side disclosure.** Serve each viewer only elements with d(x) ≤ p, so sealed ideas become truly sealed. Then real creator Twins can go on the Canvas safely.
3. **Native interiors.** Waveforms for audio, typeset text for writing, and exploded line drawings for physical objects, reusing the existing Twin data model, so a song is never shown as CAD.
