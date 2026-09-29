# TwinThink: product record

The concept, what is decided, what is only proposed, and what is open.
Source: *TwinThink restart brief* v1.0 (28 Sep 2026), reconciled with
`docs/CORE_LEDGER.md` on `main` (blob `1ac6ad8`). Where a later decision by John
exists, it wins; this file changes when John changes the design.

Labels used below: **Decided** (John said so), **Prototype choice** (a reversible
engineering assumption made here, awaiting John's judgment), **Proposal** (direction,
not approved), **Open** (a real decision nobody has made).

## 1. The idea

TwinThink helps people capture ideas and creative work, keep how they develop, and
let others explore and build on what they deliberately share. A person's connected
body of work is their **Whoeuvre**. The **Slate** is the spatial medium; a visitor
moves through it as a **Drop**. **Rabi** helps a person express an idea and shapes
navigable space around work, under creator control. The lasting purpose is
preservation and continued creation, not permanence, ownership or security guarantees.

## 2. The experiential core (Decided, 28 Sep)

**A Drop falls through a living web of relationships. Gaps let it continue falling;
strands catch and redirect it; Drift lets the visitor influence which tensions they follow.**

| Element | Decided behavior |
| --- | --- |
| Drop (body) | The visitor's presence. Falls, rises, coasts, spirals, is caught and redirected. |
| Fall | Already happening. Letting go lets it continue. |
| Touch / hold | Slows and settles near work, to read/watch/listen in place. Never a modal page. |
| Drift | Thumb direction and strength influence trajectory and which strand is caught. Not positional control; momentum matters. |
| Catch | Contact with a strand redirects motion according to the structure. |
| Dew | Explicit decision to carry forward: the Drop adheres and leaves persistence. |
| Drop (judgment) | Explicit decision to release: detach and fall. Never "enter", never a jump to unrelated content. |
| Lean | Deliberate, private navigation commitment. Motion, being carried, inspecting or view changes never imply one. |

- Relationships, contributions and groups make the structure. No fixed legend
  ("this kind = ramp, that kind = bowl"). A destination results from structure plus
  movement, never a hidden pick.
- The test for any feature: does it change the living structure the Drop moves
  through, or is it a control pasted on a feed?

## 3. Look, input, access (Decided)

- Ink and paper, monochrome, quiet icons, restrained text. 3–7 salient objects at once.
- Openings contain real work; work resolves with approach: presence → identity → meaning → detail.
- Phone: the thumb controls motion; **the phone stays still; no tilt steering.** A thumb joystick is the target.
- Desktop: a centered Drop reference for immersive movement; leaving that mode restores the pointer.
- Keyboard, screen reader and reduced motion reach the same work and relationships (not a lesser second product).
- Time and Topic are two views of the same Slate. Time: 12/3/6/9 = hour of creation.
  Topic = groups people already made; no inferred topics.

## 4. Privacy and meaning (Decided)

1. New work is private until its maker deliberately shares it.
2. Navigation, Lean, reactions and recaps stay on-device. Shared use needs a separately decided aggregate privacy protocol.
3. Shared sessions exchange only necessary authorized state; joining never grants content access.
4. An inaccessible place yields only the permitted follower message: no portal, title, id or silhouette.
5. Inspecting, passing, waiting, being carried and choosing are distinct; no opinion is inferred from motion.
6. Rabi uses only material deliberately given for that action.
7. No public view/like counts, scores or ranks as the product's language.
8. Private invention material never becomes seed data; prototypes use labeled synthetic samples.

## 5. Creation and preservation (Decided intent)

Say or type an idea; Rabi reflects an interpretation; the maker corrects it; the original
expression is kept alongside any accepted interpretation, with history. Manual creation
works without AI. Rabi's route proposals show reason, affected work, access and capacity
impact; the creator previews and applies. Generated infrastructure is marked apart from
authored work. A timestamp is a recorded time, not proof of authorship.

## 6. Prototype choices in this workspace (reversible; for John to judge)

These make the first scene run. None is a product decision until John accepts the feel.

| ID | Choice | Why / how to change |
| --- | --- | --- |
| P-1 | The web is laid out by a deterministic force layout: relationships pull works together, groups attract weakly, each work is tethered to a stable home derived from its id. | Same data → same web; a changed relationship reshapes locally instead of reshuffling everything. (Part of D-12.) |
| P-2 | Every relationship is a straight strand. Grip ("tension") rises with how connected both ends are and whether they share a group; a strand catches a Drop whose speed across it is below its grip, otherwise the Drop tears through and slows. | Structure, not kind, decides behavior. Kinds are words for readers. (D-12.) |
| P-3 | A work pulls gently in proportion to how many relationships it has. | "Denser clusters pull"; bends free fall. (D-12.) |
| P-4 | At a junction the Drop continues on whichever strand best matches its direction bent by Drift; too slow → slips off; no good match → flies off. | Drift chooses among tensions without positional control. |
| P-5 | The web repeats vertically (the fall has no floor) and leans gently inward past its outermost works. | Continuous fall with few works. (D-14.) |
| P-6 | Touch without dragging = settle; drag beyond 14 px = Drift from where the thumb landed (floating joystick, 80 px = full). Space = settle; arrows/WASD = Drift; E = Dew; Q = Drop. | Mobile decision (thumb, no tilt) made concrete. |
| P-7 | Dew leaves a visible bead on the work and holds the Drop there until Drop. It does not yet change the web's physics. | Whether Dew persistence shapes the web (for you, or for others) is D-07. |
| P-8 | "Rest": the list view and a newly saved idea may place the Drop beside a work. It is not a judgment, records nothing, and any touch lets go. | Reaching the same work without motion (D-15). |
| P-9 | With no input the fall settles into a recurring route through part of the web; Drift is how you leave it. | Observed, not designed. Relevant to D-14. |
| P-10 | Only Dew and Drop are stored as judgments (localStorage). Catches, settling, reading and resting are never stored. No Lean is recorded at all. | D-13 is open; recording nothing is the safe default. |

## 7. Open decisions (from the ledger; still open)

| ID | Question | Already agreed |
| --- | --- | --- |
| D-12 | How relationships shape geometry, currents, attraction, resistance and trajectories; what a person or Rabi may shape. | No literal kind→shape mapping. P-1…P-5 are one candidate. |
| D-13 | What counts as a Lean when choosing is a nudge? | Trajectory alone never implies a Lean. |
| D-14 | How the Drop comes to rest; how long the Fall carries you without input. | Rest is physics (touch/hold settles, release resumes). |
| D-15 | Keyboard, screen reader, reduced motion. | Same underlying structure. |
| D-16 | Shared Fall with two different trajectories. | No remote control of another person. |
| D-07 | Where Dew's persistence lives (you only, or the shared web). | On this device until decided. |
| D-01, D-02, D-04 | Time view depth within an hour, timezone, a.m./p.m., clock redesign. | Hour of creation; older-across-days is not a universal rule. |
| D-08 | Capacity unit, allowances, price, expansion; whether money can buy Current. | Nothing charged or limited. |
| D-09 | Creator co-op roles and edit conflicts. | — |
| D-10 | Founder verification and benefits (47 unverified + 427 verified = 474). | Dormant numbers grant nothing. |
| New | Is the one word "Drop" for both the body and the release judgment understandable? | Test with John; the prototype labels the button "Drop ↓". |

## 8. Roadmap (kept whole; only the first two items are being built)

| Feature | Intended role | State here |
| --- | --- | --- |
| **Demonstration A: Drop and web** | Motion through relationships; drift, settle, Dew, Drop; accessible route. | Built, awaiting John's judgment of feel. |
| **Demonstration B: a real idea** | Enter privately, connect, meet in the web, survive reload, keep history. | Built (manual entry; no AI). |
| Rabi (expression) | Reflect an interpretation, correct it, keep the original. | Not built. No AI connected. |
| Rabi (architect) | Shape connections and scarce usable space; previewed, applied by the creator. | Not built. |
| Time / Topic views | Two views of one Slate (hour of creation; existing groups). | Not built here. Timestamps are kept. |
| Whoeuvre and provenance | Connected life's work; attribution, revisions, influences, offshoots. | Only per-idea history. |
| Zed | Depth/persistence visible in structure. | Not specified. |
| Resonance dew | Ambient trace of returning attention. | Not built; kept apart from deliberate Dew. |
| Local journey memory | Deliberate choices, paths, alternatives, in real order. | Only an ordered local list of Dew/Drop. |
| Your Fall | Private musical recap; "shoulda done lean". | Not built. Song/cue unconfirmed. |
| Fall with me / multiplayer | Explore together; hand off lead; no remote control. | Not built. |
| Creator co-op | Rights to contribute/propose/edit/manage/publish. | Not built (D-09). |
| Maker spaces | Open, name, invite, contribute, move, close/reopen. | Not built. |
| Limited room / expansion | Space as a service. | Not built (D-08). |
| Founder allocation | 47 + 427 = 474. | Not built; dormant. |
| Abuse protection | Authorization, limits, bounded response. | Not needed yet (no server). |
| Sharing / publishing | Explicit share, link, collaborate. | Not built; everything is private and local. |
| Migration from the old app | Later, explicit, tested. | Not started. |

## 9. Current (Proposal only)

A resource produced by sustained, meaningful attention around work. Followers stay
people, never a balance. Proposed uses: grow a Whoeuvre, open a new branch, back
someone, pool support, direct an opted-in flow. Current may accumulate, be spent, dry
up, and overflow toward connected or underdeveloped places; bigger reservoirs cost more
to keep full. Also proposed: desire paths, currents/raids, reservoirs/overflow, "the
landscape is the analytics".

**Open** before any of it: shared Dew (D-07), evidence of legitimate attention, the
aggregate privacy protocol (no personal trails on a server), allocation and decay rules,
recipient consent (no nonconsensual raids), anti-gaming, money relationships, and
whether money can buy Current (decide explicitly). Founder numbers never become Current
grants. Nothing in this prototype implements Current.
