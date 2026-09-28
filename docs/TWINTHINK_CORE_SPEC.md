# TwinThink: core specification and implementation handoff

> Canonical copy in the repository, supplied by John on 28 September 2026 (version 1.1 replaces 1.0). Implementation status lives in `docs/CORE_LEDGER.md`, not here; this document is the intent.

Version 1.1 | 28 September 2026 | Prepared for John and the implementing agent

Revision 1.1 incorporates the later monochrome/multidimensional direction, restores the theme-song Fall recap requirement, and records the implementation report for `9efe44c` against the newly read core ledger. The original audit remains a dated baseline, not a current claim that subsequently reported features are absent. Section 20 contains the latest reconciliation.

**Purpose:** reconcile the product John described with the smaller features implemented or reported so far, and define a shared foundation that can deliver the complete experience without removing existing functionality.

**Document status:** this is a requirements reconciliation and proposed engineering specification. It is not a report that the proposed core has been implemented, tested, committed, or deployed. It has not been committed to the TwinThink repository by this handoff. Some implementation choices remain deliberately open. Read the status and source labels before treating a statement as settled.

## 1. Read this first

John has described a spatial medium for ideas, creative work, and their history. People enter the Slate and experience it through movement: approach, fall, turn, choose, enter, return, remember, and sometimes travel together. Creation and exploration happen in the same underlying world. A person's Whoeuvre accumulates what they make. Rabi helps shape the routes and usable space around that work.

The navigation vision is a steerable, multidimensional vortex with a unified, mostly monochrome aesthetic. A centered pointer occupies the position of the police box in John's Doctor Who reference. The surrounding space moves around the visitor. In the time lens, a clock arrangement provides orientation: twelve at the top, three at the right, six at the bottom, nine at the left. Facing six allows the visitor to enter a stream of work associated with six o'clock and continue inward through it. Branches must be encountered as visible, navigable openings in that space. The earlier drawing's four colors identified positions; the later minimal/no-color direction supersedes mandatory color coding. A proposed topic lens reorganizes the same permitted work while preserving its identity and the visitor's orientation.

The clock position, depth, content structure, and chosen route must work together. A sequential feed arranged decoratively around a clock does not, by itself, meet that requirement. A blurred sidebar that jumps to a sibling is useful prior work, but it does not, by itself, deliver the intended branching flight.

John's instruction to build a common core means: preserve capabilities while consolidating their shared foundations. It does not authorize deleting features, discarding history, replacing everything with a generic engine, or declaring requirements unnecessary because the current data model cannot express them.

### 1.1 The communication failure this document fixes

Four kinds of statements have repeatedly been collapsed into one:

1. John described an intended experience.
2. An assistant proposed a smaller first implementation.
3. Some part of that implementation was built and tested.
4. The whole intended experience was described as complete under the same feature name.

For example, clock positioning is a component of temporal navigation, and local last-choice memory is a component of Lean. Neither establishes that a visitor can steer into an hour-specific tunnel, choose a visible opening, return to it, and recognize their journey.

**An absent implementation is not proof of an absent request. A passing build is not proof of experiential completion. A deferred requirement remains a requirement until John changes it.**

ChatGPT and Claude do not automatically share conversations. Git stores only what is actually committed. A local change, a chat explanation, a draft PR, a merged commit, and a production deployment are separate states. This handoff must be explicitly supplied to the implementing agent; repository documentation must then carry the decisions forward.

## 2. Evidence and authority

### 2.1 Labels used in this specification

| Label | Meaning |
| --- | --- |
| USER | Explicit requirement or correction in the available conversation. |
| HISTORY | Requirement or proposal recovered from other available conversation history; reconcile against later corrections. |
| CODE | Behavior supported by source inspected during the audit. It does not prove the current production experience. |
| DOC | Behavior or status stated in the checked repository documentation; not independently retested here. |
| REPORT | A pasted implementation or deployment report. Evidence of what was reported, not a fresh verification. |
| PROPOSED | Engineering or interaction design supplied by this handoff to make the requirements implementable. |
| OPEN | A product decision not settled by the available evidence. Do not silently convert it into a requirement. |

Current explicit instructions take precedence over older proposals. Existing code is authoritative about what the code does, not about what the product is supposed to become. Existing documentation may require correction when it contradicts a later user requirement. Record the conflict and its resolution instead of erasing the older context.

### 2.2 Sources and limits of this audit

| Source | What it establishes | Limit |
| --- | --- | --- |
| Current conversation, especially the vortex, clock drawing, centered-pointer reference, and core request | USER intent and corrections | Does not establish implementation. |
| Retrieved September 27-28 conversation history | Additional requirements and proposals concerning journeys, reactions, co-op, and founder allocation | Summarized history can contain assistant proposals; exact semantics need reconciliation. |
| [docs/CANVAS.md on main](https://github.com/Foxlendor/twinthink/blob/main/docs/CANVAS.md) | DOC record of current features and explicit deferrals | Mutable branch; record was read before Claude's latest core work was verified. Audited file blob SHA: `4a8dccfb1b7f36f464afea7656944b51ebeeae20`. |
| [flight.ts on main](https://github.com/Foxlendor/twinthink/blob/main/apps/web/src/lib/shadowfield/flight.ts) | CODE: one sequential stream, time-derived angular placement, passive camera lean, fixed UTC-6 clock offset | Does not represent unknown local/uncommitted changes. |
| [Draft PR #5](https://github.com/Foxlendor/twinthink/pull/5) | CODE/metadata: notice overlap and join-confirmation changes proposed by ChatGPT | Checked open, draft, unmerged; not claimed live. |
| Reports for `c501040`, `64db4df`, and `cfe841c` | REPORT: shared Fall, deployment repair, Lean edge previews | No fresh full production QA in this specification. |
| Latest pasted core/teardrop work | REPORT: Claude has begun further changes | Current branch, diff, tests, and deployment were not inspected. |

The four colored clock anchors come from John's earlier drawing and description; their colors are historical reference, superseded by the later monochrome direction. The Doctor Who link is [the supplied movement reference](https://www.youtube.com/watch?v=DNEjx6XUbfQ). Video playback was not verified by ChatGPT; do not attribute precise camera choreography to an unseen video. The earlier [book transition reference](https://youtu.be/-1DvXSsWKLI?t=88) supplies John's description of peripheral blur, visual curiosity, and focus transfer. The latest implementation record is separately identified in section 20; the source rows above describe the original audit.

### 2.3 Work ChatGPT actually contributed

ChatGPT created a separate branch and draft PR #5 with two commits. That work hides the ambient top notice while a transient notice occupies the same place, and adds explicit join-success notices. At the audit the PR head was `10664fcfcc1772a3584e22ebeec15eab7f1a38a7`; it was not merged. The user subsequently reported that the friend successfully joined, but that does not establish that the draft patch caused the success.

The vortex explanations and this specification are not shipped code. No automatic transfer of those conversations to Claude has occurred. Do not merge an old draft blindly into newer work; compare the current implementation and preserve any fixes already made.

## 3. Product vocabulary and boundaries

| Word | Meaning in this handoff | Boundary |
| --- | --- | --- |
| TwinThink | The platform and world for ideas and creative work | It is not being recast as a game merely because its navigation is immersive. |
| Slate | The place the visitor enters | Preferred public term over Canvas. |
| Slide | John's term for the movement experience | Retain his vocabulary without inventing a new brand for the renderer. |
| Whoeuvre | A person's accumulated body of work | More than an identity/profile screen. |
| Twin / work | An idea, project, or creative object and its related material | Map to existing model names carefully; no gratuitous database rename. |
| ShadowField | Existing internal component/renderer name | Not a user-selected public product name. |
| Fall | A traversal through the space | Not automatically an account-linked server history. |
| Lean | An intentional route choice | Passive camera drift, incidental pointer motion, and ordinary sequential passing do not count. |
| Branch or opening | A choice in navigable space | General navigation concept, not automatically a `tt_forks` record. |
| Maker space / existing fork | A creator-managed, bounded place for contributions | Existing `tt_forks` behavior includes invitation/posting rules, closing, moving, and history. |
| Breadcrumb | A trace supporting return and recognition | Different personal and aggregate uses require different data treatment. |
| Resonance dew | Ambient trace associated with returning attention | Distinct from the requested Dew reaction. |
| Dew / Drop reactions | Carry this forward / I would not carry this forward | Requested idea judgments, recorded as unbuilt in the inspected documentation. |
| Pressure | Aggregate navigation behavior at a limiting route or end | Not a vote on the quality of an idea. |
| Rabi | Creative architect of routes and usable space | Not the abuse-protection system. |
| Presence glint | Someone is here in this shared Fall | Not resonance, a public popularity score, or a permanent tracking identity. |
| Zed | Depth/persistence in the broader product concept | Do not collapse semantic nesting, date, camera distance, and social persistence into one numeric field. |

John has objected to excessive invented terminology. These distinctions are for implementation clarity. They do not require a screen full of labels, tutorial vocabulary, or a public rename of every action.

## 4. Requirements and implementation reconciliation

This matrix preserves the original audit baseline. Several rows have subsequent implementation claims, reconciled in section 20. Read both before deciding what remains to build. The implementing agent must add its current branch/commit and new evidence before marking any row complete.

| ID | Intended requirement | Baseline and gap |
| --- | --- | --- |
| CORE-01 | Preserve existing features while building reusable foundations | USER. Proposed refactor is in progress per REPORT; no verified completion. |
| SPACE-01 | Overhead and inside views describe the same connected space | USER/HISTORY. Existing map and flight are documented; equivalence to new route topology needs implementation and proof. |
| TIME-01 | Clock orientation determines temporal placement | CODE supports hour-based angles; current code uses a fixed UTC-6 offset. |
| TIME-02 | Turn toward an hour and keep traveling through its content | USER. Not established by existing sequential `buildStream`. |
| MOVE-01 | Centered pointer, steerable vortex, surrounding world moves coherently | USER. No verified complete implementation in the audit. |
| MOVE-02 | General branches present deliberate alternatives | DOC Lean and edge previews are partial implementations; navigable openings remain a separate goal. |
| MEMORY-01 | Return, recognize chosen and missed paths, understand the journey | DOC passed-gate memory and last-choice-per-parent cover only part of this. |
| MEMORY-02 | Time-to-choice and hesitation can inform experience | USER intent. Collection, retention, and use require an explicit local/aggregate design; not license for account-linked tracking. |
| SIGNAL-01 | Aggregate patterns without exposing individual trails | USER. DOC explicitly defers aggregate Lean signals. |
| SIGNAL-02 | Preserve ambient dew from returning attention | DOC existing resonance; never present it as completed Dew/Drop reactions. |
| REACT-01 | Distinct Dew and Drop judgments | HISTORY/USER discussion. DOC explicitly unbuilt. |
| MAKE-01 | Open, name, invite, post, move, close, reopen, retain history | DOC describes end-to-end manual maker spaces; regression required during migration. |
| RABI-01 | Build and optimize routes from ideas, material, and actual navigation needs | USER. DOC current implementation notices pressure and opens the manual composer. Full proposals are deferred. |
| CAP-01 | Space/capacity is a meaningful service that can expand | USER. DOC bounded fork room exists; physical/economic unit and expansion offering are not fully specified. |
| COOP-01 | Explore together | DOC/REPORT leader-follow V1 exists; user reported a successful join. |
| COOP-02 | Collaborate on creation with distinct rights and attribution | USER. DOC explicitly future work. |
| SAFETY-01 | Independent authorization, quota, and abuse controls | USER. Prior security fixes reported; complete future abuse layer is not established. |
| HISTORY-01 | Save this Fall / recover paths passed | HISTORY proposal/acceptance; precise conflict with latest memory model needs reconciliation, not disappearance. |
| FOUNDER-01 | First 47 unverified, next 427 verified, total 474 | HISTORY recovered allocation; prior audit found it unbuilt. Verification meaning, rewards, and current priority remain unresolved. |

## 5. The target experience, from the visitor's eyes

### 5.1 Enter and orient

The visitor sees depth and a recognizable direction of travel. Distant work starts as a presence, gains identity as it approaches, and becomes readable when the visitor is near enough. The visual environment retains TwinThink's paper, ink, dotted strands, restrained text, and real creative material. A time-vortex reference does not authorize replacing that identity with a generic neon space game.

The center acts as the visitor's aiming reference. On desktop, movement steers the view while that reference remains centered in the immersive mode. On a phone, an equivalent touch interaction must work without hover or a physical mouse. Exact controls are proposed later in this document, not retroactively attributed to John.

### 5.2 Turn into six

The six-o'clock region is visibly associated with six through position, text, and emphasis in the shared ink aesthetic. The visitor turns toward it, the route moves into alignment, and entering it selects a six-o'clock stream. Work encountered inside must actually match the chosen temporal policy. A six label placed over a mixed sequential feed fails this requirement.

The next six could mean six on another day or more work within a selected day's six-o'clock period. John has not resolved that distinction in the available conversation. The core must keep date, time of day, and semantic nesting separate so this decision does not require another foundational rewrite.

### 5.3 Encounter an opening

As the visitor falls, a route alternative becomes visibly available ahead or at a meaningful side angle. It must be noticeable before it is passed. A tiny opening hidden in peripheral clutter is insufficient.

At first the alternative can be soft and image-led. Approaching or aiming makes it easier to inspect. The same visual object should remain recognizable as focus transfers to it. Reveal does not select the route. The visitor must be able to inspect an alternative and continue without a Lean being recorded.

### 5.4 Choose, enter, return

Deliberate entry commits the route choice. The camera travels continuously into the selected opening. A return reaches the same branch context, even if the world now contains additional work. The selected path can be recognized; the unchosen route remains available if permissions and space state still allow it.

A later choice does not need to erase all evidence of the first exploration. Keeping both explored history and most recent choice is a PROPOSED enhancement to satisfy the broader journey goal; current last-choice storage must be migrated carefully rather than relabeled as full history.

### 5.5 Share the experience

A friend joins a shared Fall and receives an explicit success state. The leader learns that the friend joined. The follower's view moves through their own authorized space. If the leader enters inaccessible work, the follower stays at an allowed location with a clear explanation. Participation never grants new content rights.

### 5.6 Build in the same place

A creator can open a space, define who may contribute, and add work without losing orientation. With later co-op rights, another authorized creator can contribute with attribution. Rabi may propose a route change, explain it, and preview it; publication uses the same authorized creation operations as the manual builder.

## 6. The shared core

### 6.1 How to interpret "omit needless everything"

Consolidate repeated rules and duplicated sources of truth. Do not omit distinct meanings. A smaller component count is useful only if the resulting system can express the user's experience and preserve existing behavior.

Claude's proposed Thing / Lens / Move / Keeper / Mark scheme is a useful starting abstraction. It is insufficient unless it explicitly represents spatial connections and capacity. A log of an `enter` action does not create an entrance. A rule mapping every feature to one configuration row may help simple effects, but cannot be a universal promise for permissions, collaboration, payments, or new navigation topology.

The following responsibilities are PROPOSED engineering boundaries. They need not become six services, six databases, or six user-facing terms.

| Responsibility | Owns | Must not silently own |
| --- | --- | --- |
| Content and provenance | Stable work identity, author, revision, media, timestamps, relationships | Camera position or inferred popularity. |
| Space and connections | Containers, entrances, route links, nesting, route versions, bounded capacity | A separate duplicate of the authored content. |
| Viewer access and context | Authorized content, selected hour/date, perspective, shared mode | Permission grants inferred from following someone. |
| Movement and actions | Steering, travel progress, inspect, commit, enter, return, follow | Unrestricted persistence of every movement. |
| Memory and signal policies | Local trail, permitted aggregates, session presence, retention | Treating all events as one remotely stored analytics log. |
| Presentation | Camera, visibility phases, blur/reveal, marks, controls, reduced motion | Business authorization or reaction semantics derived from pixels. |

### 6.2 Proposed entity contracts

Adapt existing entities; do not create duplicate tables merely to match this vocabulary.

| Entity | Minimum conceptual fields | Key invariant |
| --- | --- | --- |
| Work | Stable id, maker reference, created time, updated time where applicable, revision/provenance, disclosure, content/media references | Route moves do not change authorship or fabricate a new creation date. |
| Space | Stable id, owning work/container, manager, posting policy, lifecycle, capacity allocation | Closed space and its history remain resolvable. |
| Route connection | Stable id, source, destination, route type, applicable temporal context, geometry reference/version | Appearance and actual destination agree. |
| View context | Viewer grants, time policy, selected scope, current topology version | Hidden work cannot leak through previews or route metadata. |
| Travel state | Route/segment, progress, orientation, focus, mode, return context | A layout change does not erase logical location. |
| Local choice record | Branch context, chosen route, local time/order, most recent choice, optional explored history | No implicit server synchronization. |
| Shared Fall | Session, leader, current logical location, participants, lifecycle | Current presence is distinct from a historical trail. |
| Capacity record | Owner, resource unit, allocated amount, used/reserved amount, change history | Concurrent operations cannot spend the same room twice. |

A work may be reachable through more than one route. Its identity, permissions, and provenance remain the same. Prevent unintended containment cycles while allowing deliberately designed navigation loops. A visual torus need not duplicate content or imply infinite allocated storage.

### 6.3 Event vocabulary and ownership

An event name must describe something observable. Avoid creating false intention by renaming camera motion.

| Event | Trigger | Default destination | Meaning |
| --- | --- | --- | --- |
| Approach / focus | Local camera reaches a visibility region | Transient local state | Presence in view, not endorsement. |
| Inspect alternative | Visitor deliberately aims or opens a preview | Local state | Interest, not route commitment. |
| Choose route | Accepted deliberate commitment input | Local memory | Lean. |
| Enter route | Travel crosses the route entrance | Local memory | Actual entry; may complete a choice. |
| Pass opening | Eligible opening was encountered but not entered | Local memory if enabled | Missed opportunity, not Drop. |
| Return | Travel revisits a known branch/context | Local memory | Journey continuity. |
| Reach end / leave | Defined end behavior under a stated rule | Local event; separately reduced aggregate if permitted | Candidate pressure, not dissatisfaction inferred as fact. |
| Revisit on another day | Existing resonance qualification | Existing limited resonance service | Returning attention. |
| React Dew / Drop | Explicit reaction action | OPEN policy | Judgment about carrying an idea forward. |
| Publish leader location | Leader moves in an active shared Fall | Current session state | Synchronization, not a permanent trail. |
| Create / move / close space | Authorized maker action | Authoritative store/history | Actual topology change. |

Every persistent event or derived signal must have a declared purpose, destination, retention rule, and deletion/reset behavior. Choosing an event architecture does not authorize uploading a universal raw event stream. Camera frames remain transient; record semantic transitions rather than every animation tick unless a separately approved local experiment requires otherwise.

### 6.4 Proposed module shape

Use existing project conventions where they already provide these boundaries. Candidate modules are `space`, `timePolicy`, `travel`, `events`, `memoryPolicy`, and `signals`, with renderer adapters around them. This is a proposed organization, not a mandatory rename plan.

`ShadowField.tsx` should compose UI state and integrations; it should not become the sole owner of route semantics, authorization, pressure policy, storage migration, and animation geometry. Extract one responsibility at a time. Keep functions that determine reachable routes and intentional choices testable without rendering a frame.

## 7. Temporal and spatial specification

### 7.1 Fixed orientation requirements

| Clock position | Current visual rule | Screen reference when unrotated |
| --- | --- | --- |
| 12 | Same ink palette; position and label | Top |
| 3 | Same ink palette; position and label | Right |
| 6 | Same ink palette; position and label | Bottom |
| 9 | Same ink palette; position and label | Left |

These are clock positions. Twelve is not automatically late and six is not automatically early. The original green/blue/orange/purple mapping is no longer a required product palette. Use one coherent ink language with contrast, line treatment, shape, and accessible labels. Any retained minimal accent must remain optional to understanding or operating the space. See section 20.1 for the proposed lens transition and visual encoding rules.

### 7.2 Independent dimensions

Preserve separate values for absolute creation time, displayed time of day, calendar date/cycle, semantic parent/depth, physical travel progress, and accumulated revisit/attention signals. They may influence a view together, but they are not interchangeable.

The current code's UTC-6 offset documents the existing implementation. It does not settle whether future work should use the maker's timezone, the viewer's timezone, or one shared clock. Store actual instants; a display policy can map them to a clock. A fixed offset is not equivalent to a timezone with daylight-saving rules.

### 7.3 Required unresolved decisions

| Decision | Alternatives already relevant | Safe implementation treatment before resolution |
| --- | --- | --- |
| What depth means inside six | Successive days at six; more posts within one day's hour; a combination with distinct controls | Parameterize time scope; label the prototype's chosen policy. Do not claim John selected it. |
| AM/PM | Separate cycles; explicit day/night selection; 24-hour data projected onto a 12-hour face | Keep full timestamps; never silently merge noon and midnight. |
| Whose clock | Creator, viewer, or shared reference | Keep policy explicit and consistent across map, flight, and labels. |
| Width of a temporal stream | One hour, narrower window, smoothly varying neighborhood | Implement as a policy; exact bucket width remains OPEN. |
| Chronological direction | Newest-to-oldest as current code; another deliberate mode | Preserve existing direction until deliberately changed; indicate it consistently. |
| Spatial toruses | Four structural loops, four orientation regions, or a recursively repeated geometry | Use John's sketch as the visual target; do not infer a complete mathematical topology from it. |

The core can be built around these dimensions without resolving every visual detail first. Permanent data migrations and product claims must not bake in an unresolved interpretation.

### 7.4 Topology requirements

SPACE-02: connections have destinations and return context. An opening cannot merely be a decorative animation layered over unrelated navigation.

SPACE-03: general navigation branches and paid/managed creator spaces are distinct. A turn at a branch does not necessarily consume a new allocation. A creator opening a persistent contribution space may consume allocation. This relationship needs a documented accounting policy.

SPACE-04: moving a managed space preserves its identity, contents, ownership, and history. Resolve or redirect old references according to an explicit rule. Closing prevents new contribution but retains existing readable content under its existing permissions.

SPACE-05: changing temporal scope does not mutate content or its author relationships. Sparse or empty periods must have honest empty behavior; do not invent activity or duplicate work to fill a tunnel.

SPACE-06: recursive nesting must preserve orientation and an escape/return route. Apparent endlessness is a visual/navigation property, not a promise of infinite stored work or infinite browser memory.

## 8. Input, movement, and visual behavior

### 8.1 Input contract

USER requirement: centered aiming reference and steerable fall. PROPOSED desktop implementation: explicitly entered immersive mode may use pointer lock if supported, with an obvious exit and normal cursor restored for menus, text, and forms. A centered reticle is possible without pointer lock; do not assume the browser feature itself was requested.

PROPOSED touch implementation: a bounded steering gesture moves aim, a distinct accepted action or entrance crossing commits travel, and users can stop to read. Map gestures so scrolling, steering, opening a menu, and choosing a route do not accidentally trigger one another. Existing sideways drag behavior must be reconciled, not silently stolen by Lean.

Keyboard and nonvisual navigation must reach the same authorized destinations and create the same intentional-choice semantics. Hover may enhance a preview but cannot be required on phones. Browser focus loss, escape, or opening a modal must not continue uncontrolled steering or create choices in the background.

### 8.2 Movement states

PROPOSED internal states: orienting, traveling, inspecting, committing, entering, resting, returning, and following. These are engineering states; the UI does not need eight buttons or labels.

A commitment rule must be selected and documented. Possible rules include click/tap confirmation or a deliberate steering-and-crossing gesture with a clear threshold. Looking alone is not consent to travel. A test must distinguish ordinary pass-by, inspection, canceled approach, and committed entry.

The prior assistant proposed that crossing an entrance records the choice. That is a proposal awaiting integration with the actual input design, not a settled user command. Preserve explicit current tap-based Lean until its replacement is demonstrably intentional and accessible.

### 8.3 Reveal and continuity

VIS-01: an alternative is noticeable before commitment. Use silhouette, contrast, scale, and placement without obscuring its actual destination.

VIS-02: the preview, focused object, and entrance are visually continuous. Avoid substituting a different image mid-transition or teleporting to an unrelated composition.

VIS-03: image-led reveal may precede title resolution, but readable identification must be available before irreversible or paid action. Accessible descriptions must not disappear because decorative text is blurred.

VIS-04: no-image destinations need meaningful, distinguishable treatment. A generic faint gray rectangle is insufficient evidence that alternatives are legible.

VIS-05: preserve semantic visibility for the entire scene: parent content fades, child presence emerges, identity and meaning resolve, then detail and interaction become available. Merely fading labels does not satisfy scene-level visibility.

VIS-06: preserve the requested restrained foreground attention budget, approximately 3-7 salient items, with quieter context behind it. Prior discussion included increased spacing and roughly 35-40% entry; existing documentation records 0.42 entry/0.28 exit. Reconcile these as tuning/history, not simultaneous contradictory hard constants.

VIS-07: notices, compass, previews, captions, and shared-Fall controls require collision-aware placement across desktop and phone layouts. The top-notice overlap is a concrete regression to check. A single hardcoded offset is not proof across all viewport and text sizes.

VIS-08: preserve day/night choice, legible contrast, media behavior, and reduced-motion access. Vortex motion should not require continuous automatic roll. Existing documentation cites discomfort from turning during forward movement; controlled steering and optional reduced motion must be evaluated together.

### 8.4 Anticipation without deceptive selection

John compared the reveal to a loot-box feeling: glimpse, curiosity, movement, and resolution. The repository records deterministic destinations and visitor-triggered reveals. Preserve that behavior during the core refactor. Do not silently introduce randomized rewards, fake scarcity, timers, or paid rerolls.

The desired emotional result is curiosity with agency. A visitor must be able to see that alternatives exist, inspect them, choose intentionally, and leave or return. This is a design constraint and acceptance question, not a claim that an engagement metric proves satisfaction.

## 9. Breadcrumbs, reactions, and collective signals

### 9.1 Personal memory

Required intent: someone can recognize what they chose, what they passed, and how to return. The present `passed` and `leaned` records are useful adapters, not the entire future memory model.

PROPOSED memory shape distinguishes the last choice from the set of explored routes. It records stable branch/route ids, necessary temporal context, local sequence/time, and optionally locally derived dwell or time-to-choice. The amount and retention must be bounded and clear. Local reset must remove local history. Do not upload a trail merely to make it available to Rabi.

Returning must recheck access. Local history does not confer permission to see work that became private. A missing route can be represented as unavailable without exposing newly restricted content. If routes move, migration must avoid marking a different route as the old choice because an array index changed.

"Save this Fall" and "Paths you passed" appeared in recovered history. They must remain on the reconciliation list. Their exact interface and persistence are not locked by this document. Earlier proposals to clear a passed route on Drop conflict with the later distinction between idea judgment and navigation memory; do not implement that coupling without an explicit decision.

### 9.2 Five different meanings must stay different

| Signal | Question it can support | What it cannot establish |
| --- | --- | --- |
| Local breadcrumb | Where did I choose or pass? | What everyone else thought. |
| Resonance | Has attention returned over time under the stated rule? | Explicit approval or a unique-person census. |
| Pressure | Are qualifying journeys reaching a limiting point? | That the maker must open a route or that the idea is bad. |
| Dew/Drop reaction | What did this visitor explicitly choose to carry forward? | A complete navigation history. |
| Shared presence | Who has joined this active Fall? | Continuous follower location or lasting public identity. |

The current docs describe resonance as a limited one-way mark retained for a season and pressure as a shorter-lived aggregate. Retain those existing purposes while verifying actual implementation. Hashing alone must not be described as a guarantee of anonymity; combinations of sparse signals may still expose patterns.

### 9.3 Aggregate choices and Rabi learning

USER intent: people can feel that others traveled similarly without exposing anyone's private trail. Current aggregate Lean behavior is explicitly deferred in the checked documentation.

PROPOSED future implementation: compute a narrow eligible contribution locally or at the authorized request boundary, deduplicate/rate-limit it, accumulate only the required coarse signal, and reveal it only when a defensible privacy threshold is met. No individual trail replay, raw public counts, or account-linked hesitation record by default.

Threshold values, retention, clock granularity, and contribution identity are OPEN. Show the actual rule in internal documentation. Do not claim that high traffic by itself makes a signal private. Protect low-traffic spaces and prevent differencing across tiny time windows.

Time-to-realization is a design interest, not something directly observable. Record an action interval with a defined start/end if needed; do not label it as the person's internal realization. Rabi can use such evidence only under the declared policy. Separate voluntary research participation remains separate from ordinary use.

### 9.4 Dew/Drop implementation boundary

Preserve the requested meanings: Dew means carry this forward; Drop means I would not carry this forward. Neither can be inferred from a view, exit, failed connection, or unchosen route. Reaction storage, reversibility, audience, retention, and aggregate rendering remain OPEN. These reactions must not be smuggled into the navigation refactor through an existing field named `passed`.

## 10. Manual creation, scarcity, and Rabi

### 10.1 Manual creator operations

Preserve opening a named space inside owned work, defining contribution rights, inviting, posting, moving between permitted containers, closing/reopening, and retaining contents/history. Ordinary posting remains private by default. Joining an invite-only posting space is not a blanket publication action.

Creation, movement, closure, and posting must be authorized at the server. Renderer checks provide understandable UI but are not security. Concurrent capacity checks require an atomic operation or equivalent guard. Failed submissions cannot leave duplicate spaces, consumed room with no object, or lost invitation state.

### 10.2 Scarcity as a service

USER: usable tunnel space is scarce and can be expanded like a meaningful DLC-sized region. The scarcity should correspond to an explicit service or allocation, not an undocumented visual trick.

The currently documented `FORK_ROOM_MAX` is an allocation rule. It does not alone prove that physical storage is full, establish a price, or implement purchases. A system can support finite managed spaces while rendering apparently deep or looping routes. Document that distinction honestly.

OPEN economic decisions include what one unit buys, initial allowance, whether closed spaces consume allocation indefinitely, resource limits inside a space, and the relationship between posting, hosting cost, and new regions. The existing docs say closed spaces count because their contents persist; preserve that behavior until intentionally changed.

The earlier assistant preference to avoid an ordinary-posting wall is not a user-ratified pricing policy. John asked for meaningful scarcity. Do not erase that requirement, and do not invent a specific paywall rule on his behalf.

PROPOSED later expansion requirements: show capacity and price before purchase, reserve capacity safely during checkout, grant entitlements only after verified payment, handle retries idempotently, and define what happens to existing work if an entitlement changes. None of these commerce flows is claimed implemented here. Payment work is outside the initial core migration.

### 10.3 Rabi's full role

Rabi architects experience: where routes can exist, how they connect, where people encounter alternatives, and how scarce room can be used well. Suggestions may be informed by a creator's idea, existing posts/material, and appropriately limited navigation evidence.

Rabi must distinguish authored content from system-generated infrastructure. A generated route cannot acquire the authorship, credit, or status of someone's creative work. AI-assisted work must retain its disclosure/provenance. Permission to build roads is not permission to reveal private destinations.

PROPOSED proposal object: target space, intended connection, reason, source evidence class, capacity cost, access impact, affected content references, preview, and current version. Creator approval runs the same manual creation/change commands. Revalidate permission, version, and capacity at application time; reject or refresh a stale proposal rather than applying it to changed work.

The current DOC behavior is narrower: pressure yields a maker-only notice, with open a path, leave it, or watch. Preserve distinct choices and the measured funnel from notice to composer to actual created space. A click is not acceptance; a created space is not proof it was useful. Later route use is a separate outcome.

The docs' previous deferral of full Rabi proposals is historical implementation scope. It must not be presented as John withdrawing the full architect requirement. Build it in a later milestone on the shared core unless John reprioritizes.

## 11. Shared exploration and co-op creation

### 11.1 Preserve Fall with me V1

The audited record specifies `tt_shared_fall`, leader-only station publication, participant join/leave state, approximately 800 ms polling, follower-local camera movement, and session-scoped glint tokens. Existing V1 does not include a Pause button, lead switching, peel-off/rejoin, or creator editing rights.

Do not confuse an internal resting movement state with adding a new Pause button. Existing V1 scope remains a useful regression baseline, not a permanent ban on every future co-op improvement.

Join acceptance must be distinguishable from opening a link, starting authentication, or attempting a request. Host and guest receive confirmation only after actual success. Authentication failure, network failure, revoked invite, and ended session have recoverable, comprehensible states. Do not prematurely discard the only invitation data before the join outcome can be handled.

### 11.2 Adapting shared Fall to a routed vortex

PROPOSED: publish a current logical route context sufficient to identify the leader's place, such as route id, work id, time scope, and topology version where required. Reuse current-location overwrite semantics. Do not begin collecting follower trajectories to solve synchronization.

Station-only publication may become ambiguous when one work is reachable through multiple temporal routes. Resolve that in the schema/protocol deliberately; do not send arbitrary camera dumps or private graph fragments. The follower validates destinations against their own current grants and smooths their own camera.

Stale or out-of-order updates cannot drag a follower into an old branch after a newer update. An ended session must stop publishing/following. Reconnection behavior must be explicit. A privacy boundary is enforced in server responses and client navigation, including unavailable media and metadata.

### 11.3 Creator co-op

USER requirement: collaborators may have different rights to propose routes, contribute work, edit, manage invitations, and publish. Viewer participation is not a creator role.

PROPOSED role capabilities should be explicit and independently testable rather than one blanket collaborator flag. Keep contribution attribution and revision history. Conflicting edits require version checks or another deliberate conflict policy. Revocation takes effect on later writes, including stale open editors. Specific role names and UI are OPEN.

## 12. Privacy, access, and abuse protection

Private by default applies to new content and relevant local memory. A visible opening cannot leak a hidden title, image, media URL, graph structure, owner identifier, or restricted destination through its tooltip, accessibility tree, network response, or error message.

PROPOSED layered boundary: authorize the request; enforce resource/quota limits; process the allowed action; emit only the permitted signal. Background abuse analysis is separate from Rabi. A suspicious pattern can justify a bounded temporary restriction under explicit policy; lasting penalties are human decisions under the earlier agreed direction.

Do not build an expansive security product merely because future payments or AI spending exist in the roadmap. Test the actual operations added in each milestone: duplicate creation, invitation misuse, unauthorized posting, private media access, replayed aggregation, AI quota exhaustion when AI calls are introduced, and purchase replay when purchases are introduced.

Earlier code fixed a disclosure clamp with `target.slice(0, open)`. Prior reports did not exercise actual `disclosure > 0` content. Preserve that outstanding verification obligation. Controlled fixtures are appropriate for meaningful automated tests; later real two-account verification complements them. Neither a compile nor absence of gated live data proves the branch works.

## 13. Features that must survive the migration

This is a preservation inventory, not a fresh certification that every feature currently works. Establish a baseline in the actual checkout and add any discovered behaviors.

| Area | Preserve or explicitly reconcile |
| --- | --- |
| Content | Private local work, server-posted work, ownership, revisions/provenance, existing ids and links. |
| Sharing | Private, by-link, and public distinctions; unsharing; media authorization; report/moderation behavior. |
| Auth | Sign-in and invite continuation, owner checks, no token/auth regressions. |
| Media | Existing picture, film, audio, 3D-object, and download behavior; current sound preferences. |
| Creation | Compose, build-on attribution, opening/posting in spaces, moving/closing/reopening without history loss. |
| Views | Existing map/overview, flight, semantic visibility, keyboard/accessible navigation, day/night. |
| Personal memory | Kept work, local passed gates, last Lean, migration of existing storage keys. |
| Social signals | Resonance dew, pressure, maker-only Rabi notices and their distinct decisions. |
| Shared Fall | Create, invite, authenticate, join, lead/follow, leave/end, presence glint, access boundaries. |
| Other documented capabilities | Sketchbooks, stories, daily prompt, notes at seals, donations and existing support links. |
| Presentation | Notice placement, compass usability, preview placement, readable text, mobile hit targets. |

Do not discard legacy local storage to make a new model easier. Introduce a versioned migration with a way to recover from malformed or older records. Do not rename stable server ids to match new UI vocabulary.

(One paragraph of the handoff, about older, retired product work that is not public, is kept out of this public copy on purpose: anything committed here may become public. It said only that that work is background, not a reason to restore retired endpoints or bring private material into the Slate.)

## 14. Migration and implementation sequence

The following order is PROPOSED. It prioritizes a complete narrow experience while preserving the broader requirement inventory.

### Milestone A: establish the actual baseline

Read the current branch, uncommitted diff, relevant repository instructions, `docs/CANVAS.md`, navigation/rendering, local memory, store functions, routes, and tests. Record the commit and deployment separately. Reconcile any work Claude completed after this audit; do not reset or overwrite it.

Create a requirement ledger containing the IDs in this document, relevant code locations, current evidence, open decisions, and next milestone. Choose a canonical repository location for this spec, such as `docs/TWINTHINK_CORE_SPEC.md`, and link it from existing agent/project instructions. Add a pointer rather than replacing unrelated instructions. Review public suitability before committing material to a public repository.

Deliverable: a concrete mapping of current code to the requirements, including disagreements and currently uncommitted work. This is a short audit step, not an excuse to stop indefinitely at planning.

### Milestone B: extract foundations while preserving behavior

Extract shared content/route identity, viewer filtering, travel transitions, and memory/signal adapters. Keep the current renderer operational. Migrate one existing behavior at a time and verify its observable outcome. Preserve separate clocks/policies rather than reproducing every feature's timer in a new folder.

Deliverable: existing manual creation, Lean memory, resonance, and shared Fall can use explicit core contracts without losing behavior. A smaller `ShadowField.tsx` is a side effect, not the acceptance criterion.

### Milestone C: prove the temporal movement loop

Build one demonstrable scene with known, labeled timestamps, four clock anchors, centered steering, a selected six-o'clock stream, two real alternatives, deliberate entry, and return. Use controlled test/demo material in an appropriate preview environment; never fabricate public user history.

Choose and label a reversible prototype time policy while the permanent depth policy remains OPEN. Demonstrate that actual content selection changes with that policy. Keep the old view available during development until behavior is verified.

Deliverable: a desktop and phone demonstration of the complete orient -> fall -> inspect -> choose -> enter -> return loop, including no-image destinations and a hidden alternative.

### Milestone D: integrate creation, memory, and shared Fall

Connect the new routes to existing creator spaces, capacity, stable identity, accessible navigation, local history, and shared sessions. Verify actual two-person behavior and permission differences. Ensure changing routes does not change who may post or see content.

Deliverable: create -> invite -> post -> travel together -> branch -> return works on the same core.

### Milestone E: complete deferred experience layers

Add full journey recovery, aggregate Lean signals under an explicit privacy policy, Dew/Drop under their own semantics, Rabi route previews/approval, and creator co-op in separately reviewable increments. Keep every remaining requirement visible in the ledger.

Deliverable: each feature has an implemented scope, evidence, and an honest gap statement. Do not relabel a notice-only Rabi as the full architect.

### Milestone F: expansion and founder systems

Resolve the capacity unit and commercial offering before payments. Reconcile the 47/427/474 allocation with verification requirements and the current product. Do not treat these features as forgotten, already shipped, or prerequisites to fixing basic navigation.

Deliverable: independently specified, server-enforced entitlement and allocation behavior when prioritized. No invented launch dates or pricing.

## 15. Acceptance scenarios

Passing isolated helpers is necessary where appropriate but insufficient. Each scenario identifies a visible outcome and a failure that must be caught. Automated fixtures and browser/user checks have complementary roles.

| Test | Scenario and expected outcome | Reject completion if |
| --- | --- | --- |
| AT-01 | Face six and enter its temporal scope; every presented work belongs to the documented scope | The label changes but the mixed sequential feed remains. |
| AT-02 | Compare known times at 12, 3, 6, and 9; orientation, labels, and emphasis match the time policy in monochrome | Orientation is ambiguous without hue, or angles drift independently of the time policy. |
| AT-03 | Test AM/PM, dates, timezone policy, and any daylight-saving boundary relevant to the selected policy | Different instants silently collapse or reorder without explanation. |
| AT-04 | Move the mouse in immersive mode; the center reference stays stable and steering is controllable | The pointer drifts to the screen edge or menus trap input. |
| AT-05 | Repeat core navigation on touch and keyboard | A required choice depends on hover or mouse-only input. |
| AT-06 | Pass and inspect alternatives without committing | A passive pass, hover, or camera drift records a Lean. |
| AT-07 | Deliberately enter one of two openings; arrive at that destination | The animation implies one route while the content selects another. |
| AT-08 | Return and take the other route | Return context is lost, the alternative is incorrectly closed, or history points to a different id. |
| AT-09 | Inspect image and no-image alternatives at phone and desktop sizes | A route is functionally clickable but visually indistinguishable or hidden under controls. |
| AT-10 | Use a viewer lacking access to a branch and its media | Any protected title, image, URL, graph fragment, or accessible label leaks. |
| AT-11 | Reload after creating local memory and migrate a prior storage version | Existing records vanish, become public, or mark unrelated routes. |
| AT-12 | Join a shared Fall after authentication; verify both clients | Merely opening the invitation is displayed as successful participation. |
| AT-13 | Leader chooses another authorized branch; follower follows in their own view | Follower state is inconsistent, uncontrolled, or uploaded as a historical trail. |
| AT-14 | Leader enters inaccessible work, including a controlled disclosure-gated fixture | Follower crosses the boundary or receives protected metadata. |
| AT-15 | Guest leaves, leader leaves, session ends, network disconnects, then reconnects | Ghost presence persists incorrectly or stale updates restart an ended session. |
| AT-16 | Two concurrent requests attempt the last capacity allocation | Both spend the same remaining unit. |
| AT-17 | Move or close a maker space containing work | Contents/history disappear, access widens, or stable links corrupt. |
| AT-18 | Preview a Rabi proposal, then change permissions/capacity before approval | A stale proposal bypasses current rules or publishes without confirmation. |
| AT-19 | Exercise resonance, pressure, Lean, and reaction events separately | One silently triggers or impersonates another. |
| AT-20 | Trigger ambient and transient notices with shared-Fall UI and edge previews present | Text overlaps, hides controls, or claims an unconfirmed outcome. |
| AT-21 | Enable reduced motion, enlarge text, open a modal, and lose browser focus | Controls become unusable or motion/input continues unexpectedly. |
| AT-22 | Test sparse/empty time scopes and changed/deleted routes | Fake work appears or the visitor gets trapped with no return. |
| AT-23 | Run an authorized creator collaboration write after rights are revoked | Stale client permissions still permit modification. |
| AT-24 | Verify the deployed build, then perform an authenticated feature flow on it | Only local tests, a route status, or a redirect are offered as full live proof. |

AT-18 and AT-23 become required gates when their features are implemented, not tests that pretend those features already exist. Use meaningful assertions on outcomes and access boundaries. Avoid test counts as a substitute for coverage of these scenarios.

### 15.1 The central experiential check

John should be able to watch or perform this sequence without an explanatory workaround:

1. Recognize the clock orientation.
2. Aim toward six and move into it.
3. Continue through work belonging to the chosen six-o'clock scope.
4. Notice two meaningful alternatives before passing them.
5. Inspect one without being forced into it.
6. Deliberately enter it through a coherent transition.
7. Return and recognize the choice.
8. Explore the other route.
9. Invite a friend and repeat within each person's permissions.

If the implementation still requires, "Imagine that sidebar click is entering a tunnel," the full experience remains partial. John's judgment of the visual feeling complements technical tests; a screenshot or unit suite alone cannot settle it.

## 16. Definition of done and reporting rules

Every milestone report must include: requirement IDs, exact implemented behavior, remaining gaps, branch/commit, checks performed, checks not performed, and deployment status. Distinguish the following states:

| State | Required evidence |
| --- | --- |
| Specified | Recorded behavior, source, and open decisions. |
| Implemented locally | Actual diff and working local behavior. |
| Tested | Named relevant scenarios and outcomes, with environment. |
| Pushed | Exact remote branch and commit confirmed. |
| Deployed | Hosting deployment identifies the intended commit and succeeded. |
| Verified live | The intended user flow works on that deployed version. |
| Experience accepted | The integrated behavior meets the agreed user experience, including visual/movement review. |

The earlier Vercel failure occurred at the repository's no-dashes prebuild gate. Run the actual project build command including lifecycle scripts. A direct framework build that bypasses prebuild cannot substitute for it. Honor the repository's character restrictions in code, comments, and UI copy where the rule applies.

An unauthenticated 401 establishes routing/auth rejection for that request; it does not establish successful authenticated co-op. A 307 catch-all does not prove a removed handler is safe everywhere. A route manifest can establish handler inclusion/removal in a build. Confirm the actual deployment before using a live response as evidence of a specific commit.

If the browser cannot load production through the testing environment, report the limitation precisely. Serving fetched production assets through a workaround can test those assets under altered loading conditions, but does not fully verify normal live networking, auth cookies, or synchronization.

Use compact honest progress reports rather than repeated "still waiting" messages. A failed deploy should prompt inspection of build status/logs, not indefinite polling of a catch-all route.

## 17. Open decisions register

These questions must remain visible. Resolve only those that block the current milestone; proceed with reversible clearly labeled defaults for the rest.

| ID | Decision | Status / owner |
| --- | --- | --- |
| D-01 | Meaning of depth inside one hour | OPEN, John; architecture should support separate day and hour dimensions now. |
| D-02 | Creator/viewer/shared timezone and AM/PM treatment | OPEN, product policy; do not migrate away full timestamps. |
| D-03 | Exact desktop/touch commitment gesture | PROPOSED alternatives; evaluate with John against accidental choice and ease of steering. |
| D-04 | Literal four-torus topology versus four clock anchors in a connected recursive space | OPEN visual/structural interpretation; preserve the drawing as reference. |
| D-05 | Last choice, explored history, and saved Fall retention | OPEN details; local-first requirement remains. |
| D-06 | Aggregate Lean privacy unit, threshold, retention, and opt-in where needed | OPEN before server collection. |
| D-07 | Dew/Drop persistence, reversibility, audience, and relation to saving work | OPEN; do not couple to navigation exits. |
| D-08 | Capacity unit, room allowance, closed-space accounting, and price | OPEN beyond existing behavior; no implied payment implementation. |
| D-09 | Creator co-op role capabilities and conflict resolution | OPEN details of requested feature. |
| D-10 | Founder allocation verification meaning and relationship to access/space | HISTORY requirement retained; implementation not established. |
| D-11 | Public action labels for paths/turns and optional journey UI | OPEN wording; avoid proliferating jargon. |

## 18. Instructions for the implementing agent

Read this document in full before continuing the core refactor. Treat USER requirements as product intent, inspect CODE/DOC claims against your current checkout, and keep PROPOSED/OPEN items visibly labeled. Do not infer that a missing implementation means John did not ask for it.

Reconcile your uncommitted work with the audited baseline. Preserve it where it helps, and explain concrete conflicts. Do not overwrite another agent's work, reintroduce retired public endpoints, or copy private user material into fixtures.

Write a concise implementation ledger in the repository with requirement IDs, current code locations, status, and evidence. Link the canonical spec from the agent-facing instructions you actually read. A chat message alone is not a durable handoff. Do not assume the other assistant has seen a commit or a conversation unless it was explicitly supplied.

Proceed through the foundation and one complete temporal-navigation loop. Preserve existing features using adapters and incremental migration. Do not replace the requested experience with another feature that is cheaper to implement and reuse the same name for it. If scope must be reduced for a milestone, state the reduction and keep the full requirement pending.

Keep user intent separate from engineering choices. In particular, do not decide what "the next six" means without labeling that decision; do not collect raw trails on the server as a shortcut; do not conflate a creator space with every navigation branch; do not call a Rabi notice the full architect.

At each milestone report what works, what remains incomplete, and how it was demonstrated. Complete authorized reversible work without repeatedly asking permission for routine implementation choices. Ask a focused question only when an unresolved product choice materially changes the result and cannot safely remain configurable.

The first integrated target is: orient by the clock, face six, fall through its actual content, see alternatives, intentionally enter one, return with memory, and share that route within permissions. Build and demonstrate that connected behavior before describing the core as complete.

## 19. Maintaining this specification

This document is a reconciled starting point, not a claim to contain every private conversation or future idea. When new evidence arrives, update the relevant requirement row and decision rather than rewriting history. Preserve source labels and state which earlier decision was superseded.

For each added feature, identify its content, route, access, movement, persistence, and presentation effects. Some features fit existing contracts with little code; others legitimately require a new capability. The goal is coherent extension with explicit boundaries, not an arbitrary promise that every idea costs one row.

No core implementation, repository write, PR merge, or deployment was performed as part of producing this handoff. Its immediate next use is to give the implementing agent the complete product intent and a testable definition of completion.

## 20. Revision 1.1: multidimensional lenses, private recap, and later implementation

### 20.1 One aesthetic, different primary lenses

> Repository note (28 September, agreed with John after 1.1): as built, **By Topic = view the Slate through the groups already made. It does not infer, classify, or rename content.** Where this section says "topic", read "group" until a separately decided feature says otherwise.

USER direction supplied at approximately 10:48 AM America/Denver on 28 September: multidimensional vortex; unified aesthetic; no or minimal color. Time, topics, projects, relationships, and other relevant dimensions should feel like aspects of one space. The suggested starting point is time by default, an explicit reorientation into topic, and secondary information emerging with depth. Exact switching controls and encoding choices remain PROPOSED.

PROPOSED switching contract:

1. Rotation explores the currently selected lens. Looking from six toward three does not implicitly change the organizing dimension from time to topic.
2. A small, explicit Time / Topic control or equivalent accessible action changes the primary arrangement. A keyboard shortcut may duplicate the action, but cannot be its only discoverable input.
3. Keep the focused work identifiable and visually anchored during reorientation. Rearrange its permitted neighbors coherently. A lens change alone records neither a Lean nor a new content visit.
4. Preserve each lens's context, including time scope and current route, so returning to Time restores a meaningful location. If access or content changed, explain the nearest valid fallback.
5. Topic labels replace hour labels when Topic is selected. Do not imply that a particular subject has an intrinsic three-o'clock meaning or create four arbitrary categories merely because the clock has four familiar anchors.
6. Topic membership and the existence of related work respect the viewer's current access. A visual arrangement can change without rewriting authorship, canonical relationships, ownership, or contribution permissions.

"All dimensions always present" means the underlying data can remain available to the view. It does not require every cue to be visually prominent at once. Preserve the attention budget and reveal secondary information only where it helps a choice.

PROPOSED allocation of visual cues:

| Cue | Default role | Guard against ambiguity |
| --- | --- | --- |
| Perspective scale | Physical approach and distance | Large must not ambiguously mean near, important, popular, and resonant at the same time. |
| Bounded content scale/emphasis | Optional creator-assigned importance if that meaning is specified | No inferred universal importance score or popularity ranking. |
| Opacity and sharpness | Visibility phase, distance, inspection, and focus | Keep text legible; use distinct marks for resonance and presence. |
| Surface texture and local pattern | Project/group context | Texture is not proof of a topic boundary; give accessible labels. |
| Position/radius | The active organizing lens | Explain the active lens; preserve coordinate and time policies. |
| Filaments and proximity | Declared or clearly identified derived relationships | Nearness caused by layout is not automatically an authored relationship. |
| Dew and other marks | Explicitly defined attention/presence/memory states | Keep states distinguishable in monochrome without turning every state into glow. |

LENS-01 acceptance: switch Time -> Topic -> Time while focused on the same work. Its identity, permissions, and memory remain unchanged; its original temporal context is recoverable. LENS-02 acceptance: the full flow remains understandable without color or continuous animation.

### 20.2 Restore the theme-song recap as an explicit requirement

HISTORY recovered from the earlier September 27 conversation: John described a private Spotify Wrapped-style Fall recap with his own song, the hook "shoulda done lean," a view of the route chosen and alternatives passed, and a way to revisit missed branches. The current user recalls an additional phrase like "should have been more mean"; its exact wording is not confirmed. No specific song title or audio asset has been reliably matched to this request.

This requirement was underrepresented in version 1.0. It belongs alongside local journey recovery, not inside aggregate Lean analytics. Spotify Wrapped is a reference for a personal musical retrospective; it does not imply Spotify integration, a yearly schedule, branding, or copying Spotify's visual design.

PROPOSED first treatment: an optional "Your Fall" recap opened by the visitor. It shows a brief, local reconstruction of the actual route, then highlights an eligible opening that was encountered and not entered. John's hook can land at that turn as an affectionate callback. It must not label an unexplored route a failure, claim to know why the visitor passed it, or imply that its unseen content was better.

The opening remains inspectable. Inspecting it inside a recap is not a Lean. Actual return into the live Slate requires current authorization and a deliberate navigation action. Shared Fall followers retain the existing rule that follower locations are not collected server-side.

Music starts only after a deliberate play/replay action, respects mute and other media playback, and can be stopped. The confirmed recording and cue point are needed before claiming a working soundtrack. The first mockup is silent and uses clearly labeled sample content; it does not read browsing history, call a server, save a Fall, or navigate production.

Suggested sequence: Your Fall -> replay the remembered route -> reveal a path left open with the hook -> inspect or return to that opening. Do not require scores, percentiles, streaks, annual waits, or public sharing. Any later export/sharing requires a separate deliberate action and a preview that excludes private content and other people's protected identities.

### 20.3 Recap data contract and scope

The later ledger reports sets of explored paths and turned hours. Such sets alone cannot reconstruct the sequence, timing, offered alternatives, or time-of-day context of an actual Fall. Do not invent a chronology from them.

PROPOSED minimal local sequence, only if not already present in the actual implementation: local journey id, ordered semantic navigation events, stable location/route ids, lens/time context, deliberate-choice origin, and enough permitted branch context to identify genuinely encountered alternatives. Store optional elapsed intervals only when the recap needs them. No frame-by-frame camera recording, inferred emotion, raw audio capture, or new server telemetry is required.

Derive a bounded recap from the actual sequence. Use the visitor's chosen data-retention policy and supply local deletion/reset. If only legacy explored sets are available, show an unordered exploration summary and state that an ordered replay is unavailable. Revalidate access at display and navigation time, including artwork/media used in a future exported recap.

Recap feature status: requested; an illustrative interactive mockup accompanies this revision; actual "Save this Fall"/journey capture and soundtrack integration are not claimed implemented.

| Test | Expected outcome |
| --- | --- |
| RECAP-01 | A known local sequence replays in its recorded order; older set-only data is not given fabricated order or timing. |
| RECAP-02 | A missed alternative was actually available and encountered in that journey; restricted work is not revealed. |
| RECAP-03 | The hook plays only on requested audio playback using the confirmed track and cue, with stop/mute and reduced-motion behavior. |
| RECAP-04 | Opening a recap, replaying it, or inspecting an alternative does not count as a new Lean, reaction, or resonance contribution. |
| RECAP-05 | Leaving the recap for a live route is explicit, access-checked, and does not modify the recorded journey retroactively. |
| RECAP-06 | Recap history remains on-device; no public ranking, aggregate contribution, or sharing occurs implicitly. |

### 20.4 Implementation update supplied at approximately 10:50 AM

John supplied a REPORT of commits `709a447` and `9efe44c`. The latter was reported live. ChatGPT subsequently read [docs/CORE_LEDGER.md on main](https://github.com/Foxlendor/twinthink/blob/main/docs/CORE_LEDGER.md), blob SHA `6863f35fff9b1ee79d24fe4d50f7996d5a914b85`. This confirms the ledger's recorded state, not a new independent production test. The ledger still labels several newly live-reported behaviors as locally tested and lists deployment as a next step; the implementing agent should reconcile those labels with its actual deployment evidence.

| Area | New DOC / REPORT evidence | Remaining distinction |
| --- | --- | --- |
| Core | Core rules and adapters reported built; eight regressions preserved | Ledger explicitly says space/connections and capacity are not yet core parts; openings are still tree children. |
| Hour streams | Hour lens selects nearby-hour work; deeper is older across days in the prototype | Permanent depth, timezone, and AM/PM policies remain unresolved. |
| Steering | Desktop pointer lock and centered hollow drop; touch drag/tap/pinch | Actual-phone check and reduced-motion evaluation remain outstanding. |
| Openings ahead | Actual forthcoming objects are ringed at their hours; aiming records nothing, entering records Lean | Same-hour overlap, maximum displayed alternatives, and John's experience acceptance still matter. |
| Memory | Every explored route per place and turned hour retained locally alongside last Lean | Not proof of an ordered Fall recording; Save this Fall remains unbuilt. |
| Dew/Drop | Explicit mutually exclusive on-device reactions | Aggregate reaction behavior, audience, and a rendered mark remain open. |
| Goes with | Cross-group name/tag link; reported bug fixed so following it is a plain trip | It is not a deliberate branch choice or general semantic/topic organization. |
| Switch lead | Current leader can hand off; seat overwritten with no leadership history | Two-account live check still owed; viewer following is not creator co-op. |
| Rabi | Proposal names a new space, who could post, and room used; maker applies through existing checks | No demonstrated material-informed architecture, in-flight route preview, or general connection proposals. |
| Entitlements | Existing bounded room routed through a dormant hook | No purchase or new allocation effect; existing `FORK_ROOM_MAX` behavior remains. |
| Founder allocation | 47/427/474 retained as dormant constants | No verification, access, perks, or rewards granted. |

The report lists 159 passing unit tests and selected live browser checks. These are REPORT evidence until re-run or inspected directly. Preserve their stated gaps instead of upgrading all rows to fully accepted. Creator co-op rights, aggregate Lean protocol, pricing, and founder verification remain outside this reported batch. The new theme-song recap and the proposed Time/Topic lens transition are not established by it.
