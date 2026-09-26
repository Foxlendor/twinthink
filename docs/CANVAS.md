# The Canvas (twinth.ink/canvas)

The Canvas is TwinThink's spatial medium. Engine: `apps/web/src/lib/shadowfield`,
UI: `apps/web/src/components/shadowfield`. Tests: `cd apps/web && npm test`.

## The flight (default)
Scrolling moves *you*, not a page. The whole Canvas is one endless stream in
depth (`flight.ts`, drawn by `flightRender.ts`): things wait small near the
vanishing point, grow as you move toward them, resolve into what they are
(a song's waveform, a film, a 3D object, a session's constellation) and slide
out past the edges, behind you.
- Scroll down / swipe up / spread two fingers: forward. The other way: back.
  A flick carries you through many things; coming to rest, one settles into focus.
- Drag sideways to look around. Tap anything to go to it. Keys: arrows, Esc.
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
  feeling behind each idea; no gauges, dates, counts or brand marks in the flight.
  His name is written into the paper at arrival; each verb leads to its evidence.
- No invented content or history on the public Canvas.
- Very little text: names; one line for the thing in front of you, only while
  you are still. Activity is shown (heartbeats, constellations, ripples).
  TwinThink's own sessions are named by the hours they were lived, on his clock
  ("all through the night"), never by dates.
- Gifts never sit next to an ask for money; nothing is counted.
- Private by default. Nothing a visitor makes is published.

## Settings (Vercel → Project → Settings → Environment Variables)
| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Enables donations and "help it continue" via Stripe Checkout (`/api/donate`). |
| `NEXT_PUBLIC_DONATE_URL` | Optional hosted donation link (Stripe Payment Link, Ko-fi) for general support. |

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

## Next
1. Connect Shadows to the server log so visitors can opt in to share (private stays default).
2. Accounts + plot claims + earning rules above.
3. Server-side disclosure: send each viewer only what their closeness allows.
