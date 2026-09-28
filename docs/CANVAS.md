# The Slate

Words (decided 2026-09-27): TwinThink is the world; the **Slate** is the place you
enter (`/slate`; `/canvas` and old share links redirect there); the **ShadowField**
is the machinery behind it (these files keep that name); a **Whoeuvre** is what one
person has left behind (`/whoeuvre/<name>`: his is the Slate itself, anyone else's
is their ring in "from everyone", and your own ring is "your whoeuvre"); the
**HEX Lab** (Human EXperience) holds his inventions and experiments, the throwaways
and the ones he is building (`/whoeuvre/johne.boi/hex-lab`). Older notes below say
"Canvas": read it as Slate.

Whoeuvre is not a rebrand of "profile": there is no profile concept here (no
page for who someone is, only for what they've made), and if one is ever
built it stays a plain word. Whoeuvre earns its name because it names a real,
different thing: a body of work, accumulating over a whole life, not an
identity page. Nothing invented replaces an ordinary noun; Whoeuvre is kept
because ordinary nouns don't have one for this.

The Canvas is TwinThink's spatial medium. Engine: `apps/web/src/lib/shadowfield`,
UI: `apps/web/src/components/shadowfield`. Tests: `cd apps/web && npm test`.

## The flight (default)
Scrolling moves *you*, not a page. The whole Canvas is one endless stream in
depth (`flight.ts`, drawn by `flightRender.ts`): things wait small near the
vanishing point, grow as you move toward them, resolve into what they are
(a song's waveform, a film, a 3D object, a session's constellation) and slide
out past the edges, behind you.
- Scroll / swipe: one thing at a time. A hop is a spring (about a quarter second) that the hand's speed carries and that settles on the thing like a magnet. A wheel notch or one trackpad swipe is one hop (its gliding tail never hops again); a finger holds the flight one thing per stretch and lands where it carried it, a quick flick one further; a nudge snaps back. Crossing into somewhere (a far flight) breathes the view out wide; quick runs of hops stay light. What lies ahead is readied as you set off, a song begins on the way, and once you land the line writes itself.
  A flick carries you through many things; coming to rest, one settles into focus.
- Slide: a drag that begins sideways (or two fingers moving together) slides the view any way, and it stays where you leave it until you travel on. The compass is a stick for the same: hold and push it to slide any way (arrow keys when it has focus); its hollow ring shows how far you have slid; tap it to come back to the middle (tap it in the middle to stop or start the clock). Tap anything to go to it. Keys: arrows, Esc.
- An idea that holds others is a ring you pass through; inside, its silk runs
  along the walls. One dotted thread runs through everything, in order.
- Order is content, not a feed: newest first, and the distance between two
  things is the time between them (a long silence is a long empty stretch,
  where the thread thins). After the oldest thing comes the Canvas again.
- Songs play as you pass them (once a tap has allowed sound), loudest in front
  of you. Films play silently while near; a tap gives them sound.
- Three taps on anything knock. For its maker, the owner (signed in) or a
  follower, the flight dives inside; for anyone else its seal offers a note
  for the maker, anonymous (no name, account or address is kept; only the
  owner reads notes, from "notes" on the thing in front of them).
- The stream is a clock: each thing sits around it at the hour it was made
  (on his clock), and the view turns once every 12 units of travel and slowly
  by itself, so it spirals. A dotted hand points at what comes next. The
  compass (right edge) shows world-up, where you are in the lap, and the next
  thing's direction; tap it to stop or start the turning.
- Night: pale ink on dark paper (the visitor's choice, or their system's).
  At thin places in the web (some rings), passing through drops you back
  into day, opening from the middle like falling through the ink.
- "see it whole" switches to the map: the same Canvas as nested frames
  (X/Y to wander, scroll/pinch to go deeper). "fly through" returns.

## What is on it
- **TwinThink** — its own Twin, from this repository's real history (dates and categories only).
- **Free starters** — redr.ink (a 3D object you can turn once inside) and TwizzLock.
- **johne.boi's songs** — seven songs as free modules (`public/music/`). Tap to play; volume follows depth; "take it, free" downloads.
- **johne.boi, dancing** — a film, shared by the inventor (`public/films/`).
- **throwaways** — his cleared ideas, given away: a name and one line of the
  problem it answers (cut from what he cleared, words only removed; never how).
  BubbleBlock carries his own hand-drawn film, signed "animated by johne.boi".
  "take it, free" gives the visitor a private copy that credits him.
- **Your own Shadows** — never leave your device. Add thoughts, images, sketches; challenge and resolve thoughts; "prove it's mine" downloads a SHA-256 proof-of-existence certificate.

## Principles
- Ethos and pathos, not logos: the maker's hand, voice and generosity, and the
  feeling behind each idea; no gauges, counts, or numbers dressed as fact. (Logos
  as in reasoning by numbers. His art, his name and his marks are welcome.)
  His name is written into the paper at arrival; each verb leads to its evidence.
- No invented content or history on the public Canvas.
- Very little text: names; one line for the thing in front of you, only while
  you are still. Activity is shown (heartbeats, constellations, ripples).
  TwinThink's own sessions are named by the hours they were lived, on his clock
  ("all through the night"), never by dates.
- Gifts never sit next to an ask for money; nothing is counted.
- Private by default. Nothing a visitor makes is published.
- Sharing widens on purpose, one step at a time: keep it to myself, share it by
  link (anyone with the link sees it; it is never shown on the Slate and cannot
  be built on), share it with everyone. A link someone sends you opens in
  "sent to you".
- Names come in as you near them and go as you leave (they appear at 0.42 of
  the way in and fade at 0.28, so they never flicker), and only a few at a time.
- Resonance is presence from people returning, not from crowds: someone coming
  back on another day counts; passing through once does nothing. It shows as
  dew on the web, never as a number. Only a one-way mark of who is kept, and
  only for a season.
- What leaving the device is even for is decided on purpose, not by what
  happens to be easy to collect. Ordinary browsing needs nothing richer than
  what already leaves it today: a one-way mark, ids and times, nothing that
  reveals what was seen. A separate, plainly-worded, explicitly agreed-to
  research participation could one day ask more of someone, for a stated
  study, never as a quiet upgrade of data already being kept for another
  reason.
- Anything shown that a maker did not make is what it is, in the structure
  itself, not just in a label: a Shadow is a person's own work; a thing built
  with AI's help says so; a path, a bridge, or a way of arriving that the
  system drew is never credited as anyone's Shadow, never enters a Whoeuvre,
  never sparks. AI may build the roads between ideas; it may not stand in
  for one.
- Nothing shown is ever a random draw standing in for the real thing. Motion
  can feel like more than it is; what a hand's release settles on is always
  whatever is truly nearest, never a roll made to look like a find.

## Settings (Vercel → Project → Settings → Environment Variables)
| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Enables donations and "help it continue" via Stripe Checkout (`/api/donate`). |
| `NEXT_PUBLIC_DONATE_URL` | Optional hosted donation link (Stripe Payment Link, Ko-fi) for general support. |
| `DATABASE_URL` (or `STORAGE_URL`, `POSTGRES_URL`) | Postgres (Neon) for posted Shadows, notes and reports. Connecting a Neon store in Vercel sets it. |
| `GOOGLE_CLIENT_ID` | Sign in with Google (from Google Cloud → APIs & Services → Credentials → OAuth client ID, type "Web application"). |
| `GOOGLE_CLIENT_SECRET` | The same client's secret. |
| `SESSION_SECRET` | 32+ random characters; signs the login cookie. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Anonymous notes at a seal (Vercel → Storage → a Redis/KV store sets both). |
| `OWNER_EMAILS` | Comma-separated Google emails that own the Canvas (they see everything on it). |

Without `STRIPE_SECRET_KEY`, donation buttons say "Donations are not switched on yet".

### Sign in with Google
In the Google OAuth client, add these **Authorized redirect URIs**:
`https://twinth.ink/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google`
for local work). Sign-in is stateless: a signed httpOnly cookie holds the name,
picture and owner flag; nothing else is stored, and the email never reaches the page.
Until all three Google/session variables are set, "sign in" does not appear.
Support given toward a specific idea is recorded in Checkout metadata (`shadowId`);
paying creators directly needs Stripe Connect (not built).

### Posting
With a database and sign-in both set, anyone signed in can cast a Shadow that is
kept on the server. It is private until its maker taps "share it with everyone";
shared ones appear to all in the ring "from everyone", and your own in "yours".
A maker can keep it to themselves again, let it go (deleted), read the notes left
at its seal, and move a Shadow kept on their device online ("put it online").
Anyone can report a shared Shadow; an owner (`OWNER_EMAILS`) can take one down
(hidden, not deleted). Three taps on your own Shadow opens it; on someone else's,
its seal takes an anonymous note for them. Only a first name is shown and only the
account id is stored. Tables (`tt_shadows`, `tt_notes`, `tt_reports`) are created
on first use; limit 20 posts a day per person. Without a database, casting stays
on the device as before.

### Pictures and films in posts
A maker adds up to six pictures or films to their own Shadow ("add a picture",
"add a film"). Pictures are made small on the phone and kept in Postgres
(served from `/api/media/<id>`, private ones only to their maker). Films go
straight from the phone to Vercel Blob and appear once the project has a Blob
store: Vercel → Storage → Create → Blob → connect to this project, which sets
`BLOB_READ_WRITE_TOKEN`. Until then "add a film" does not appear. Letting a
Shadow go removes its pictures and its films.

### Sending and building on
"send it" shares a link (`/canvas?at=...`) that arrives at that thing and unfolds
into a preview card drawn in ink (`/canvas/og`). "build on it" makes your own
Shadow from someone's shared one; it says what it was built on and whose it was,
and a rose thread joins them in the flight.

### Today's word
One word a day for everyone (`src/lib/shadowfield/prompts.ts`, changing at
midnight UTC). Its ring is the newest thing on the Canvas; "today's word: …"
answers it, and answers are shared under the maker's first name.

### Makers and sound
"from everyone" holds one ring per maker (first name only), gathered by a keyed
one-way key (`makerKey`), never an account id; stories have none. Turning one
film's sound on keeps films heard: each film you arrive at speaks and the last
falls quiet, until you turn a film's sound off.

### The web that moves
A spider knows food is there because the web moves (`src/lib/shadowfield/web.ts`).
The thread and the tunnel tremble toward what is waiting for you, and the compass
needle twitches while its rose dot points there: work built on yours (rose), work
built on something you kept (rose), new work by a maker whose ring you stayed in,
answers to today's word, and faintly what is new since your last visit (never on a
first visit). Views and popularity never move it. Plucks come often at first, then
slow to a hum; they hush while sound plays, while you read, or while a panel is
open; no more than three at once. A scroll or a held key stops at what is waiting
(until the hand pauses); arriving there is a catch, and staying 1.2s (or tapping it)
finds it, so it stops trembling. Hold still on empty paper (or press Space) to pluck
the web yourself; the compass's rose dot, or "n", takes you to the nearest. Once
everything that moved is found, the tunnel breathes out and goes still: caught up,
with no words or numbers. What you found, and which makers you stayed with, is kept
only on your device (`twinthink.web.v1`: ids and times).

### The tunnel
The flight runs inside an ink tunnel (`drawTunnel` in flightRender.ts) that winds toward what comes next, fades to a whisper at rest, and carries waves toward you while a song or film is heard: rings
from the vanishing point, strands that spiral with the clock, dots that stream
into lines at speed.

### Sketchbooks
Signed in, "keep it" keeps anything shared in your own sketchbook (a ring only
you see, stored as places on the Canvas in `tt_keeps`); "go to it" flies to
where it lives. Nothing sealed, private or on a device is ever shown there.

### Story time
Signed-in people tell true stories of making do ("tell a story"), shown to
everyone in the ring "story time" with no name at all (the teller's account id is
kept only so they can take it back; it never reaches any page). A story cannot be
rewritten. Anyone signed in can answer one with "there's an idea in this": that
makes a private Shadow of their own that remembers the story, and the story shows
how many ideas it has sparked. House rule, shown as the story is written: no one's
real name, nothing that hurts anyone. A signed-in report counts once per person
(kept only as a one-way hash); three reports hide a story until an owner looks,
and owners can take anything down.

## Plots (3 x 3)
The Canvas grid (cells of 1/8) is tiled into plots of 3 x 3 cells (`plots.ts`).
Today only the founder holds plots: the block containing each public idea.

Planned, not built:
- Early members receive an open plot; more can be **bought** or **earned**.
- Earning counts only server-timestamped, hash-chained work (`apps/api/shadows.py`
  on the `master` branch): returning to an idea over weeks, revisions, evidence.
  Likes and follows never count, so bots cannot farm plots quickly.
- A plot holds related ideas; feedback inside it is a *challenge* (thesis ->
  antithesis -> synthesis), not a like.
- Plots show only ideas or real R&D bounties, never logo banners.

## Forks
A fork is a named space a maker opens inside their own Shadow, for others to
travel into, and, by its own rule, post inside (`tt_forks`, `tt_fork_access`
in `store.ts`; `/api/forks`). Only its own maker opens one, moves it to
another Shadow of theirs, or closes it. A fork's own rule decides who may
post there: anyone signed in, or only whoever has followed its invite link
(kept only as a one-way key, the same shape as a maker's own). Closing a fork
takes no new posts, but it and everything already inside it stay exactly as
they were; moving it carries its history with it, untouched. A post made
inside a fork still starts private and is shared the same way as anywhere
else: being inside a fork is only where something sits, never whether it is
seen. Each maker has room for a bounded number of forks at once
(`FORK_ROOM_MAX`), closed ones included, since what a fork holds keeps taking
real room even while quiet.

Built now, end to end: a fork shows in the flight as a real gate once it
holds anything (the same `gate = has real children` rule as any ring; an
empty fork holds its place but is not yet something to travel through), with
its own name, its line ("open by invitation", "closed now: what was made
here stays"), and titles/phases exactly like everywhere else. The compose UI
lets a maker open one from their own Shadow ("open a space here", with the
room they have left shown alongside it), see and copy its invite link,
close and reopen it, and post inside any fork whose rule currently allows
it; a signed-in-but-new invite link is spent automatically once the visitor
signs in, wherever they were, and dropped from the address bar. Breadcrumbs
are real too: dwelling at a fork's own gate without going in marks it, on
this device only (`web.ts`'s `passed`, ids only, never sent anywhere); the
compass ("n", or its rose dot) leads back to it once nothing else is
waiting, and going in clears it.

## Pressure
Separate from resonance on purpose: resonance is the same one person coming
back to a thing on another day; pressure is many different falls reaching
the same wall and turning back. A fall reaching the last thing inside a
fork, then hopping back out rather than continuing, marks that fork's own
one-way, anonymous count for the day (`tt_pressure`, `pressure()`/
`markReached()` in `store.ts`; `/api/pressure`, the same shape as
`/api/resonance`, kept for two weeks rather than a season since this is
about now, not a lasting presence). Once enough separate falls have
reached it lately (`GATHERING`), its own line quietly reads "something is
gathering here." instead of its usual line, the same felt, numberless way
dew already works. Nothing is shown until real pressure exists; nothing
is ever a count.

This is the seed of the shape the navigation layer should keep: person
travels → reaches a fork's end or passes it without entering → an
anonymous, aggregate signal forms → once it's real, something is quietly
shown → a human (or later, with a clear reason shown and nothing done
without one, Rabi) can use the *existing* fork system to open a route
there. No second kind of hole, no generated content, no topology that
moves on its own. Dew ("carry this forward") and Drop ("I wouldn't carry
this forward") are a different question entirely (an idea signal, not a
navigation one) and stay out of this layer.

## Rabi, noticing (not yet acting)
The first, deliberately small step: once pressure at a fork passes
`ROUTE_CANDIDATE` (a stronger bar than the ambient "gathering" line),
its own maker, and only them, may be shown a plain notice: never the
exact count (sparse traffic can still make an individual inferable),
only the qualitative fact ("Several recent Falls reached [it] and
continued elsewhere."), an honest "why am I seeing this?" that explains
the threshold and rule instead, and three choices, nothing more —
**open a path**, **leave it**, or **watch** (`tt_rabi_log`, `noticeFor()`/
`logNoticeShown()`/`logNoticeAction()` in `store.ts`; `/api/forks/[id]/notice`).

The three choices carry real, different semantics, not three flavors of
dismissal:
- **Open a path** only means "take me to the composer." Clicking it is
  never counted as agreement by itself — only actually creating a fork
  afterward is. The funnel is tracked in full: `notice_shown` →
  `open_path` (the click) → `composer_opened` (the composer actually
  appeared) → `fork_created` (a fork was actually made, carrying the id
  it links back to) — so someone who opens the composer, thinks about
  it, and backs out is correctly *not* counted as Rabi having been
  right (`logFunnelEvent()`, `ShadowField.tsx`'s `actOnNotice`/
  `submitComposer`).
- **Leave it** means "I intentionally want this dead end." It is
  suppressed until pressure grows to roughly double (`LEAVE_GROWTH`)
  what it was when decided.
- **Watch** means "don't change anything, but tell me if this becomes
  materially stronger." It re-notifies at a much lower bar — about 1.3x
  growth (`WATCH_GROWTH`) — so it is meaningfully more sensitive than
  Leave, not merely a softer version of it.

`Open a path` alone keeps a flat, time-based cooldown (a week) rather
than a growth floor, since clicking it already tells you the maker was
willing to look; the open question there is only whether something is
still gathering, not whether it grew. Every showing and every decision
is logged, so whether pressure is actually useful to a maker — and,
now, whether being shown it actually leads to something made and kept —
is a real, answerable question before anything is asked to act on its
own. Other people's attention can gather around someone's work; it
never earns them the right to change it just by accumulating there.

Deliberately not built yet, per the same discipline: whether a path
made this way is later actually used by other falls. That is a real
next signal (did Rabi identify a missing route, or just talk someone
into making one?) but a separate measurement from this funnel, and is
left for once this one has run long enough to trust.

## Fall with me (V1)
Two signed-in people travelling one Fall together: an overlay on top of each
person's own Fall, never a second kind of one (`tt_shared_fall`, deliberately
not `tt_falls`). One leads (`hosting`), moving it; the other follows,
independently, on their own local camera. V1 is deliberately small: **Fall
with me → Join → Lead/Follow → Leave.** No Pause (a leader simply not moving
already is one), no Switch lead, no peel off/rejoin, no fork-lean visuals,
no Dew/Drop overlap (Dew/Drop as an idea-judgment reaction is not built
anywhere yet, in or out of this feature).

Only the leader's current place is ever kept server-side (`station_id` on
`tt_shared_fall`, overwritten in place, never appended to): a follower's own
position is never collected at all, not even briefly. Presence is
join-only (`tt_shared_fall_participant`): who is in it, not where they are
or how they got there. Nothing about hesitation, timing, or a path not
taken is ever stored; there is nothing to leak because nothing more than
"who's in it" and "where is the leader" was ever written down.

Sync is a plain poll (`/api/shared-falls/[id]`, ~800ms), not a socket: the
leader publishes a content id (the same ids `findPath` already resolves),
and a follower's own client calls the same local `flyTo`/hop it already has
for any navigation — the flight's own spring smooths over the poll cadence,
the same way it already smooths a single person's own hops. If the leader
moves somewhere a follower's own `/api/shadows` response never included
(still-private work, or content behind a closeness/disclosure level they
have not earned), the follower is never moved there: "*[name] moved into a
path you can't enter.*", holding at the nearest place they can actually see.
Shared reference never overrides one person's own disclosure.

Each participant is recognisable within one shared Fall only
(`mark(fallId|sub)`, truncated): a different token in a different shared
Fall, on purpose, so this is not a lasting cross-session fingerprint. A
Whoeuvre-linked, carried-between-sessions signature is a later, deliberate
choice, not a default.

Visually: no avatars, no literal spiders. Presence draws as a small, cool
glint (`PRESENCE`, its own tone, never confused with resonance's warm dew)
right at the thing itself, wherever the shared Fall currently is — not a
trail of where anyone has been, only that someone else is there, right now.

## Lean: a deliberate choice at a branch
The existing "lean" in `flight.ts` is passive camera physics: it drifts
sideways toward whatever comes next in the fixed, sequential order the
track already visits everything in. It was never a choice, and passing
through a thing in that ordinary sequence still isn't one.

A deliberate Lean is a separate, new thing: at any branch (a thing with
two or more paths ahead, wherever that occurs on the Slate, not tied to
the maker-created `tt_forks` gates), directly picking one of them out of
sequence (a tap, or its screen-reader equivalent, the "Ideas here" list)
is recorded on this device only, one choice per branch, replaced by a
later choice there (`web.ts`'s `leaned`, `markLeaned()`/`leanedChildOf()`).
Nothing about it is ever sent anywhere. Scrolling or swiping through the
ordinary sequence never records one, however far it goes or however long
it lingers; only an out-of-sequence pick does.

Returning to the same branch marks which path was actually taken last
time (a plain word in the screen-reader list; a single still rose fleck,
reusing the ink's own existing "this is yours" tone, at the thing itself
on the Canvas) while leaving every other path exactly as open as before:
choosing one, returning, and taking the other both work, plainly, every
time.

Verified with new store-free tests for the on-device memory itself, and a
Playwright pass confirming, on two ordinary sibling Twins: scrolling past
both records nothing; deliberately choosing one actually moves the
visitor and is marked on return; choosing the other afterward replaces
the record (not both at once) and never closes off the first.

A choice you cannot see is not a choice, so the other paths now wait at
the edges of the view (`edgePaths()`/`drawEdge()` in `flightRender.ts`):
standing on one of several paths, the nearest one before it sits half in at
the left and the nearest one after it at the right, like the next book
cover sliding in. Each is its own picture blurred (the renderer's existing
coarser copies, no CSS filter), or, with no picture, a ring silhouette,
inside a dotted outline that says "somewhere you can go." Never its title:
that resolves only once it comes to the middle, the same way every title
already does. They are faint while falling and fuller once still; pointed
at, one slides further in and comes clearer; tapped, it is a Lean, and the
Slide goes there. The one chosen here before is outlined in rose. Nothing a
viewer may not enter is ever glimpsed; the next path they may enter is
shown instead. They sit below the compass on both phone and desktop.

This borrows the anticipation of a reveal and deliberately refuses what
makes a loot box a loot box: a path always reveals the same thing, only
the visitor's own Lean or approach reveals it (never a timer), and nothing
is held back to make anyone return.

Deliberately not built: any aggregate, "others leaned this way too"
signal. That would need its own privacy design (this is a personal,
on-device record, not even pseudonymous) and is a separate, later
question from whether Lean itself is worth having at all.

## Next
1. Switch lead: the first addition after V1, once "Fall with me" is shown
   to actually feel better than sending a link or sharing a screen. This
   is what turns "watch my Fall" into a genuine co-op Fall.
2. Co-op rights: someone besides a fork's own maker managing it.
3. Plot claims + earning rules above (still planned, not built).
4. Rabi proposing (not just noticing): only once makers show, in the
   logs above, that they actually want this. Still never autonomous,
   still only ever through the fork system that already exists.
