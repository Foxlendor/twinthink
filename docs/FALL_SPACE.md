# The Fall, formed by relationships (preview)

Status: a working prototype on previews only (`/fall`), built 30 Sep from John's corrections:
"If removing the tunnel would leave basically the same experience, then the tunnel has failed."
The live Slate is unchanged. Nothing here replaces it until John has tried this and decided.

## Design rules (John, 30 Sep)

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

## The vocabulary the space has (all of it earned from structure)

| What the structure is | What it becomes |
| --- | --- |
| A run of strong links that kept your way nearly straight | Rings form around that stretch of your thread: a tunnel, tighter the stronger the links. Ahead, when only a few ways lead on and one is strong, rings begin to form along it. |
| Your route keeps coming back around one thing (it, or places tied to it, keep turning up) | That thing becomes a centre (faint rings, its name), and the next ways on tied to it are set on an orbit around it: keep circling and the path wraps into a spiral. |
| A weak link | A long strand across empty space: a gap you can feel. |
| Many ways of similar weight | The space widens (they spread further out). |
| Going somewhere already reached | The strand joins back to where it was; the path loops. |
| Returning (on this device) | Dew on places seen before; strands walked before drawn solid. |
| Attention | At first only short stubs, enough to orient. Leaning toward one draws it out; keep leaning and it is named; keep on and it says why. What you have looked at stays a little clearer. |
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

Leaning (mouse position, a thumb drag, or the arrow keys) pulls the way leaned toward in and turns
the view a little toward it, while the rest drift out and fade. Click, tap, or push a thumb past
the threshold to go. Travel time grows with distance. Faintly past each way on, where it leads in
turn appears once known (the space forming ahead of you). "back" retraces your own thread.
Reduced motion: travel is a short cut, and the view does not turn while leaning.

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

## Where

`lib/fall/graph.ts` (what a source answers), `lib/fall/space.ts` (the geometry the path makes,
including `circling` and `orbit`),
`lib/fall/draw.ts` (ink on paper), `lib/fall/wiki.ts` (the source), `components/fall/FallSpace.tsx`
(the page), `app/fall/page.tsx` (preview only). Tests: `lib/fall/fall.test.ts`.
