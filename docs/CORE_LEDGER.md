# Core ledger

What is actually built against `docs/TWINTHINK_CORE_SPEC.md`, with evidence.
Update a row when its evidence changes; never mark a row done because a
smaller piece of it shipped. States: specified, implemented locally, tested,
pushed, deployed, verified live, experience accepted (spec section 16).

Last updated: 28 September 2026, the commit that adds this file.

## Conflicts between the spec and later instructions

| Topic | Spec says | Later instruction from John | Resolution |
| --- | --- | --- | --- |
| Clock colors | green 12, blue 3, orange/red 6, purple 9 (7.1, AT-02) | "i didnt want the colors tbh tho" (after the drawing) | No colors. Hours are ink; the one turned into is written darker and larger. Position and text carry it, which the spec also requires. |
| Where the vortex's center is | a centered aiming reference (5.1) | "the police box is the mouse pointer locked in the center" | Pointer lock on desktop, with a hollow drop at the middle as the marker (not a literal police box). Esc lets go. |

## Rows

| ID | State | What exists | Where | Evidence | Gap |
| --- | --- | --- | --- | --- | --- |
| CORE-01 | tested, pushed | One core: things, lenses, moves, keepers, marks; every trace of a fall is one row in `RULES`. Existing features moved onto it, none removed. | `lib/shadowfield/core.ts`, `web.ts`, `ShadowField.tsx` | `core.test.ts`; eight browser regressions (stay, pressure, breadcrumb, Lean, edges, Fall with me, Rabi notice, fork journey) matched their pre-core output; live build ac602b0 checked to include the core. | Space/connections and capacity are not core parts yet (spec 6.1): an opening is still a tree child, not a route record. |
| SPACE-01 | partial | Map ("see it whole") and flight read the same tree. | `layout.ts`, `flight.ts` | existing | Route topology beyond the tree is not built. |
| ORGANIZE (John, 28 Sep) | tested locally | Things stay with their group. On the Slate you fall past groups only; inside one, only it; its end returns to the Slate. | `groupLens`, `groupOf` in `core.ts`; `insideRef`, `goTo` in `ShadowField.tsx` | `core.test.ts` (group lens); browser walk: Slate = HEX Lab, songs, TwinThink, dancing, moments; inside dancing = its two clips then the Slate; songs start to end then the Slate. | Within a group, order is still newest first; nothing yet links related things across groups (a dance clip to the song it is danced to). The "moments" group is still a mixed bag of posts. |
| TIME-01 | tested | A thing sits at its hour on the face; 12 top, 3 right, 6 bottom, 9 left. | `clockAngle`, `quarterOf` in `flight.ts` | `core.test.ts` | Fixed UTC-6 (D-02 open); 12-hour face merges a.m. and p.m. (D-02). |
| TIME-02 | tested locally | Turned into an hour, the fall holds only work from around it and carries you on, deeper (older), through it. | `hourLens` in `core.ts`; wells in the frame loop | Browser: turned into 6, every thing passed was from around 6; turning to 3 switched streams; on the Slate only groups holding 6 work stayed. | Depth policy is the prototype's (newest first, across days), labeled, not settled (D-01). Honest empty: "nothing here from around N yet". |
| MOVE-01 | tested locally | Desktop steering with pointer lock; drop at the middle; the way ahead bends toward the hand; click acts on the thing you are on or goes into the group you face. | `steerRef`, pointer handlers, `drawDrop`, `BEND` | Browser: locked, steered into 6 and 3, click entered TwinThink, Esc released. | Phone steering built: "steer" on any screen; a finger drags to aim, a tap goes in, a pinch is one step on or back, "stop steering" ends it (browser, phone size, emulated touch). Not yet tried on a real phone. Reduced motion not yet evaluated with steering (VIS-08). |
| MOVE-02 | tested locally | At a branch, the other paths are openings at the sides. Steering, they stay in view as you move; leaning a little toward one looks at it (it comes clearer, nothing is kept); a click goes into it, which is the Lean. Leaning hard turns into an hour instead. | `steer.aim`, `edgesRef` in `ShadowField.tsx`; `drawEdge` | Browser (two sibling Twins): looked right, nothing kept; clicked, on the other Twin, Lean kept; looked left, clicked, back, Lean replaced (AT-06, AT-07, AT-08). | Openings are at the sides of the view, not yet places ahead in the tunnel that grow as you fall toward them (5.3). Only the nearest path on each side. |
| MEMORY-01 | tested locally | Passed fork gates; last choice per branch (Lean); every path explored from a place, kept alongside the last (its opening's outline is written heavier); every hour turned into, per place (a dot by the hour). All on this device. | `RULES` explored and turned rows; `web.ts` `exploredFrom`, `turnedIn` | `core.test.ts`, `web.test.ts`; browser: a tap into an opening kept both the Lean and the explored path; nothing sent | No "Save this Fall" yet (HISTORY-01). |
| MEMORY-02, SIGNAL-01 | not to be built yet (John, 28 Sep) | Lean is private navigation state: on this device only, one per branch, a later one replaces it; never from scrolling, swiping, hovering or following the sequence. | `RULES` leaned row | Lean regressions; browser runs show no POST for any Lean | "Others leaned this way too", server-side Lean collection and aggregate Lean statistics are not built and must not be, until a separate aggregate privacy protocol is deliberately designed. Research Mode does not override this. |
| SIGNAL-02 | deployed | Resonance dew from staying. | `RULES` resonance row | existing | |
| REACT-01 | tested locally | Dew ("carry it forward") and Drop ("let it drop"): said by the visitor, one or the other, never inferred from passing, leaving or not choosing. | `RULES` dew and drop rows; `react` in `ShadowField.tsx` | `core.test.ts`; browser: dew then drop replaced each other, no POST | Kept on this device only; audience, aggregate and a mark in the fall are OPEN (D-07). |
| MAKE-01 | deployed | Forks: open, invite, post, move, close, reopen. | `store.ts` | fork journey regression | |
| RABI-01 | tested locally (proposal) | Pressure notice to the maker, now with Rabi's proposal: a path from the end of the fork, a suggested name, who could post, the room it takes. "open a path" opens the composer with the name filled in; the maker still names, chooses and makes it, through the same checks as any fork (server revalidates room and ownership). | Rabi notice in `ShadowField.tsx`; `createFork` | Rabi notice and fork journey regressions | Proposals do not yet draw on the fork's material, preview the route in the fall, or propose connections other than a new fork. Not the full architect. |
| CAP-01 | seam only (John, 28 Sep) | `FORK_ROOM_MAX` room per maker, computed through `allowanceFor(base, entitlements)`, where an entitlement changes nothing yet. | `lib/entitlements.ts`, `store.ts` | `entitlements.test.ts`, fork room test | Unit, measure, default, what an expansion holds, price, one-time or recurring, founder effect: all OPEN (D-08). No payment, pricing, quotas or new limits are to be built. |
| COOP-01 | tested locally (switch lead) | Fall with me V1, plus switch lead: the leader hands the Fall to someone still in it (named by their token for this Fall); the seat is overwritten, no history of who led; the one who handed it on can leave without ending it. | `passSharedFallLead`, `/api/shared-falls/[id]/lead`, "let X lead" | `store.test.ts` switch-lead test; Fall with me regression | Two-account live check of switch lead not yet done; peel off and rejoin not built. |
| COOP-02 | specified | | | | Creator co-op rights not built (D-09). |
| ORGANIZE-2 | tested locally | "goes with": a thing offers what it goes with in other groups, by a shared name or tag (never an ordinary word): the #SIU3d dance and the song $IU3d. | `lib/shadowfield/relate.ts` | `relate.test.ts` (on the real Slate, that is the one link it finds); browser | Only names written on the things; nothing links by what they are about. |
| HISTORY-01 | specified | | | | "Save this Fall" not built. |
| FOUNDER-01 | preserved, dormant (John, 28 Sep) | The allocation as set: 47 unverified, 427 verified, 474 in all, as `FOUNDER_ALLOCATION`. Read by nothing that decides anything. | `lib/entitlements.ts` | `entitlements.test.ts` | What verified requires, and what founders receive, are OPEN (D-10). No verification, rewards, perks, space or access are to be built from these numbers. |

## Next, in order

1. Openings ahead in the tunnel, not only at the sides (MOVE-02 gap).
2. The steering notice sits over the 12 while it shows (VIS-07).
3. Relevance inside the Slate: related things linked across groups (ORGANIZE gap).
4. Phone steering (AT-05).
