# Start here

For a person with no prior knowledge of TwinThink. After reading this you should know what the
project is, what exists today, how the major parts fit together, and where to look next.

Everything here was checked against the repository at commit `5122686` on `main` and `40ad2cc`
on `fall-space`, on 30 September 2026. Anything newer than those commits may have moved on. When
this page and the repository disagree, the repository is right and this page needs fixing.

Where two documents disagree, this page says so instead of choosing. Five status labels are used
throughout:

- **live**: on `main` and running at twinth.ink;
- **preview**: exists on a branch and shows only on preview deployments, never on the real site;
- **parked**: unfinished work kept for reference, not to be built on;
- **proposed**: written down as direction, not decided or not built;
- **legacy**: an older name, model or branch that has been moved past.

Two names come up constantly. **John** is the project's owner and the person who decides names
and product direction. **johne.boi** is his name on the site; the live Slate is his body of work.
**Agents** means AI coding agents working in this repository; `AGENTS.md` is written for them
and for human contributors alike.

## 1. What TwinThink is

A **digital twin**, in the usual sense, is a computer model of a real thing, like a jet engine or
a building, that stays in step with the real one. TwinThink started from a problem with that
idea: you cannot make a faithful twin of something you do not understand in context. A copy of a
file is not a twin. A list of parts is not a twin. To twin a thing faithfully, the system has to
keep enough context for the thing to stay understandable:

- what it is,
- what it is related to,
- where it came from,
- how it changed,
- who created or influenced it,
- what evidence supports claims about it,
- what rights or authorship apply to it,
- and what human work grew from or around it.

Engineering is one domain where this is easy to see, because machines have parts, revisions,
tests, materials and provenance. The larger goal is the same contextual understanding for ideas,
creations, knowledge and other kinds of things. A song, a dance, an invention or an idea can have
a twin in this sense: not a copy of it, but the kept context that makes it understandable.
Engineering is one domain running on the protocol, not the definition of TwinThink.

> Wikipedia can describe a thing; a Twin can contain the history of the thing becoming real.

The short form: **TwinThink gives the internet depth.** Most of the internet is flat, a feed or a
list of results, with no memory of how anything came to be. TwinThink lets you move through how
things connect, and keeps the history, relationships and provenance that make a thing
understandable. In this page, a capital-T **Twin** means one thing's kept context in that sense.

Five words carry the whole project. Each is defined in `AGENTS.md`; this is the plain version.

| Word | Plain meaning |
| --- | --- |
| **TwinThink** | The whole system. The internet with depth. |
| **Shadow Slate** | The spatial place where a person experiences TwinThink. Live today at twinth.ink. "The Slate" on this page means the same thing. |
| **The Fall** | Moving through connected knowledge, human work and relationships, instead of down a flat list. The Fall turns curiosity into a path. |
| **Whoeuvre** | One person's accumulated work, ideas, history and contributions, as a place you can enter. The word is "who" plus "oeuvre", a body of work. |
| **Twin protocol** | The infrastructure underneath: identity, provenance, signed history, evidence, rights, portability and continuity. |

What you would see today: the Slate is a quiet, monochrome page, ink on paper, where one maker's
songs, dance films, moments and inventions are laid out in time. You move through them with the
scroll wheel or a swipe, but the motion carries you deeper into a place, one thing at a time,
rather than down a list. Anyone can move through it. A signed-in visitor can post their own work
(private by default) and appears as their own ring in "from everyone".

## 2. What exists today

### Production (live, branch `main`)

- **The Shadow Slate** at [twinth.ink/slate](https://twinth.ink/slate): johne.boi's Whoeuvre as a
  spatial place. Its groups are HEX Lab (his inventions and projects, including TwinThink itself),
  his songs, his dancing, and moments.
- **Signed-in features on the Slate:** posting ("cast a shadow", private by default); keeping
  others' work in a private sketchbook; opening a bounded contribution space on your own work,
  called a fork, with an invite link; anonymous notes to a maker; "Fall with me", two signed-in
  people in one Fall with one leading; a replay of your own visit called "your Fall"; and two
  reactions, "carry it forward" (Dew) and "let it drop" (Drop), kept on your device only.
- **Sign in with Google**, donations through Stripe, images in Postgres, films in Vercel Blob,
  anonymous notes in Postgres or a Redis store.
- **The Twin protocol backend** (`apps/api`, `packages/twinthink`) is on `main` but its
  deployment is not recorded anywhere in the repository. It is a FastAPI service and Python
  library for Twin documents, bills of materials, signed revisions, provenance, capabilities,
  `.twin` bundles and a per-subject continuity log. It runs in local mode with SQLite; a cloud
  mode exists in the code but several of its routes call local-only helpers. A leftover script at
  the repository root points at a Render URL. The web app does not call it (see section 3).

### Preview / experimental (branch `fall-space`)

- **`/fall`**: the current prototype of The Fall, on preview deployments only. Search for a
  subject, enter it, and move through real relationships from Wikipedia and DBpedia. Three
  maker-authored links (called bridges) connect pieces of johne.boi's work to articles.
- The code on `fall-space` implements an older continuous model (hold to stop, settle when idle,
  lean at splits). That model is **superseded** by the two-state model in section 10, which is
  not yet implemented on any branch you should use.
- Its docs live in [`docs/FALL_SPACE.md` on that branch](https://github.com/Foxlendor/twinthink/blob/fall-space/docs/FALL_SPACE.md).
  To see how far the branches have diverged, run
  `git rev-list --left-right --count origin/main...origin/fall-space`.

### A standing hold

`docs/CORE_LEDGER.md`, under "Next, in order", records a hold from 28 September: no code changes
to the Slate until John brings back results from three in-hand tests. The repository does not
record that hold being lifted. Work on `fall-space` continued after it, on `/fall` only. Ask
before changing the Slate.

### Parked work (do not treat as current)

- `fall-located-rename-wip` and `fall-located-wip`: two drafts of the Traveling / Located rewrite
  of `/fall`. The first does not compile; the second uses old names throughout and its own
  commit message says it is awaiting John's decision. John has assigned this work to a specific
  session; do not build on these branches, merge them, or start a parallel rewrite without his
  explicit approval.
- `claude/twinthink-prototype-restart-fwcige`: a standalone "Drop" prototype of the 28 September
  motion model recorded in the ledger. That model is superseded by section 10. Kept as evidence
  and for a few reusable pieces.
- `deploy-platform`: a depth-visibility experiment and an older fork / lean / breadcrumb
  prototype. Superseded; likely does not type-check.
- `feat/twin-core-schema-ingestion`: August work on schema ingestion for the protocol, far
  behind `main`. It holds the only CI workflow ever written for this repository.
- `fix/shared-fall-notice-overlap`: two small Slate commits (keep notices from overlapping;
  show a confirmed shared-Fall join to both participants). Never merged. John decides.
- Seven branches with no commits beyond `main` (`preview`, `clarity-pass`, `continuity-readme`,
  `chore/no-dashes`, `hotfix/vercel-nextjs-preset`, `work/twinthink-foundation`,
  `privacy/public-surface-cleanup`) are fully merged.
- Any branch not named on this page has not been reviewed and is not safe to build on.

### Proposed but not built

- **Rabi** in its canonical role (section 7). What exists under that name today is a pressure
  notice to fork makers on the Slate.
- **Going deeper into a subject** in The Fall (the study view described on `fall-space`).
- **Multiplayer for The Fall** (documented on `fall-space`; "Fall with me" exists only on the Slate).
- The ledger's "Proposed 28 Sep, not decided" section: Current as an allocatable resource,
  desire paths, raids, reservoirs and related ideas. Recorded as direction only.
- **Plots** (a 3 x 3 grid, buying and earning space), **creator co-op rights**, **aggregate Lean**
  ("others leaned this way too"), **Stripe Connect**. All marked planned or open.
- **Richer Whoeuvre relationships** in The Fall (grew from, contradicts, became, abandoned for).

## 3. The mental model

From a visitor's point of view:

```
TwinThink                     the internet with depth
├── Shadow Slate              the place you enter
├── The Fall                  how you move: through relationships, not a list
├── Whoeuvre                  whose work you are moving through
└── Twin protocol             what should make it durable and trustworthy
```

How they relate:

- **The Shadow Slate and The Fall are where context becomes understandable.** On the Slate you
  are inside one Whoeuvre. In The Fall you move along real relationships between subjects,
  including the human work that grew around them. Discovery comes from Traveling. Understanding
  comes from being Located (both defined in section 7).
- **The Whoeuvre preserves the human origin of that context.** A song, a dance, an invention, a
  thought: each stays attached to the person who made it, with credit that is explicit and
  relationships that the maker authored.
- **The Twin protocol is what should make that context durable, attributable, portable and
  trustworthy.** Identity, signed history, provenance, evidence, rights, `.twin` bundles and the
  continuity log exist so that "this is what the thing is and how it became so" can be checked,
  not just asserted.

**Today these layers are only partially connected in code.** The Slate stores its things in its
own Postgres tables. No subject a visitor meets on the Slate or in `/fall` has a Twin document,
a signed revision chain, a provenance ledger or a continuity log behind it. The web app never
calls the Twin protocol API. The README's phrase "the experience runs on a protocol" describes the
intent, not the current wiring.

Where each kind of context from section 1 is kept today:

| Context | Where it is preserved today | Visible to a visitor? |
| --- | --- | --- |
| What a thing is | Slate posts and sources; Twin documents in the protocol; Wikipedia summaries in `/fall` | Yes |
| What it is related to | Grew-from links on the Slate; DBpedia relationships and bridges in `/fall`; manifest relationships in the protocol schema (unused) | Yes on the Slate and in `/fall` |
| Where it came from, how it changed | Signed revision chain and continuity log in the protocol; a replay on the Slate built from git history for TwinThink itself | Only the replay, and only for one subject |
| Who created or influenced it | Credit lines on the Slate; Ed25519 identities in the protocol | Credit lines only |
| What evidence supports claims | Test telemetry and claims with evidence paths in the protocol | No |
| Rights and authorship | Rights policy and capabilities in the protocol library (declared, not enforced); disclosure levels and private-by-default on the Slate | Privacy yes, rights no |
| Human work that grew around it | Bridges and Rose currents in `/fall`; "build on it" credit on the Slate | Preview only, plus credit |

Three gaps follow from the premise in section 1. They are recorded here as architecture to
solve, not as isolated bugs, and this page does not fix them.

1. **Inferred relationships appearing as named Currents without authored provenance.** In
   `/fall`, inside a Whoeuvre, the adapter in `apps/web/src/lib/fall/whoeuvre.ts` on `fall-space`
   turns a shared rare word into a "goes with" Current and time proximity into a "made alongside"
   Current. Both are machine-derived, yet they appear with a stated reason as if authored. The
   authored link kinds "challenges" and "resolves" are dropped. Check the file before relying on
   this description.
2. **Weak protocol enforcement around auth, rights and provenance.** The bundle export, revision
   posting, identity upsert and capability endpoints in `apps/api/main.py` need no owner token.
   Rights policies and capabilities are declared in the library but nothing enforces them. The
   continuity log is hash-chained but unsigned. When a Twin has no revisions, the bundle export
   signs a first revision with the server's own key under the creator's name.
3. **The experience layer not yet attaching encountered subjects to actual Twin records and
   history.** See the paragraph above the table.

TwinThink is **not** primarily an engineering tool, a collaboration workspace, a graph viewer or a
social feed. Those readings all appear somewhere in the repository's history; none is the
current purpose.

## 4. Architecture map

Adjusted to what the repository actually contains. Items in brackets are status notes.

```
TwinThink
├── Experience                       apps/web  (Next.js, Vercel)
│   ├── Shadow Slate                 /slate               [live]
│   ├── The Fall                     /fall                [preview only, branch fall-space]
│   └── Whoeuvre                     /whoeuvre/<name>     [live, redirects into the Slate]
│
├── Knowledge / relationships        [used by /fall only]
│   ├── Wikipedia                    summaries, search, first revision date
│   ├── DBpedia                      relationships, queried from the browser
│   └── Bridges                      maker-authored links from a Whoeuvre piece to an article
│
├── Twin protocol                    apps/api + packages/twinthink  (FastAPI, Python)
│   ├── Identity                     Ed25519 keypairs, did:twin identifiers
│   ├── Provenance                   provenance ledger inside a bundle
│   ├── Signed history               revision chain, verified on import
│   ├── Evidence                     test telemetry, claims with evidence paths
│   ├── Rights                       rights policy and capability tokens  [library only, not enforced]
│   ├── Portability                  .twin bundles, export / verify / import
│   └── Continuity                   append-only, hash-chained log per subject  [local mode only]
│
└── Domains
    └── Engineering                  packages/twinthink/bom, simulation, factory, reality
        ├── BOM                      hierarchical bill of materials, cost rollup, product-passport tiers
        ├── Simulation               thermal and flow model for one physical fixture (a heat-storing straw)
        └── Calibration              fitting the model to measured telemetry
```

The Experience column and the Twin protocol column are not connected (section 3).

## 5. Where the code lives

**`apps/web`** (product UI). The Next.js app that serves twinth.ink. Read the warning at the top
of `AGENTS.md` first: this Next.js version differs from older ones. The Slate client is one large
component, `src/components/shadowfield/ShadowField.tsx`, with its rules and geometry in
`src/lib/shadowfield/`. A thing on the Slate is an `IdeaNode` in `src/lib/shadowfield/model.ts`;
hand-written content lives in `src/lib/shadowfield/sources/`; `world.ts` assembles them with
posted work. Server routes under `src/app/api/` handle posts, forks, keeps, notes, media,
pressure, resonance and shared Falls. Their SQL and the `tt_*` tables are in
`src/lib/shadows/store.ts`; sign-in is in `src/lib/auth/`; the notes fallback store is in
`src/lib/notes/`. On `fall-space` this folder also holds `src/lib/fall/` and
`src/components/fall/`.

**`apps/api`** (backend, Twin protocol). A FastAPI service: `main.py` for Twins, revisions,
identities, capabilities, bundles and tests; `continuity.py` for the continuity log; `tt.py`, a
command-line client of the same library. Local mode uses SQLite under `apps/api/storage/`. Its
routes live under `/api/twins/...` and `/api/continuity`, a different `/api` from the web app's
own routes. Look here for how a Twin is stored, signed, exported and verified.

**`packages/twinthink`** (protocol library, Python). `schema.py` (the Twin document model),
`validator.py`, `crypto/` (identity, revisions, capabilities, envelopes, bundles), `service.py`
(the lifecycle used by the CLI and the MCP server; `main.py` does not use it), `bom/`,
`factory/`, `reality/`, `simulation/` and `mcp/`. Look here for the protocol itself, and for the
engineering domain modules.

**`schemas/v0.1`** (protocol, declarative). JSON Schemas for a Twin and a manifest. No code
loads them today, and they have drifted from the Python models. Treat them as an early statement
of intent, not as the enforced contract.

**`docs`** (documentation). Listed in section 9. `docs/FALL_SPACE.md` exists only on
`fall-space`.

**`fixtures`, `scripts`, `art for twinthink`** (domain samples, tooling, assets). Sample Twin
bundles (a heat-storing straw, a valve, a root twin, invalid cases), the scripts that regenerate
them, a script that starts both apps, an end-to-end verifier for the API, and a script that builds
TwinThink's own history from git. Three loose files at the repository root (`upload_test.py`,
`scratch_update.py`, `neon.ts`) are leftovers; the first posts a fixture to a production URL and
should not be run.

## 6. Important routes and surfaces

| Route | Status | What it is |
| --- | --- | --- |
| `/` | live | Front page: a few words and the way in. |
| `/slate` | live | The Shadow Slate. `?at=` opens a place; `?who=` opens someone else's ring. `/slate/og` serves its preview image. |
| `/whoeuvre/<name>` | live | Redirects into the Slate: johne.boi's Whoeuvre is the Slate itself; anyone else's is their ring in "from everyone". |
| `/whoeuvre/johne.boi/hex-lab` | live | Redirects to the HEX Lab group on the Slate. |
| `/support` | live | Donations. |
| `/api/shadows`, `/api/forks`, `/api/keeps`, `/api/notes`, `/api/media`, `/api/pressure`, `/api/resonance`, `/api/shared-falls`, `/api/films`, `/api/donate`, `/api/auth/*` | live | The Slate's own server routes. Not the Twin protocol API. |
| `/fall` | **preview only** | The Fall prototype, on `fall-space`. The page returns not-found when the deploy environment is production. On `main` the route does not exist. |
| `/canvas`, `/canvas/og` | legacy | Permanent redirects to `/slate` and `/slate/og`. |
| `/roundup`, `/bounties`, `/explore`, `/pitch`, `/create`, `/archive`, `/capsule/*`, `/twins/*` | legacy | Temporary redirects to `/slate`. |
| any other one- or two-segment path | live | Redirects to `/slate`. |

Sample content (invented makers and works) shows only on preview and development builds off the
production host. The gate is client-side; see section 11.

## 7. Canonical terminology

A human contributor uses these terms, from `AGENTS.md`, in docs, UI, routes, comments and
explanations.

| Term | Meaning |
| --- | --- |
| Subject | The thing being encountered (Phonograph, Drinking straw, SipSmolder). Not "node". |
| Subject region | The space around a subject. Not room, chamber or node. |
| Relationship | A real connection between two subjects. |
| Current | The traversable form of a relationship in The Fall. |
| Traveling | A current is carrying you between subjects. |
| Located | You have arrived at a subject and stay until you choose to leave. |
| Lean | The direction of attention and steering (thumb, mouse, keys). |
| Route | The path you actually took through The Fall. Not a URL. |
| Look Back | The deliberate outside view of the route. |
| Rose current | A human-authored (Whoeuvre) relationship, in the same space. Rose is the colour the Slate uses for human credit. |
| Rabi | The part of the system that decides when and where real information becomes perceptible. Not a recommender. |
| Continuity | Tamper-evident history of a subject. Not multiplayer session history. |

Three layers stay apart: product language (TwinThink, Shadow Slate, The Fall, Whoeuvre, Rabi),
interaction language (the table above), and implementation language (renderer, cache, subject id,
DBpedia query, relationship strength, component, state). Implementation words never become
product words without asking.

**Metaphors are allowed for explanation, but metaphors are not architecture.** Tube, tunnel,
river, eddy, wall, seam, web and strand describe how something looks or behaves. They never become
product nouns, modes, files, types or diagrams. John names concepts; agents name variables.

Legacy names still exist in filenames and identifiers (section 8). Older documents also use words
that are not in this table, and some canonical words with a different meaning. These are open
until John settles them:

- **Shadow Slate.** `AGENTS.md` calls it "the primary spatial interface" and `README.md` "the
  spatial interface". `docs/CORE_LEDGER.md` calls Shadow Slate "the deep, spatial layer" with
  "the Slate" as its surface. `docs/CANVAS.md` never uses the term. This page follows `AGENTS.md`
  and treats `/slate` as the Shadow Slate.
- **Lean** means steering here. In `docs/TWINTHINK_CORE_SPEC.md`, `docs/CORE_LEDGER.md` and
  `docs/CANVAS.md`, a Lean is a deliberate committed choice, and steering is explicitly not a
  Lean. The Slate's code records the committed choice. Either way, none of it is sent anywhere.
- **Rabi** here allocates perceptibility. The spec calls Rabi an architect of routes and says that
  requirement was not withdrawn; the Slate's built "Rabi" is a pressure notice to fork makers;
  the ledger's proposals have Rabi managing allocation. `AGENTS.md` holds the current definition;
  whether the spec's architect role survives is John's call.
- **Current** here is a relationship you can travel. The ledger's proposals also use it for a
  crowd of people and for a currency. Those uses are proposals, not vocabulary.
- **Drop** is a reaction on the Slate and, in the ledger's 28 September section, also the moving
  body. Same word, two things.
- **Twin.** `docs/CANVAS.md` and the Slate's code call individual posted items Twins. On this page
  a Twin means a thing's kept context (section 1). No Slate item has a Twin document behind it.
- `README.md` names Dew, Drop and "the Trail" as mechanics. Dew and Drop are the two reactions.
  "The Trail" is defined nowhere; the canonical word for the path taken is Route.

## 8. Legacy names and historical baggage

`ShadowField`, `shadowfield`, `ShadowField.tsx`, `lib/shadowfield/`, `docs/CANVAS.md`, the
`tt_shadows` table and "cast a shadow" in the UI are legacy implementation names from when the
Slate was called the Shadow Canvas and then the Shadow Field. They may stay in code for
compatibility. Do not use them to infer the current product vocabulary, and do not rename them
casually; any cleanup is a separate, audited change.

Older branches and documents reflect superseded models:

- `master` and the branches cut from it (`shadow-field-z`, `feature/shadow-canvas`,
  `feature/xyz-semantic-depth`, `feature/public-inventor-archive`) diverged from `main` at commit
  `88592d7` and were never merged. `main` renamed the Shadow Field to the Slate and moved past
  that lineage. Those branches still hold unmerged commits, including one that removed leaked
  planning scripts; the auth fix from that commit is on `main`, the script removals are not.
  Legacy; do not build on them.
- `docs/SHADOW_PROTOCOL_0_1.md` is a design note from the Shadow Canvas prototype, kept for
  history.
- `docs/TWINTHINK_CORE_SPEC.md` is a handoff written against earlier versions of the ledger and
  Canvas docs; it still says it is uncommitted, and some of its "unbuilt" items are now live.
- The "Decided 28 Sep (latest)" section of `docs/CORE_LEDGER.md` describes a Drop falling
  through a living web with three motion states. It predates the 30 September decision in
  section 10 and has not yet been marked superseded, so its "(latest)" label is the ledger's own
  wording, not the current state.
- On `fall-space`, `docs/FALL_SPACE.md` describes hold-to-stop and idle settle as current in its
  "The current" section, and names three states (Fall, Stop, Open) under "Opening a subject".
  Both are the superseded continuous model.

## 9. How to know what is authoritative

Read in this order:

1. **`AGENTS.md`** for vocabulary and the rules agents and contributors follow.
2. **`README.md`** for top-level product framing and the run commands.
3. **`docs/CORE_LEDGER.md`** for what is actually built on the Slate, with evidence, the standing
   hold, and open decisions. Its state ladder: specified, implemented locally, tested, pushed,
   deployed, verified live, experience accepted. The ladder has no row for `/fall` yet.
4. **`docs/TWINTHINK_CORE_SPEC.md`** for the intent behind the Slate, read with the caveats in
   section 8. **`docs/CANVAS.md`** for how the Slate works today (read "Canvas" as "Slate").
5. **`docs/FALL_SPACE.md` on `fall-space`** for The Fall's design rules, Rabi's decided role,
   the build order and the in-hand test, read with the caveat that its locomotion sections are
   superseded.

Open decisions are numbered D-01 to D-11 in the spec's section 17 and D-12 to D-16 in the
ledger. All of them are John's to decide.

Branch roles, as set by John and checked against the remote at the commits named at the top of
this page:

- **`main`** is authoritative production. Vercel's production deployment builds from it.
- **`fall-space`** is authoritative for current Fall preview and design work. New `/fall` work
  branches fresh from it.
- **`master`** is legacy and non-authoritative.
- The parked branches in section 2 are references only.
- This page lives on `main` once merged; until then it is on the branch `docs/start-here`.

Repeat the check with `git fetch origin && git branch -r` and, for any branch,
`git rev-list --left-right --count origin/main...origin/<branch>`.

When a document and the code disagree, the code says what exists and the ledger says what has
been verified. Neither says what the product should be; that is John's decision. Vocabulary
decisions are recorded in `AGENTS.md`. Slate decisions are recorded in the ledger. Fall decisions
are recorded in `docs/FALL_SPACE.md` on `fall-space`, except the one in section 10, which has no
durable record yet.

## 10. Current design direction of The Fall

Decided by John on 30 September 2026. **This decision is recorded, so far, only on this page.**
It is not yet in `docs/CORE_LEDGER.md` or `docs/FALL_SPACE.md`, and the one commit that
implements it describes itself as awaiting John's decision. Until a dated entry exists in one of
those documents, treat this section as a pointer to a decision John made, not as the record of it.
It is the only model to build toward. It is not yet implemented on any branch you should use, and
the work of implementing it is assigned (section 2).

**Two locomotion states, and only two.**

- **Traveling.** A Current carries you through one Relationship, from one Subject toward another.
- **Located.** You have arrived at a Subject and stay there until you choose to leave.

This is where the premise in section 1 meets the interface. Being Located is when a subject's
context becomes readable: its name, then the reasons for its relationships. Traveling is a
relationship made perceptible as motion. Neither is a menu.

**Motion may always be present. Travel is voluntary.** The environment can keep moving while you
stay Located. Arrival gives you permission to do nothing.

While Located:

- you may remain indefinitely;
- attention reveals information, in this order: notice the name, understand the reason, then
  commit. If you keep looking past the reason, a slight pull starts and grows into Traveling. If
  you look away before it has you, the pull disappears. Reading must never turn into leaving by
  accident;
- facing an existing Current may eventually lead back into Traveling;
- turning around (turning the view with a drag, or the keys on desktop) exposes the Current you
  arrived through.

**Going back** is ordinary Traveling through the Current behind you, in the opposite direction.
There is no special back mode.

**Two invariants.** While a Current is carrying you, it stays spatially ahead of your view.
Entering the Current you came through is plain Traveling through it the other way.

**Not a graph.** The Fall is not nodes and edges, not a mind map, not a list of spatial choices,
not click a node then transition then next node, and not static chambers with menus of exits. A
Relationship should feel like something already present in the world, not a button waiting to be
selected.

**Controls.** Phone: drag to turn the view. Desktop: drag, A/D or the arrow keys; W makes a
Current pull you in sooner. No hold-to-stop, no idle settle, no new gestures.

**Decided and recorded in `docs/FALL_SPACE.md`, not built:** Rabi's role (depth for information
that cannot all fit in front of you; never deletes a relationship, never chooses the route; dense
subjects become deeper, not more cluttered), Rabi before going deeper into a subject, that dates
get no spatial direction yet, and the in-hand test decision tree. The build order John gave with
the 30 September decision is: finish Traveling / Located and test it in hand, then Rabi, then going
deeper into a subject starting with Phonograph. Whether the in-hand test has happened is not
recorded.

**Not built and not to be built yet:** Rabi, going deeper into a subject, body Lean via camera,
new gestures, collecting Lean on the server, aggregate Lean, pricing for space, founder rewards,
Current as an economy, any new vocabulary.

## 11. Privacy and authorship rules

These are product constraints, not implementation details. Privacy, provenance, authorship and
contextual integrity are part of what makes a Twin trustworthy: a twin whose history can be
forged, whose authorship can be misattributed, or whose private parts can leak is not a faithful
twin. The stakes are concrete because preview builds share the production database, and because
the Slate is a real person's work.

- **Private state stays private.** "Private by default. Nothing a visitor makes is published"
  (`docs/CANVAS.md`). Posts start private and are shared only when the maker chooses.
- **Lean is private.** "Lean is private navigation state, on this device only. 'Others leaned
  this way too', server-side Lean collection and aggregate Lean statistics are not built until a
  separate aggregate privacy protocol is designed" (`docs/CANVAS.md`; the ledger's MEMORY-02 and
  SIGNAL-01 rows and D-13; the spec's D-06). The same rule is decided for The Fall on `fall-space`.
- **Human relationships to knowledge are authored or approved, never inferred as fact.** Bridges
  in The Fall are "authored by the maker, never inferred" (`docs/FALL_SPACE.md`). Machine
  similarity is not an authored relationship. See gap 1 in section 3 for where the current code
  falls short of this inside a Whoeuvre.
- **Authorship and credit are explicit.** "Build on it" says what a piece was built on and whose it
  was, drawn in rose. Generated or system-drawn paths are never credited as anyone's work and
  never enter a Whoeuvre (`docs/CANVAS.md`; `docs/TWINTHINK_CORE_SPEC.md` section 10.3).
- **Shared experiences stay viewer-filtered.** In "Fall with me" only the leader's current place is
  kept, overwritten in place; a follower's position is never collected; if the leader moves
  somewhere the follower may not see, the follower is told only "moved into a path you can't
  enter" and is never moved there (`docs/CANVAS.md`). The Fall's multiplayer design on
  `fall-space` keeps the same rule: server-held position, per-viewer filtering.
- **Sample content never reaches production or the server.** The gate is a client-side check on
  the build environment and hostname (`docs/CANVAS.md`, "Sample content").

Known shortfalls against these rules are recorded in section 3 as architectural gaps. Two smaller
ones worth knowing: when a shared Fall's leader stops at something that exists only on their
device, that item's identifier is still sent to the server (followers are filtered afterwards),
and films are stored at public URLs regardless of the post's visibility. Both are for John to
prioritise, not for this page to fix.

## 12. How to run the project

Adapted from `README.md`. The script in the repository is not marked executable, so run it
through `bash`.

Launch the API and web app together:

```bash
pip install -r apps/api/requirements.txt
bash scripts/dev-stack.sh          # Linux / macOS (runs python3 and next dev)
powershell -ExecutionPolicy Bypass -File scripts/dev-stack.ps1   # Windows
```

- API: http://127.0.0.1:8001 (docs at http://127.0.0.1:8001/docs)
- Web: http://localhost:3000

Individually:

```bash
python3 apps/api/main.py           # local mode: SQLite and disk under apps/api/storage/ (or TT_STORAGE_DIR)

cd apps/web
npm install
npm run dev
```

The Slate runs read-only with no configuration. Posting, forks, keeps, notes and shared Falls
need a database URL and answer 503 without one; sign-in needs the Google and session variables;
films need a Blob token. The variables are listed under "Settings" in `docs/CANVAS.md`. Never
point a local build at the production database.

## 13. How to verify changes

Automated checks, run from the repository root unless a `cd` is shown:

```bash
pip install pytest                                          # not in requirements.txt
python3 -m pytest apps/api/tests                            # the API suite, including the foundation tests
python3 -m pytest packages/twinthink/simulation/test_simulation.py -v   # must run from the repo root
cd apps/web && npm test                                     # vitest, picks up src/**/*.test.ts
cd apps/web && npm run lint && npm run check:dashes         # eslint; no em or en dashes under src/ and public/
```

There is no type-check script; Vercel's build type-checks. End-to-end persistence for the API:
`python3 scripts/verify_foundation.py --api http://127.0.0.1:8001`, then restart the API and run
it again with `--phase2`.

There is no continuous integration on `main`. Only Vercel's build, including the no-dashes
prebuild step, gates a deploy. A CI workflow exists on the parked ingestion branch and nowhere
else.

**Tests are evidence, not product decisions.** `docs/CORE_LEDGER.md` uses a ladder of states:
specified, implemented locally, tested, pushed, deployed, verified live, experience accepted. A
passing test proves the code behaves as implemented. It does not prove the product idea is right.
"No row is 'experience accepted': that is John's call." When John says something feels wrong,
that is a design problem even if every test passes.

## 14. What not to do

- **Do not invent terminology.** No new nouns, modes, systems, realms, canvases, hubs or branded
  names without John's approval. Describe a behavior plainly and ask whether it deserves a name.
- **Do not treat legacy names as current concepts.** `ShadowField`, `shadowfield`, `CANVAS.md`
  and the Drop / web language are history, not design.
- **Do not merge experimental `/fall` work into `main` casually.** Keep it on `fall-space` until
  approved. Do not modify the live Slate while working on `/fall` unless told, and respect the
  ledger's standing hold on Slate code changes until John lifts it.
- **Do not revive parked work without explicit approval.** The two fall-located branches, the
  Drop prototype and `deploy-platform` are references only.
- **Do not turn design ambiguity into code.** If a concept is not settled, propose the smallest
  number of models and wait for a decision. A brainstorm is not approval to build.
- **Do not assume a passing test means the design is correct.** See section 13.
- **Do not weaken privacy for convenience.** Never expose private material through shared state;
  never infer a public relationship between a person's work and outside knowledge that the
  creator did not author or approve.

## 15. Where to go next

### If you are a developer

1. `AGENTS.md`, all of it, including the Next.js warning at the top.
2. `docs/CORE_LEDGER.md` for what is built, verified and on hold, then `docs/CANVAS.md` for how
   the Slate works, reading "Canvas" as "Slate".
3. For a first change on the Slate: `apps/web/src/lib/shadowfield/model.ts` (what a thing is),
   `sources/` (where content comes from), `world.ts` (how it is assembled), `core.ts` (the rules
   table the Slate is built from, with its tests), and `apps/web/src/lib/shadows/store.ts` (the
   server tables). Ask before changing the Slate while the hold stands.
4. The run and verify commands in sections 12 and 13.

### If you are trying to understand the product

1. Section 1 and section 3 of this page.
2. Open [twinth.ink/slate](https://twinth.ink/slate) and move through it before reading further.
3. `README.md`.
4. `docs/TWINTHINK_CORE_SPEC.md`, section 5 ("The target experience, from the visitor's eyes"),
   with the caveats in section 8.

### If you are working on The Fall

1. Section 10 of this page, then the vocabulary in section 7.
2. Branch `fall-space`: `docs/FALL_SPACE.md` (design rules, Rabi's role, bridges, the in-hand
   test), then `apps/web/src/lib/fall/` and `apps/web/src/components/fall/FallSpace.tsx`.
3. Know that the code there is the superseded continuous model, and that the Traveling / Located
   rewrite is parked and assigned. New `/fall` work branches fresh from `fall-space` and does not
   start a second rewrite.

### If you are working on the Twin protocol

1. Section 1 (the premise), the table in section 3, and the pillar list in `README.md` under
   "Underneath: the Twin protocol".
2. `apps/api/main.py`, `apps/api/continuity.py`, `packages/twinthink/schema.py`,
   `packages/twinthink/crypto/`, `packages/twinthink/service.py`.
3. `schemas/v0.1/` as early intent, noting it is not loaded by code.
4. `apps/api/tests/` and `scripts/verify_foundation.py`.
5. Gaps 2 and 3 in section 3 are the protocol's open architectural work.
