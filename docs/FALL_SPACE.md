# The Fall, formed by relationships (preview)

Status: a working prototype on previews only (`/fall`), built 30 Sep from John's correction:
"If removing the tunnel would leave basically the same experience, then the tunnel has failed."
The live Slate is unchanged. Nothing here replaces it until John has tried this and decided.

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

- **Direction means the kind of relationship, not the hour.** The Wikipedia brief says creation
  dates place each thing at a real hour on the clock face. The correction says every movement
  must answer "why is this here". An article's creation hour says nothing about why it is here,
  so in `/fall` the bearing comes from the relationship and the hour is not used. This is open
  for John: if the clock face should stay in the relationship space, it needs a different job
  (for example, time as depth along the thread).
- **DBpedia states "where it came from" and "what it led to" only sometimes.** Phonograph has
  Edison ("known for it") above it and mostly kin at the sides; nothing states what the phonograph
  led to, so nothing is placed below it. That is the source being thin, not a rule; nothing is
  guessed to fill it.

## Not built yet

- A maker's own Whoeuvre as a source (the same `Graph` interface: parent, children, siblings,
  grew-from, goes-with), with the Slate's disclosure rules. This is the real target; Wikipedia is
  the proving ground.
- Keeping a Fall across visits (today a reload starts again; seen and walked are kept).
- The Wikipedia examples patch from the other session (`wikipedia-examples`, first edits as
  history) is on John's computer, not here; it does not conflict with these files.

## Where

`lib/fall/graph.ts` (what a source answers), `lib/fall/space.ts` (the geometry the path makes),
`lib/fall/draw.ts` (ink on paper), `lib/fall/wiki.ts` (the source), `components/fall/FallSpace.tsx`
(the page), `app/fall/page.tsx` (preview only). Tests: `lib/fall/fall.test.ts`.
