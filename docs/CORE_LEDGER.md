# Core ledger

What is actually built against `docs/TWINTHINK_CORE_SPEC.md` (version 1.1), with evidence.
Update a row when its evidence changes; never mark a row done because a
smaller piece of it shipped. States (spec 16): specified, implemented locally,
tested, pushed, deployed, verified live, experience accepted.

"Verified live" below means: the flow was run in a browser against
www.twinth.ink on the named commit, with its assets fetched through this
environment's proxy (the sandbox browser cannot load production directly), as
a signed-out visitor with test Twins served in place of the real list where
noted. It is not a real-network, signed-in, or real-phone check. No row is
"experience accepted": that is John's call.

Last updated: 28 September 2026.

## Conflicts between the spec and later instructions

| Topic | Spec says | Later instruction from John | Resolution |
| --- | --- | --- | --- |
| Clock colors | 1.0: green 12, blue 3, orange/red 6, purple 9 | "i didnt want the colors tbh tho"; spec 1.1 now agrees (monochrome) | No colors. Hours are ink; the one turned into is written darker and larger. |
| Where the vortex's center is | a centered aiming reference (5.1) | "the police box is the mouse pointer locked in the center" | Pointer lock on desktop, with a hollow drop at the middle as the marker (not a literal police box). Esc lets go. |

## Rows

| ID | State | What exists | Where | Evidence | Gap |
| --- | --- | --- | --- | --- | --- |
| CORE-01 | verified live (ac602b0) | One core: things, lenses, moves, keepers, marks; every trace a fall leaves is one row in `RULES`. Existing features moved onto it, none removed. | `lib/shadowfield/core.ts`, `web.ts`, `ShadowField.tsx` | `core.test.ts`; eight browser regressions (stay, pressure, breadcrumb, Lean, edges, Fall with me, Rabi notice, fork journey) match their pre-core output on every commit since; live build checked to contain the core. | Space/connections and capacity are not core parts yet (spec 6.1): an opening is still a tree child, not a route record. |
| SPACE-01 | partial | Map ("see it whole") and flight read the same tree. | `layout.ts`, `flight.ts` | existing | Route topology beyond the tree is not built. |
| ORGANIZE (John, 28 Sep) | verified live (0b671d7) | Things stay with their group. On the Slate you fall past groups only; inside one, only it; its end returns to the Slate. | `groupLens`, `groupOf` in `core.ts`; `insideRef`, `goTo` | `core.test.ts`; browser walk locally and on the live Slate (today, HEX Lab, songs, TwinThink, dancing, moments, then the Slate again). | Within a group, order is newest first. "moments" is still a mixed bag of posts. |
| ORGANIZE-2 | verified live (9efe44c) | "goes with": a thing offers what it goes with in other groups, by a shared name or tag, never an ordinary word. Following it is a plain trip, not a Lean. | `relate.ts` | `relate.test.ts` (on the real Slate it finds one link: the #SIU3d dance and the song $IU3d); live run: offered, followed, no Lean. | Only names written on the things; nothing links by what they are about. Not a topic organization. |
| TIME-01 | tested | A thing sits at its hour on the face; 12 top, 3 right, 6 bottom, 9 left. | `clockAngle`, `quarterOf` in `flight.ts` | `core.test.ts` | Fixed UTC-6 (D-02); 12-hour face merges a.m. and p.m. (D-02). |
| TIME-02 | deployed (0b671d7), tested locally | Turned into an hour, the fall holds only work from around it and carries you on, deeper (older), through it. On the Slate, only groups holding that hour's work. | `hourLens`; wells in the frame loop | Browser (local): turned into 6, every thing passed was from around 6; turning to 3 switched streams. | Not run live. Depth policy is the prototype's, labeled, not settled (D-01). Honest empty: "nothing here from around N yet". |
| LENS-01, LENS-02 | verified live (857fd3b) | Time / Topic: "by time" / "by topic" (or the t key) re-arranges the same things around you: by topic, each group has its own direction and its name stands where the hours were. Order, depth and what you are on do not change; switching keeps nothing. Steering by topic, leaning hard toward a group goes into it. Back to time restores the hour you had turned into while steering. Monochrome. | `buildStream(root, topics)`, `topicAngles` in `flight.ts`; `drawTopics`; `toggleTopic`, `topicsRef` | Browser: Time, Topic, Time on the same thing (unchanged each time); arrangement changed and came back exactly; no Lean, no Fall step from switching; steered down by topic into moments. | Topics are the groups on the Slate, not subjects inferred from content. Two groups' labels can crowd on a phone. |
| MOVE-01 | verified live (9df39ad, 9efe44c) | Steering: desktop pointer lock with the drop at the middle; on any screen by touch (drag to aim, tap to go in, pinch one step, "stop steering"). | `steerRef`, pointer handlers, `drawDrop`, `BEND` | Browser locally and live: lock, aim, click, Esc; touch run at phone size live (emulated touch). | Not tried on a real phone. Reduced motion not yet evaluated with steering (VIS-08). |
| MOVE-02 | verified live (9efe44c) | Openings: at a branch the ways on wait ahead at their hours, ringed where the tunnel draws them; the paths beside you are side openings. A lean aims (nothing kept); a click or tap goes in (the Lean). | `aheadPaths`, `aheadFacing`, `drawAhead`, `edgePaths` | Live run (two test Twins): aimed at one, nothing kept; clicked, arrived, Lean kept (AT-06, AT-07); side openings the same (AT-08). | Up to 8 ways on; ways made in the same hour sit close together. |
| MEMORY-01 | verified live (709a447) | Passed fork gates; last choice per branch (Lean); every path explored from a place (heavier outline); every hour turned into, per place (a dot by the hour). On this device. | `RULES` explored and turned rows; `web.ts` | `core.test.ts`, `web.test.ts`; live run: a tap into an opening kept both the Lean and the explored path, nothing sent. | |
| HISTORY-01, RECAP-01 to 06 | verified live (857fd3b), except RECAP-03 | Your Fall, kept in order on this device (`journey.ts`): each place stayed with and each path chosen, with the hour turned into and the other ways that were open there then. "your Fall" replays the route step by step (all at once with reduced motion), then a path left open on it (offered then, open to you now, never reached), with John's hook "shoulda done lean." "look at it" shows its line; "go there" is its own step, checked against what you may enter now. The last five Falls are kept; "forget my Falls" clears them. With only the older unordered record, it says so and shows it unordered. | `journey.ts`, `RULES` journey rows, recap panel in `ShadowField.tsx` | `journey.test.ts` (order kept, repeats folded, nothing invented for unordered data, left-open rules, access at showing time, storage cleaning); browser, locally and live: route "a lamp that listens › Dolonia", left open "new project", opening/replay/looking kept no Lean and no step, "go there" arrived. | Silent: the song and its cue point are not confirmed, so there is no soundtrack (RECAP-03 not met). No export or sharing. |
| MEMORY-02, SIGNAL-01 | not to be built yet (John, 28 Sep) | Lean is private navigation state: on this device only, one per branch, a later one replaces it; never from scrolling, swiping, hovering or following the sequence. | `RULES` leaned row | Lean regressions; every browser run shows no POST for any Lean, reaction, journey step or lens change | "Others leaned this way too", server-side Lean collection and aggregate Lean statistics are not built and must not be, until a separate aggregate privacy protocol is deliberately designed. Research Mode does not override this. |
| SIGNAL-02 | deployed | Resonance dew from staying. | `RULES` resonance row | existing; stay regression | |
| REACT-01 | verified live (709a447) | Dew ("carry it forward") and Drop ("let it drop"): said, one or the other, never inferred. | `RULES` dew and drop rows; `react` | `core.test.ts`; live run: dew then drop replaced each other, no POST | On this device only; audience, aggregate and a mark in the fall are OPEN (D-07). |
| MAKE-01 | deployed | Forks: open, invite, post, move, close, reopen. | `store.ts` | fork journey regression | |
| RABI-01 | deployed (709a447), tested locally | Pressure notice to the maker with Rabi's proposal: a path from the end of the fork, a suggested name, who could post, the room it takes; the maker still makes it through the same composer and server checks. | Rabi notice in `ShadowField.tsx`; `createFork` | Rabi notice and fork journey regressions | Not run live (needs real pressure on a real maker's fork). Proposals do not draw on the fork's material, preview the route in the fall, or propose connections other than a new fork. Not the full architect. |
| CAP-01 | seam only (John, 28 Sep) | Room computed through `allowanceFor(base, entitlements)`, where an entitlement changes nothing yet. | `lib/entitlements.ts`, `store.ts` | `entitlements.test.ts`, fork room test | Unit, measure, default, expansion, price, founder effect: all OPEN (D-08). No payment, pricing, quotas or new limits. |
| COOP-01 | deployed (709a447), tested | Fall with me V1, plus switch lead ("let X lead"): the seat is overwritten in place, no history of who led; whoever handed it on can leave without ending it. | `passSharedFallLead`, `/api/shared-falls/[id]/lead` | `store.test.ts` switch-lead test; Fall with me regression | Two-account live check not done; peel off and rejoin not built. |
| COOP-02 | specified | | | | Creator co-op rights not built (D-09). |
| FOUNDER-01 | preserved, dormant (John, 28 Sep) | 47 unverified, 427 verified, 474 in all, as `FOUNDER_ALLOCATION`. Read by nothing that decides anything. | `lib/entitlements.ts` | `entitlements.test.ts` | Verification and what founders receive are OPEN (D-10). Nothing is granted from these numbers. |

## Next, in order

1. John tries steering, openings, Time / Topic, Dew/Drop, "goes with" and "your Fall", and says how they feel (experience acceptance, spec 16).
2. The recap's song: the confirmed recording and the cue point for "shoulda done lean" (RECAP-03).
3. Two-account live checks: switch lead, and a disclosure-gated leader (AT-12 to AT-15).
4. The notice covering the top label (VIS-07); reduced motion with steering (VIS-08).
5. Creator co-op rights (COOP-02), once D-09 is decided.
