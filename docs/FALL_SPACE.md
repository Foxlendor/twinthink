# The Fall, formed by relationships (preview)

Status: a working prototype on previews only (`/fall`), built 30 Sep from John's corrections:
"If removing the tunnel would leave basically the same experience, then the tunnel has failed."
The live Slate is unchanged. Nothing here replaces it until John has tried this and decided.

## Design rules (John, 30 Sep)

- **You should never feel like you're looking at the web. You should feel like you're inside it.**
- **The tunnel was never the mistake. The fixed track was.** Keep the Slate's first-person
  embodiment (inside the space), and generate the tubes, regions and splits from the real
  relationship structure. Things are places; relationships are distance;
  attention is direction; the Fall is movement. First person is the normal view; "look back" is
  the one deliberate step outside, to see the route you took.
- Controls on a phone stay drag-only (tilt stays decided against).

- **The Fall isn't transportation between content. The Fall is the visible shape of understanding it.**
- **Do not remove the spiral. Earn the spiral.** A tunnel, spiral, vortex, corridor, opening,
  compression or huge empty drop can all happen. The form must result from the structure.
- **Don't script the tunnel. Let the relationships create it.**
- **DBWiki is the test material. The Fall is the invention.** Wikipedia/DBpedia is the real-data
  testbed, on purpose: a huge existing relationship graph that shows whether this way of moving
  works, and a way to show the idea without explaining TwinThink first ("pick Phonograph: instead
  of a page of blue links, the relationships become a place you move through"). Keep the data
  source and the interaction model separate: DBpedia says what is connected; the Fall decides
  what those connections feel like as space. Do not let it collapse into a conventional 3D
  knowledge graph, and do not mistake the DBpedia graph for the final TwinThink experience.
- The space communicates first; text clarifies when needed. You understand it the way you come
  to understand a city or someone's room, not by reading a graph legend.
- The experiment `/fall` answers: can a person start at one concept and genuinely feel how
  knowledge branches, converges, loops back, becomes dense, becomes distant, and becomes a
  personal traveled route? Can knowledge itself generate the landscape you fall through? Later
  the same engine is applied to a Whoeuvre, where the test becomes: does traveling through it
  reveal something about the person that a profile, playlist, grid or feed cannot?
- The clock face is not thrown away. It is not forced into direction here; it stays an open
  idea, and time may become another dimension of the space (for example, depth along the thread).

## Search is the entrance (30 Sep)

**Search chooses where you enter. The Fall determines where you go.** Search is a doorway into
the space, never a results page, and never the main interface.

- On the first page: a quiet "where do you want to enter?", with "or begin somewhere" and the
  starts below it (nobody needs to know what they are looking for). While falling: a quiet
  "enter elsewhere" opens the same doorway over the page; it is gone as soon as you choose, and
  Escape or a tap outside closes it. No search bar stays on screen while you fall.
- A name ("Phonograph", "Michael Jackson") goes straight to that article. The start of a name goes
  to what it begins. A description ("early recorded sound", "how bicycles evolved") goes to the
  article that best matches it (Wikipedia's own full-text search, top result).
- Only when a name means several things ("Mercury") is there a short, temporary choice: the
  things it names, each with Wikipedia's one-line description (planet, element, Roman god, car).
- Nothing found, or Wikipedia unreachable: said plainly, nothing invented.
- One request per search (never per keystroke), `Api-User-Agent`, from the browser only
  (`lib/fall/enter.ts`, tests in `enter.test.ts`).
- Entering by search begins a new Fall at that place. Articles past the snapshot come from
  DBpedia live, so the first steps from a searched article can be slow.
- This is public knowledge only. It says nothing about searching private Whoeuvres or the
  catalog, which keep their own discovery rules.

## The current (30 Sep, replaces the chambers)

The chamber proof (click an opening to enter it) was node-graph logic in a tunnel costume. It
is replaced, not patched (`lib/fall/ride.ts` for the movement, `lib/fall/stream.ts` for the
drawing; `chamber.ts` is gone). The rules:

- **You don't enter tunnels. You're already in the tunnel. You don't choose nodes. You steer
  through relationships. You don't arrive at ideas. You pass through them. You don't click to
  move. You stop to inspect.**
- **Movement is the default. Choosing is steering, not clicking.**
- **Momentum carries you. Attention changes you. Inattention eventually lets you settle.**
- Moving is experiencing relationships; steering is choosing attention; stopping is understanding.

How it works:

- You are always moving. The relationship you are riding is the tube around you; its rings are
  fixed in the space, so they stream past. Where it reaches a subject the tube swells (a region)
  and the subject's name drifts past; that is the only word on screen while you move.
- The subject's own relationships split off ahead as branches, already formed (and the split
  after, faintly), each where its strand puts it: wider the stronger, the strongest nearly straight
  on, weaker ones peeling away at their bearings (came from above, led to below, related things at
  the sides). The earned tunnel, gaps and spiral come from the same placement as before.
- The pace follows the structure: slower through a dense subject, faster across the gap of a weak
  relationship. While the split ahead is still forming (a live DBpedia answer), the current slows
  and waits inside the subject.
- Steering is a lean: drag a thumb, move the mouse, or A/D and the arrow keys. Nearing a split,
  the branch nearest your lean gradually captures you (the view drifts toward its mouth); you are
  committed only when you pass the split. No lean, and the main current (the strongest
  relationship) carries you.
- A person's own work is a thinner rose side current (at Drinking straw: SipSmolder), with rose
  threads drifting along the wall toward it before it splits off. It is never the main current; you
  lean into it, under the same rules as any branch. Crossing, the tube turns rose.
- Holding stops you: a finger down (not moving), the mouse button, or S or Space. The slowing
  starts at once; what is here resolves a beat later, once you are still. In a subject: its name
  and line, and every branch named where it leaves, with its reason (the rose one too). Between
  two subjects: why the two connect. And, when a person's own work is a step or two on, a rose
  thread toward it, named. Only real data; nothing random, no rewards. Let go and the current
  picks you back up. No modal, no pause icon, no hard freeze. Dragging is steering, not stopping.
- Pay no attention for three subjects in a row and the current lets you settle, inside the next
  subject with its splits in view. Any lean, drag, key or hold picks it back up.
- W held hurries you. Reduced motion: a slower, even pace, no camera sway, no drifting threads.
- "Look back" steps outside: the path you actually rode as one line, the branches passed at each
  subject as stubs, every subject named, and where you stopped as open rings (named when the stop
  was between two subjects).

Same data underneath as before: sources, snapshot, search, bridges, strength and direction,
circling. Tests: `ride.test.ts`.

## Where human work meets knowledge (30 Sep)

The fourth step of the loop: search, enter, fall through knowledge, and meet a person's own work
there. A piece of a Whoeuvre is tied to a Wikipedia article only where its maker says so
(`lib/fall/bridges.ts`, written by the maker, never inferred). Then, from the article, a thread of
credit in rose (the Slate's colour for credit) leads to the piece, named "johne.boi made this"
with the maker's reason, and it is never crowded out by knowledge. Going in crosses into the
Whoeuvre: the piece's own group, its neighbours, what it grew from, and a thread back to the
article. Only pieces open to a visitor who is not signed in are ever shown, so a bridge can
never expose anything private (`lib/fall/sources.ts`, tests in `sources.test.ts`). The list is
empty until John writes it.

## Rabi: depth for what cannot all fit (decided 30 Sep, not built)

**Rabi gives depth to information that cannot all fit in front of you at once.** Rabi is not
recommendation ("these five are best"); it says "there are forty true connections here, but a body
cannot occupy forty doorways at once". This is the same Rabi that shapes parts of the web
(`CORE_LEDGER.md`, "Rabi and the web"); here it has a concrete, deterministic job in the Fall, and
it is never named on screen. People should only notice that even the most connected idea still
feels navigable.

Why: `chooseOpenings` keeps the 7 strongest ways on and throws the rest away (Phonograph has 40 from
DBpedia, a query limit, so 33 vanish). That is hiding weak nodes. Rabi replaces the cap.

The rules:

- The source decides which relationships exist. Rabi never deletes one and never chooses your route.
- Rabi budgets what becomes perceptible now: about 3 to 5 distinct currents at a split, the budget
  growing with the number of strong relationships, not the total.
- Strong and different relationships get direct space (their own current). Mouths keep a minimum
  separation (about 30 degrees); when two collide, the weaker goes deeper.
- Related relationships (same kind, same bearing, e.g. "filed with") share a trunk: one broad
  current they peel off one at a time, strongest first, so each split is a two-way choice. **The
  trunk is the relationship family, not a route to its strongest member.** It is drawn and named
  as the family ("filed with", from Ring binder), and while members peel off it nothing implies
  they are downstream of one another; the trunk simply narrows into the strongest remaining branch.
  It never ends in a subjectless room.
- Weak ones stay latent in the wall, as faint seams around the region.
- Density widens the space: a subject with many strong relationships becomes a larger, deeper
  region instead of shrinking every opening.
- **Attention gives relationships space. Stopping gives them meaning.** Moving and leaning toward a
  wall region makes its seams separate into real currents ahead (mostly wordless, spatial
  resolution); stopping names them and says why (semantic resolution).
- Human work receives protected space, but not unlimited space. Now: the one authored contribution
  (SipSmolder at Drinking straw) keeps its own rose current, never merged, never in the wall, never
  wider than the main current. Later, if a subject has many human contributions, at least one
  relevant human current stays protected and the rest get their own family and depth, visibly
  distinct, so there is no rose clutter.

How the four test cases would lay out (real snapshot data):

| Subject | What is there | Perceptible at once |
| --- | --- | --- |
| Crazy Legs (dancer) | Rock Steady Crew and Breakdancing (0.65), four "linked both ways" (0.35) | Two currents, well apart; one faint trunk for the four; narrow region |
| Ring binder | Five "filed with" (0.47 to 0.59), seven "linked both ways" | One broad "filed with" trunk, members peeling off one at a time; the seven in the wall |
| Phonograph | Thomas Edison (0.77, above), 17 "filed with" (strongest 0.71), 20 "linked both ways" | A wide region; Edison above, Phonograph record, Phonograph cylinder, Turntablism, the "filed with" trunk; the twenty in the wall, resolving toward your lean |
| Drinking straw | SipSmolder (0.8, rose), two "filed with" (0.47), eight "linked both ways" | Main current is the "filed with" trunk; the rose side current; the eight in the wall |

## Opening a subject (30 Sep, not built)

Move to discover. Stop to understand. Open to study. The Fall is good at traversal and weak at
dwelling; a subject should be a place you can explore, not only a waypoint. Proposed:

- Opening anchors you: double-tap while still (phone), double-click or Enter while stopped
  (desktop). A double tap while moving only brakes. Once open, no finger is needed to stay.
- The region swells into a room around you (the same tube, paused and widened; not a panel, page
  or modal). Dragging looks around instead of steering. Directions keep their meaning: ahead the
  subject itself (longer summary, the source); behind, the relationship you came in by and why;
  above, where it came from (people, what it grew from); below, what it led to; sides, kin and
  categories as families; a person's work as rose.
- First: only the longer summary (already fetched, today cut to one sentence), where you came from,
  and the source. Everything else is unnamed marks on the walls.
- Only what you face resolves; dwelling reveals deeper rings in that direction; looking away lets
  them fade. Never more than about 3 to 5 legible items in view.
- Leaving: double-tap again (double-click, Escape or Backspace) folds the room back to the stopped
  state; W, or a long drag toward a branch, closes it and the current carries you on.
- Rabi decides how much interior a subject gets: a highly connected subject gets more interior
  depth, never more on screen at once.
- Data: one extra DBpedia query only on opening (dates, category names, abstract, which linked
  things are people), cached a week; a "read on Wikipedia" link rather than reference lists; nothing
  invented. Twins tied to a subject are not in scope.
- Decided 30 Sep (after the in-hand test, per the decision tree under Not built yet): Rabi before opening, in this order: Rabi allocates the space outside a
  subject; confirm dense subjects stop feeling crowded; reuse the same allocator inside one opened
  subject; Phonograph end to end; only then every subject. Outside a subject Rabi decides how
  relationships get room; inside, how information gets depth. One system, not two.
- Decided 30 Sep: dates get no spatial direction yet. The tube's axis already means where the
  current carries you; making it also mean later in time would overload it before the time model
  is decided. In the first study room dates are a deeper layer, revealed by dwelling, with the
  summary and source ahead.
- The three states: Fall (moving through relationships), Stop (understand what is here), Open
  (study inside the subject). Opening only works once stopped, anchors you, and is the same tube
  swelling around you: no page, modal, or visible change of mode.

## Multiplayer: decided 30 Sep, not built

Watusi built synchronous collaboration; TwinThink is building synchronous experience. They
overlap technically; they are not the same product. Multiplayer means sharing the depth: falling
together, seeing one another's paths, and later making or attaching things inside the same space.
What it is made of: shared presence, shared live state, and immediate consequence (a strand
appears for both, a doorway opens for both, the joint route stays visible behind you).

- The base is the existing "Fall with me" (on `main`): server-held position, per-viewer filtering
  (a follower is only ever sent a place they could see themselves, otherwise only "beyond").
  It is not replaced by Yjs or any shared client state; the server stays in charge of visibility.
  Yjs may later carry only what is truly the same for everyone present (something written
  together), never position.
- Leans stay private by default. If sharing where you lean or aim is ever added: opt-in per
  session, ephemeral, never stored.
- `sample/` keeps meaning "never leaves the device". Real public knowledge gets its own
  namespace (such as `wiki/`) before any of it can be shared; the `sample/` rule is not weakened.
- A subject's continuity (the continuity log) and the history of a shared Fall session are
  separate concepts, unless a later design shows they should share a model.
- The first prototype, when it comes: "Fall with me" extended from Slate places to `/fall`
  subjects, with the same privacy guarantees. Two people in the same relationship space, both
  seeing the rose strands, each able to look back at their own route through it.
- Not coming: channels, rooms, a code editor, GitHub as storage, or other Game Table surfaces.
  What is worth keeping from it: a sandbox for running an interactive piece safely, and rename
  and delete wherever people manage their work.
- Order: first, the three bridges tried on a phone by one person (search, fall, meet a person's
  work). Only then the smallest change that extends "Fall with me" to `/fall`.

## The vocabulary the space has (all of it earned from structure)

| What the structure is | What it becomes |
| --- | --- |
| A run of strong links that kept your way nearly straight | Rings form around that stretch of your thread: a tunnel, tighter the stronger the links. Ahead, when only a few ways lead on and one is strong, rings begin to form along it. |
| Your route keeps coming back around one thing (it, or places tied to it, keep turning up) | That thing becomes a centre (faint rings, its name), and the next ways on tied to it are set on an orbit around it: keep circling and the path wraps into a spiral. |
| A weak link | A long strand across empty space: a gap you can feel. |
| Many ways of similar weight | The space widens (they spread further out). |
| Going somewhere already reached | The strand joins back to where it was; the path loops. |
| Returning (on this device) | Dew on places seen before; strands walked before drawn solid. |
| Attention | Riding, nothing is named but the subject passing. Leaning lets a branch capture you as you near its split; holding still names what is here (the subject, why two things connect, every branch and its reason). |
| The next step's own links, once known | The ways on ease into where they now belong: the space re-forms as more of the structure arrives. |

## What was wrong with the live Fall

Honestly: the live Slate is one fixed track (every thing in a set order, newest first) with a
cylinder drawn around it. The side tunnels added on 29 Sep sit on top of that track. Take the
tunnel away and you still get "next, next, next". The space does not come from what leads to what.

## What `/fall` does instead

There is no tunnel and no track. The space is made from two things only: the relationships the
source states, and the way you actually went.

| The question every movement should answer | How `/fall` answers it |
| --- | --- |
| Where did I come from? | Your thread: one solid line through every place you reached, the only solid line on the page. It comes in from behind you. |
| Why is this next thing here? | Each strand has a bearing from the source: where a thing came from (who made it, what it grew from) lies above, what it led to (what it made, what it founded) lies below, kin (filed under the same categories, or a stated relation like "relative" or "genre") to either side, things only linked both ways on the diagonals. Leaning toward one names it and says why ("known for it", "founded", "child", "filed with"). |
| What other directions could I have gone? | Every way on is visible around where you are. At each place behind you, the ways you did not take stay as short faint stubs. |
| Close connection or a big jump? | Strength sets distance: a strong connection is short and nearer your way, a weak one long and further out. A jump leaves a real gap. |
| How deep am I? Have I been here before? | The path's own length and turns; a place seen before (on this device) carries dew; a strand walked before is drawn solid, one never taken stays dotted. Going to somewhere already reached on this Fall joins the path back to it instead of placing it again. |
| What path have I created? | "look back": the camera rises until the whole route is in view, every place named. |

Arriving turns you toward where you went and carries "up" across the turn (it is never snapped
upright), so a run of turns the same way curls into a spiral, a strong chain drops almost
straight, and two branches can orbit the same thing before parting. None of that is drawn on
purpose; it is what the path does.

(This section describes the first, third-person `/fall`. How you move is now the current, above;
the placement and the answers in this table are unchanged. The third-person view remains as
"look back".)

## The examples: Wikipedia and DBpedia

- Relationships: one DBpedia query per place (`stepQuery` in `lib/fall/wiki.ts`): every article
  linked both ways with this one, how many categories they share, and any stated relation
  between them (DBpedia ontology properties such as knownFor, foundedBy, child, influencedBy).
  Strength = linked both ways (0.35) + shared categories (0.12 each, at most 0.36) + a stated
  relation (0.3).
- What a thing is: the Wikipedia summary's first sentence, credited on every place ("From
  Wikipedia: X (CC BY-SA 4.0). Connections from DBpedia."), with links to both.
- Nothing is made up. If DBpedia cannot be reached, the place says so and shows no ways on
  ("try again" asks once more). No images.
- Gentle: at most two requests at a time, `Api-User-Agent` on Wikipedia requests, answers kept on
  the device for a week.
- Nothing reaches our server: everything is fetched in the browser, every id begins
  `sample/wiki/`, and what you have seen and walked is kept in `localStorage` only
  (`twinthink.fall.v1`).
- Previews and development only: the page checks `samplesAllowed` in the browser, and the route
  returns 404 when the deployment is production.
- A snapshot of real answers (`public/fall/wiki-snapshot.json`, taken by
  `scripts/wiki-snapshot.ts`) covers the five starts and the steps nearest them, because DBpedia's
  public endpoint often takes 10 to 30 seconds to answer. Past the snapshot, the page asks live.
  Long dashes in the snapshot are written as `–`/`—` escapes and replaced with commas
  or "to" wherever text is shown (house rule).

## Differences from the brief, on purpose

- **Direction means the kind of relationship, not the hour.** The Wikipedia brief places things
  by the hour their article was created; that says nothing about why a thing is here. The clock
  stays an open idea (see the design rules).
- **DBpedia states "where it came from" and "what it led to" only sometimes.** Phonograph has
  Edison ("known for it") above it and mostly kin at the sides; nothing states what the phonograph
  led to, so nothing is placed below it. That is the source being thin, not a rule; nothing is
  guessed to fill it.

## Not built yet

- More of a maker's own Whoeuvre on the page than the pieces reached by a bridge (the adapter,
  `lib/fall/whoeuvre.ts`, offers only what a signed-out visitor may enter). Its relationships should be TwinThink's
  own, richer than parent and child: grew from, reminds me of, made during, became, abandoned
  for, returned to, inspired, contradicts, belongs with, someone else pulled this direction, and
  the visitor's own "I keep coming back here". The engine already understands a version becoming
  the next (a `succession`, which closes into a tunnel), a contradiction (`across` a gap),
  someone else's pull (`outside`) and something left behind (`faded`).
- Keeping a Fall across visits (today a reload starts again; seen and walked are kept).
- The Wikipedia examples patch from the other session (`wikipedia-examples`, first edits as
  history) is on John's computer, not here; it does not conflict with these files.

- Rabi's allocation and opening a subject (both above): waiting on the in-hand test of the current.
  The test asks one question: does it feel like the structure already existed and you moved through
  it, or like the system is drawing choices in response to you? What gets built next follows the
  answer:
  - feels pre-existing, but cluttered: build Rabi;
  - feels pre-existing and clean: build the Phonograph study room (open subject);
  - feels reactive or menu-like: first improve how far ahead the Fall forms its geometry and how
    branches emerge before you reach them (no opening yet: depth added to a world that does not
    yet feel physically real);
  - feels slow because of DBpedia: solve caching, snapshot and loading separately before judging
    the interaction.

## Where

`lib/fall/graph.ts` (what a source answers), `lib/fall/space.ts` (the geometry the path makes,
including `circling` and `orbit`),
`lib/fall/draw.ts` (ink on paper), `lib/fall/wiki.ts` (the source), `components/fall/FallSpace.tsx`
(the page), `app/fall/page.tsx` (preview only). Tests: `lib/fall/fall.test.ts`.
