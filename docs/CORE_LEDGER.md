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
| What "topic" means | 1.1 (20.1): a topic lens that "reorganizes the same permitted work" | Clarified 28 Sep: say plainly that topics are the groups | **By topic = view the Slate through the groups already made (your songs, TwinThink, a posted Twin). It does not infer, classify, or rename content.** No subject is ever worked out from what things say. Anything smarter would be a new, separately decided feature. |
| Name of the space | ShadowField (the component) | 29 Sep: "it needs to be called Shadow Slate" | **Shadow Slate** is the name of the deep, spatial layer from now on (the Slate is the surface; Shadow Slate is where ideas get depth, history and relationships). Code names (`ShadowField.tsx`, `lib/shadowfield/`) stay as they are, since renaming files and ids would change nothing a person sees. |
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
| LENS-01, LENS-02 | verified live (857fd3b) | Time / Topic: "by time" / "by topic" (or the t key) re-arranges the same things around you: by topic, each group has its own direction and its name stands where the hours were. Order, depth and what you are on do not change; switching keeps nothing. Steering by topic, leaning hard toward a group goes into it. Back to time restores the hour you had turned into while steering. Monochrome. | `buildStream(root, topics)`, `topicAngles` in `flight.ts`; `drawTopics`; `toggleTopic`, `topicsRef` | Browser: Time, Topic, Time on the same thing (unchanged each time); arrangement changed and came back exactly; no Lean, no Fall step from switching; steered down by topic into moments. | Topics are the groups on the Slate, never subjects inferred from content (see the conflicts table). Labels shorten and step apart when crowded. |
| MOVE-01 | verified live (9df39ad, 9efe44c); reduced motion tested locally | Steering: desktop pointer lock with the drop at the middle; on a phone by thumb (drag to aim, tap to go in, pinch one step, "stop steering"). The phone itself never steers: orientation is not read at all. With reduced motion the way ahead never swings. | `steerRef`, `steerHandRef`, pointer handlers, `drawDrop`, `BEND` | Browser locally and live: lock, aim, click, Esc; touch at phone size (emulated). Tilt removal: emulated Android tilt events change nothing before, during or after steering; drag, tap and pinch unchanged. | Not tried on a real phone. The thumb joystick (decided) is not built yet. |
| MOVE-02 | verified live (9efe44c) | Openings: at a branch the ways on wait ahead at their hours, ringed where the tunnel draws them; the paths beside you are side openings. A lean aims (nothing kept); a click or tap goes in (the Lean). | `aheadPaths`, `aheadFacing`, `drawAhead`, `edgePaths` | Live run (two test Twins): aimed at one, nothing kept; clicked, arrived, Lean kept (AT-06, AT-07); side openings the same (AT-08). | Up to 8 ways on; ways made in the same hour sit close together. |
| MEMORY-01 | verified live (709a447) | Passed fork gates; last choice per branch (Lean); every path explored from a place (heavier outline); every hour turned into, per place (a dot by the hour). On this device. | `RULES` explored and turned rows; `web.ts` | `core.test.ts`, `web.test.ts`; live run: a tap into an opening kept both the Lean and the explored path, nothing sent. | |
| HISTORY-01, RECAP-01 to 06 | verified live (857fd3b), except RECAP-03 | Your Fall, kept in order on this device (`journey.ts`): each place stayed with and each path chosen, with the hour turned into and the other ways that were open there then. "your Fall" replays the route step by step (all at once with reduced motion), then a path left open on it (offered then, open to you now, never reached), with John's hook "shoulda done lean." "look at it" shows its line; "go there" is its own step, checked against what you may enter now. The last five Falls are kept; "forget my Falls" clears them. With only the older unordered record, it says so and shows it unordered. | `journey.ts`, `RULES` journey rows, recap panel in `ShadowField.tsx` | `journey.test.ts` (order kept, repeats folded, nothing invented for unordered data, left-open rules, access at showing time, storage cleaning); browser, locally and live: route "a lamp that listens › Dolonia", left open "new project", opening/replay/looking kept no Lean and no step, "go there" arrived. | Silent: the song and its cue point are not confirmed, so there is no soundtrack (RECAP-03 not met). No export or sharing. |
| MEMORY-02, SIGNAL-01 | not to be built yet (John, 28 Sep) | Lean is private navigation state: on this device only, one per branch, a later one replaces it; never from scrolling, swiping, hovering or following the sequence. | `RULES` leaned row | Lean regressions; every browser run shows no POST for any Lean, reaction, journey step or lens change | "Others leaned this way too", server-side Lean collection and aggregate Lean statistics are not built and must not be, until a separate aggregate privacy protocol is deliberately designed. Research Mode does not override this. |
| SIGNAL-02 | deployed | Resonance dew from staying. | `RULES` resonance row | existing; stay regression | |
| REACT-01 | verified live (709a447) | Dew ("carry it forward") and Drop ("let it drop"): said, one or the other, never inferred. | `RULES` dew and drop rows; `react` | `core.test.ts`; live run: dew then drop replaced each other, no POST | On this device only; audience, aggregate and a mark in the fall are OPEN (D-07). |
| MAKE-01 | deployed | Forks: open, invite, post, move, close, reopen. | `store.ts` | fork journey regression | |
| RABI-01 | deployed (709a447), tested locally | Pressure notice to the maker with Rabi's proposal: a path from the end of the fork, a suggested name, who could post, the room it takes; the maker still makes it through the same composer and server checks. | Rabi notice in `ShadowField.tsx`; `createFork` | Rabi notice and fork journey regressions | Not run live (needs real pressure on a real maker's fork). Proposals do not draw on the fork's material, preview the route in the fall, or propose connections other than a new fork. Not the full architect. |
| CAP-01 | seam only (John, 28 Sep) | Room computed through `allowanceFor(base, entitlements)`, where an entitlement changes nothing yet. | `lib/entitlements.ts`, `store.ts` | `entitlements.test.ts`, fork room test | Unit, measure, default, expansion, price, founder effect: all OPEN (D-08). No payment, pricing, quotas or new limits. |
| COOP-01 | deployed (709a447), tested | Fall with me V1, plus switch lead ("let X lead"): the seat is overwritten in place, no history of who led; whoever handed it on can leave without ending it. A follower is only ever sent a place they could see themselves (public and not taken down, or their own; the Slate's own content); otherwise only `beyond`, never the id, and they stay where they are with "X moved into a path you can't enter" (AT-14). | `passSharedFallLead`, `placeVisibleTo`, `/api/shared-falls/[id]/lead` | `store.test.ts` (switch lead; a follower sent the open place but not the private one's id, nor a device-only one); two-browser simulation (leader into her private note: follower stayed, was told) | Real two-account live check not done (needs two signed-in people); peel off and rejoin not built. No Slate content is disclosure-gated today, so the sealed-thing case is covered only by the client clamp and a synthetic path. |
| COOP-02 | specified | | | | Creator co-op rights not built (D-09). |
| FOUNDER-01 | preserved, dormant (John, 28 Sep) | 47 unverified, 427 verified, 474 in all, as `FOUNDER_ALLOCATION`. Read by nothing that decides anything. | `lib/entitlements.ts` | `entitlements.test.ts` | Verification and what founders receive are OPEN (D-10). Nothing is granted from these numbers. |

## Decided 28 Sep (latest): a Drop falls through a living web

This is the central requirement. It replaces "falling through a space with sideways choices" and refines "a marble run":

**A Drop falls through a living web of relationships. Gaps let it continue falling; strands catch and redirect it; Drift lets the visitor influence which tensions they follow.**

### The Drop is the moving body

The visitor experiences the Slate through the Drop. The Drop can fall, rise, spiral, coast, get caught, accelerate, or be redirected by the structure around it. It is never an action button. (The hollow drop at the middle while steering, built already, is this body.)

### The Fall is already happening; you interfere with it

Not swipe, next post, swipe, next post. The Drop is already moving, work passes through your view, currents and strands pull it toward different routes:

- **Let go:** the Drop keeps flowing.
- **Touch or hold:** it slows and settles around what it is near (this is how you come to rest to read, watch or listen: part of the physics, never "physics stops, a page appears").
- **Drift (the thumb):** influence over which current or strand you catch, not positional control. Momentum can carry you past something; you may circle before being released. That small loss of perfect control is part of the feeling.
- **Release:** movement resumes naturally.

The useful part of the loot-box reel is continuous automatic motion and catching or releasing; never its look, and never a reel that already knows where it will stop.

### Three states of motion, and what Dew and Drop do to them

| State | What happens |
| --- | --- |
| Free fall | The Drop moves through gaps in the web, missing strands. |
| Caught | It hits a strand and travels with the web's tension, toward junctions, denser clusters, or a centre that the surrounding work keeps pulling toward (a core idea, project, person, or invention; not a literal spider). |
| Dewing | You decide to carry something forward: the Drop gathers there, adheres, and leaves something behind; that thing gains persistence in the structure. |

- **Dew** (carry this forward) makes the web accumulate.
- **Drop** (do not carry this forward) lets go of the strand: the Drop falls through a gap or peels off the thread and gravity takes over again. It does not mean "go to the unrelated section": you might land on something deeply related two levels down, something unexpected, or miss several strands. You do not know in advance.
- Dew and Drop are still said, never inferred; they now have visible physical consequences instead of being thumbs up and down. Whether the persistence Dew leaves is seen only by you or shapes the web for others is **still OPEN (D-07)**, and stays on this device until decided. Ambient resonance dew (from staying) remains a separate thing (spec 9.2).
- Supersedes the earlier row "Dew / Drop: judgment words only": they remain judgments, and they are also what the liquid does. "Drop" still never means "go into this".

### Rabi and the web

What people tag, connect, keep, group and contribute becomes the strands, tensions, junctions and gaps that someone else later falls through. The collective structure is the routing. Rabi is not "recommended for you"; it shapes parts of the web.

### The test for every future idea

**Does this change the living structure the Drop moves through, or is it just another control pasted onto a feed?** If the second, it leads back to "TikTok with tunnels".

What exists today, honestly: the flight is one sequence in depth with hops between things, plus lenses, openings and steering on top. The web (structure from relationships) and a motion model with momentum through it are the missing core part (spec 6.1: space and connections).

### Open decisions, with the invariants already agreed

| ID | Question | Already agreed |
| --- | --- | --- |
| D-12 | How do relationships between things shape the geometry, currents, attraction, resistance and possible trajectories of the Fall? What parts of that structure may a person or Rabi intentionally shape? | Not a literal mapping of relationships to parts ("goes with" = ramp, group = bowl): the structure emerges from relationships (strands, tension, density, attraction). |
| D-13 | What counts as a Lean when choosing is a nudge? | Trajectory alone never implies a Lean. Being carried somewhere is never secretly an opinion. Lean stays deliberate and private. |
| D-14 | How the Drop comes to rest, and how long the Fall carries you without input. | Rest is part of the physics (touch or hold settles; release resumes), never a modal. |
| D-15 | Keyboard, screen reader, reduced motion. | They reach the same underlying structure, never a simplified second TwinThink. |
| D-16 | A shared Fall when two Drops take different trajectories. | Two Drops together need not share a trajectory every second; Fall with me must never become one person remotely controlling the other. |
| D-07 | Where Dew's persistence lives (you, or the shared web). | Open; on this device until decided. |

## Proposed 28 Sep, not decided: the web remembers traffic

Recorded as direction, each with the rules it must not break. None of this is to be built before the Drop itself feels right.

- **Desire paths (personal).** Routes you keep returning to, Dewing around, moving through or connecting through grow from a thread toward a highway, for you. This may be what Zed was reaching for: depth you can see as carved structure, not a number. Fits the current rules if it lives on your device, like the rest of your Fall.
- **Shared infrastructure ("attention = infrastructure allocation").** Enough legitimate activity in an area gives Rabi more room to build there: more strands, resting points, depth, routes. It must remember *how* attention was used (returning, Dewing, building from, connecting, meaningful time), not *how much* (flying past builds little), or it rebuilds likes and the runaway attention loop. **Constraint:** this is collective use of people's navigation, the same category as aggregate Lean (SIGNAL-01, MEMORY-02). It needs the separate aggregate privacy protocol first: no personal trails on the server, no reconstruction from analytics.
- **Currents and raids.** Enough Dew around something forms a current of people flowing there; someone with pull can release the whole current into another part of the web, making a temporary highway that the web partly remembers afterward. Based on people who Dewed, returned, built or joined the current, not follower counts. **Open:** consent of the place receiving it, abuse (brigading, flooding someone who did not want it), who may redirect a current, and the same aggregate privacy protocol. Also D-07 (whether Dew is shared at all).
- **Reservoirs and overflow ("the current is the currency").** Dew adds mass to a place; places have capacity; past capacity the excess spills along connections into collaborators, influences, work built from it, or dry, underdeveloped parts of the web. Success has somewhere to go, and attention stops piling up at the top. Rabi manages the irrigation: capacities, which connections may carry excess, keeping any one area from swallowing the system, when a thin strand becomes a channel. Visible without numbers: dry is thin, healthy is beaded with Dew, saturated drips, overloaded sends streams outward. **Constraints:** it rests on shared Dew (D-07) and on the aggregate privacy protocol; routing attention toward places is the platform deciding where attention goes, so the rules must be explainable to anyone who asks and resistant to gaming (Dew from many throwaway accounts); "capacity" and "currency" must not quietly become the undecided capacity unit or pricing (D-08).
- **Current as a resource you allocate, not a score you hoard.** Followers are never the currency: they are people who chose to follow you, and stay that. What is spendable is the Current that sustained attention around your work produces. Current accumulates in reservoirs and can be deliberately allocated: to enlarge part of your Whoeuvre, start a new branch of yourself (say, from music to inventing) without starting from zero, give an invention enough infrastructure to stand, open a public space, back another person (your reservoir goes down, theirs fills: support has a cost), pool with others around something, or release a current into another web. Rabi is the engineer who turns an allocation into what it can physically support (a strand, a reservoir, an interchange, a route). Spent well, Current comes back, as with capital; spent badly, it is gone. The loop: attention, Current, accumulation, allocation, infrastructure, new activity, new Current. Current is a sink, so influence does not only inflate.
- **Everyone can matter; nobody matters forever.** Equality of access to becoming important, not equal outcomes. Principles proposed with it: Current can be spent, so power does not only pile up; it dries up where nobody meaningfully returns (twenty thousand involved people can outweigh two million dead followers, and it shows as moving water versus old dry infrastructure, never as numbers); overflow pushes outward; new and small places get enough baseline exposure to catch real Dew; Rabi keeps highways from crushing nearby paths; the bigger the reservoir, the more Current it takes to keep full, so scale is a responsibility, not a permanent advantage; **money never directly buys the Current that human attention creates.**
- **Constraints on these two:** this is the capacity and economic question John deliberately left open (CAP-01, D-08): what one unit is, allowances, and anything touching payments. "Money never buys Current" should be decided explicitly as part of D-08, not assumed. It also rests on shared Dew (D-07), the aggregate privacy protocol (no personal trails on the server to compute anyone's Current), resistance to gaming (throwaway accounts, rings trading Current), explainable rules for Rabi's allocation, and the founder allocation (D-10) not quietly becoming a Current grant.
- **The engine, in few words.** A handful of rules whose behaviour emerges: Fall. Drift. Catch. Dew. Drop. Repeat. If enjoying it needs many special terms and rules, the engine is too complicated. The novelty comes from the world you return to tomorrow being physically different because people lived in it today, not from vocabulary.
- **The landscape is the analytics.** No view counts, like counts, scores or ranks, ever (this is the existing "never a number" rule). A thing's history shows as terrain: a path found yesterday that is now a highway, a current that dried up, an ecosystem that grew around something because people kept building from it. Most social media measures attention; TwinThink turns attention into a place.
- **Wrap it in the Z (from John's dad, a systems engineer, 29 Sep).** A mind map spreads layers across a flat page; Shadow Slate turns the same layers from overview down to the finest detail into depth you travel through. Obsidian visualizes relationships; Shadow Slate spatializes them. His second point: people remember where they found something, so position should mean something ("the evidence was underneath that claim", "the old version was off to the left"). Treat "we remember better in 3D" as a hypothesis to test (can people find something again, and explain an idea, better after travelling it than after reading a flat graph?), not a settled claim. He is sending names of the tools he meant; compare with them once they arrive.
- **The spider in the tunnel (29 Sep).** Rabi builds the web the way a spider does inside a tunnel: it climbs the walls drawing out a thread, fixes it where it stops, and tightens it when it needs to. So the strands are anchored to the structure and have tension, and Dew is where the web holds something. For the visitor: a tether back to where they have been, which reaches further the more they explore (an Ariadne's thread: always a way back). **Guard:** the tether must never block you from going deeper ("you cannot go further until...") or it becomes a grind wall; it can stretch, thin and pull, and Dewing re-anchors it, but it does not stop you.
- **Synchronous multiplayer.** Several Drops in the same Fall at the same time: Fall with me grown up. Bound by D-16 (no remote control, no shared trajectory every second) and the follower privacy already built (`beyond`).

## Decided 28 Sep: the mobile direction (from John's mockup review)

The central mobile requirement: **you are not browsing down a hallway; you are falling through a space with lateral choices.** Not "straight tunnel, keep scrolling, more tunnel", but: fall, drift, openings peel away around you, another branch catches your trajectory, the whole space bends and spirals around the clock. One thumb, one joystick, one falling field, several visibly diverging directions; the words and controls sit quietly around that.

| Part | Decided |
| --- | --- |
| Steering on a phone | **Thumb controls movement; the phone stays still.** A thumb joystick is the primary mobile steering: direction and strength. Tilt is not a steering method: it made the screen itself harder to look at. (Tilt was live from bdd255e and is removed: a rejected control path taken out, not new work. The one exception made to the freeze, so the thumb check judges the right thing.) |
| Drift | Influence on the Drop's motion (which current or strand it catches), through the thumb's direction and strength. Not positional control. |
| Dew / Drop | Superseded by the web section above: still judgments, now also what the liquid does (Dew adheres and accumulates; Drop lets go and falls). "Drop" never means "go into this". |
| Openings | Real pieces of the person's work, visible ahead and around, never generic portals or illustrations. |
| By Time / By Topic | Two lenses over the same Slate (by topic = the groups already made). |
| Your Fall | Private recap, with no dashboard statistics (no depth, path or topic counts). |
| Beyond | Only the follower's message. No portal, mark or "?" showing where something inaccessible is. |
| Clock positions | Keep their meaning (the hour a thing was made) unless the clock is deliberately redesigned later (D-04). The mockup's "12 further ahead, 6 deeper within, 9 different time, 3 new connections" is not adopted. |
| Look | Ink, paper, monochrome. Icons in place of walls of explanatory text. |

When the freeze lifts, the order is: what the Drop physically is and what the web can do to it (above) first, then composition, then controls and words. Not JSX, typography, icons or animation first. The thumb is its input, not a separate feature.

## Layout fixed during the freeze (29 Sep)

- Panels (Your Fall, Rabi's notice, support, the Fall with me invite) sat over the row of actions and ran their buttons together ("look at itgo therereplay"). Found while taking screenshots for the explainer page; fixed as a layout defect (the kind check 2 exists for): each panel now sits on its own paper above the actions, with room between its buttons, on desktop and phone.

## Next, in order

Hold (28 Sep): no code changes until John brings back one of these results. Judge by feel, not numbers.

1. Steering by thumb (touch drag today; the joystick later), sitting up and lying down. If you catch yourself aiming by degrees, it is wrong. (Tilt is no longer the thing being judged: it is decided against.)
2. The Slate on real screens: the enlarged 6, notices at the top, long group names, crowded places.
3. Fall with me into somewhere private, with two real accounts: the follower stays where they are and learns only that "X moved into a path you can't enter", never what or why. (`beyond` means exactly that and nothing more.)

After those: the Drop and the web (above), starting from decisions D-12 to D-16 and D-07; the recap's song (RECAP-03); creator co-op (COOP-02) once D-09 is decided. The iPhone motion permission question goes away with tilt.
