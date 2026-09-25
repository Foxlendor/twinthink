# TwinThink Shadow Protocol 0.1

Status: working design note for the Shadow Canvas prototype.

## Product rule

The public experience should be simple:

1. Find a Shadow.
2. See evidence that a person has lived with it.
3. Back it if you want to see what happens next.
4. A back moves that viewer slightly closer to the Twin.

The interface should persuade through continuity and credibility rather than hype, logos, rankings, or dense explanation.

## Core objects

- Twin: the creator-controlled source object.
- Shadow: a deliberately incomplete projection of a Twin.
- Lens: the viewer-specific interpretation of a Shadow.
- Canvas: the spatial environment where Shadows can be discovered.
- Back: a durable signal that a viewer wants the idea to continue.
- Continuity: evidence that the creator repeatedly returned to and changed the work.

## Progressive disclosure model

Internally, a Twin can be decomposed into addressable elements.

For each element x, assign a disclosure depth:

d(x) in [0, 1]

For a viewer with permission or closeness p:

reveal x only when d(x) <= p

This supports progressive disclosure without reducing the system to opacity alone.

A useful conceptual relationship is:

distance to Twin decreases -> permitted information increases

The UI does not need to expose this math.

## Continuity before popularity

The Canvas should not imply that popularity equals quality.

Useful ethos signals include:

- when the work began
- how many meaningful revisions it has had
- whether the creator keeps returning
- whether viewers return after discovery
- whether the work branches or materially changes
- whether previous backers continue to follow it

A single click should matter less than repeated voluntary return.

## Canvas behavior

At far distance, individual Shadows may be nearly indistinguishable from the background.

As the viewer zooms closer:

- Shadows separate spatially
- continuity becomes visible
- a Shadow can be inspected
- its creator note appears
- the viewer may back it
- the viewer's Lens can render that Shadow slightly closer

No search is required for the core discovery loop. Random discovery is a first-class path.

## Cross-device Lens

Printing is optional, not required.

Target interaction:

1. A desktop displays the near-blank Canvas.
2. A phone opens TwinThink Lens.
3. The desktop and phone pair to the same Canvas session.
4. The phone estimates the screen plane using temporary calibration marks.
5. The phone maps Canvas coordinates into camera coordinates.
6. The phone renders the viewer's permitted Shadow layer over the physical screen.
7. Different authenticated viewers may see different representations of the same Canvas.

The sensitive Twin does not need to be encoded in near-white pixels. The Canvas may expose only public Shadow data while protected disclosure layers remain access-controlled.

## Current prototype

The /canvas route demonstrates:

- near-blank spatial Canvas
- 1,400 deterministic Shadow cells
- pan and zoom
- Lens on/off
- random discovery
- visible continuity trails
- creator notes
- backing semantics
- per-device persistent backs
- slightly closer rendering after backing
- explicit distinction between prototype records and real Twin records

Next engineering step: replace seeded demo records with live Twin continuity events and add paired-screen Lens sessions.

## Related work: visual cryptography (Naor & Shamir, 1994)

Visual cryptography splits an image into shares; each share alone is uniformly
random and reveals nothing, and stacking k shares reveals the image to the eye
with no computation. It matters to TwinThink in three ways:

- **Prior art.** "A near-blank surface that reveals an image only through a
  second layer or device" is established. TwinThink's novelty lies in
  continuity, semantic depth and disclosure tied to backing, not in the reveal
  trick itself.
- **Obfuscation is not hiding.** Pushing an image toward white can be undone
  with a levels/histogram stretch. If a Shadow must protect information, use a
  scheme where one share alone carries zero information.
- **A real mechanism for the paired Lens.** Desktop shows share A (reads as
  paper texture), the phone holds share B. k-of-n schemes suggest a Shadow that
  appears only when k backers look together. Practical limits: pixel-accurate
  alignment through a camera is hard and contrast halves; a digital variant
  (shares combined on the phone) is feasible but is ordinary secret sharing.

## Enforcement note (current build)

In the Shadow Field, sealed nodes are *visually* sealed only; their data still
reaches the client. The public Canvas currently holds only public records, so
nothing leaks. Before any private Twin is placed on the Canvas, the server must
withhold every element x with d(x) > p for that viewer rather than sending it
to be rendered sealed.
