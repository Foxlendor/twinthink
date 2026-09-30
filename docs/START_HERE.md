# Start here

For a person with no prior knowledge of TwinThink. After reading this you should know what the
project is, what exists today, how the major parts fit together, and where to look next.

Everything here comes from the repository as of 30 September 2026. Where two documents disagree,
this page says so instead of choosing. Status labels are used throughout: **live**, **preview**,
**parked**, **proposed**, **legacy**.

## 1. What TwinThink is

TwinThink started from one problem: you cannot make a faithful digital twin of something you do
not understand in context. A true twin is not a flat copy or a bundle of files. To twin a thing
faithfully, the system has to keep enough context for the thing to stay understandable:

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
creations, knowledge and other kinds of things. Engineering is one domain running on the protocol,
not the definition of TwinThink.

> Wikipedia can describe a thing; a Twin can contain the history of the thing becoming real.

The short form: **TwinThink gives the internet depth.** Most of the internet is flat, a feed or a
list of results. TwinThink lets you move through how things connect, and keeps the history,
relationships and provenance that make a thing understandable.

Five words carry the whole project. Each is defined in `AGENTS.md`; this is the plain version.

| Word | Plain meaning |
| --- | --- |
| **TwinThink** | The whole system. The internet with depth. |
| **Shadow Slate** | The spatial place where a person experiences TwinThink. Live today at twinth.ink. |
| **The Fall** | Moving through connected knowledge, human work and relationships instead of scrolling. The Fall turns curiosity into a path. |
| **Whoeuvre** | One person's accumulated work, ideas, history and contributions, as a place you can enter. |
| **Twin protocol** | The infrastructure underneath: identity, provenance, signed history, evidence, rights, portability and continuity. |

One disagreement to know about now. `AGENTS.md` and `README.md` call Shadow Slate "the primary
spatial interface". `docs/CORE_LEDGER.md` calls Shadow Slate "the deep, spatial layer" and "the
Slate" its surface. `docs/CANVAS.md` never uses the term. This page follows `AGENTS.md`.

## 2. What exists today

### Production (live, branch `main`)

- **The Shadow Slate** at [twinth.ink/slate](https://twinth.ink/slate): johne.boi's Whoeuvre as a
  spatial place, with his songs, dancing, moments and inventions. You move through it by scrolling
  or swiping, one thing at a time, and can steer into side openings.
- **Signed-in features on the Slate:** posting ("cast a shadow", private by default), keeping
  others' work in a private sketchbook, opening a bounded contribution space (a fork) on your own
  work with an invite link, anonymous notes, "Fall with me" (two signed-in people in one Fall, one
  leading), a Look Back style replay called "your Fall", and Dew / Drop reactions kept on the
  device.
- **Sign in with Google**, donations through Stripe, images in Postgres, films in Vercel Blob.
- **The Twin protocol backend** (`apps/api`, `packages/twinthink`): a FastAPI service and Python
  library for Twin documents, bills of materials, signed revisions, provenance, capabilities,
  `.twin` bundles and a per-subject continuity log. It runs in local mode with SQLite. The web
  app does not call it (see section 3).

### Preview / experimental (branch `fall-space`)

- **`/fall`**: the current prototype of The Fall, on preview deployments only. Search for a
  subject, enter it, and move through real relationships from Wikipedia and DBpedia. Three
  maker-authored links (bridges) connect pieces of johne.boi's work to articles.
- The code on `fall-space` implements an older continuous model (hold to stop, settle when idle,
  lean at splits). That model is **superseded** by the two-state model in section 10, which is
  not yet implemented on any branch you should use.
- `fall-space` is 14 commits ahead of `main` and 3 behind it. Its docs live in
  [`docs/FALL_SPACE.md` on that branch](https://github.com/Foxlendor/twinthink/blob/fall-space/docs/FALL_SPACE.md).

### Parked work (do not treat as current)

- `fall-located-rename-wip` and `fall-located-wip`: two drafts of the Traveling / Located rewrite
  of `/fall`. The first does not compile; the second uses old names throughout. Another session
  owns this work. Do not build on them, merge them or revive them without John's explicit approval.
- `claude/twinthink-prototype-restart-fwcige`: a standalone "Drop" prototype of a 28 September
  motion model that has since been superseded. Kept as evidence and for a few reusable primitives.
- `deploy-platform`: a depth-visibility experiment and an older fork / lean / breadcrumb prototype.
  Superseded; likely does not type-check.
- `fix/shared-fall-notice-overlap`: nine unmerged lines for the Slate. Undecided.
- Seven branches with no commits beyond `main` (`preview`, `clarity-pass`, `continuity-readme`,
  `chore/no-dashes`, `hotfix/vercel-nextjs-preset`, `work/twinthink-foundation`,
  `privacy/public-surface-cleanup`) are fully merged.

### Proposed but not built

- **Rabi** in its canonical role (section 7). What exists under that name today is a pressure
  notice to fork makers on the Slate.
- **Going deeper into a subject** in The Fall (the study view described on `fall-space`).
- **Multiplayer for The Fall** (documented on `fall-space`; "Fall with me" exists only on the Slate).
- **Current as an allocatable resource**, desire paths, raids, reservoirs and the other 28
  September proposals in `docs/CORE_LEDGER.md`. Recorded as direction only.
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
  comes from being Located (section 10).
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

Three gaps follow from the premise in section 1. They are recorded here as architecture to
solve, not as isolated bugs, and this page does not fix them.

1. **Inferred relationships appearing as named Currents without authored provenance.** In
   `/fall`, inside a Whoeuvre, "goes with (word)" comes from a shared rare word and "made
   alongside" comes from time proximity. Both are machine-derived, yet they appear as Currents
   with a stated reason. The authored kinds "challenges" and "resolves" are dropped.
2. **Weak protocol enforcement around auth, rights and provenance.** The bundle export, revision
   posting, identity upsert and capability endpoints in `apps/api` need no owner token. Rights
   policies and capabilities are declared in the library but nothing enforces them. The
   continuity log is hash-chained but unsigned.
3. **The experience layer not yet attaching encountered subjects to actual Twin records and
   history.** See the paragraph above.

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
        ├── BOM                      hierarchical bill of materials, cost rollup, DPP tiers
        ├── Simulation               thermal and flow model for one physical fixture (a straw)
        └── Calibration              fitting the model to measured telemetry
```

The Experience column and the Twin protocol column are not connected (section 3).

## 5. Where the code lives

**`apps/web`** (product UI). The Next.js app that serves twinth.ink. The Slate client is one
large component, `src/components/shadowfield/ShadowField.tsx`, with its rules and geometry in
`src/lib/shadowfield/`. Server routes under `src/app/api/` handle posts, forks, keeps, notes,
media, pressure, resonance and shared Falls, backed by Neon Postgres. Look here for anything a
visitor sees or does. On `fall-space` this folder also holds `src/lib/fall/` and
`src/components/fall/`.

**`apps/api`** (backend, Twin protocol). A FastAPI service: `main.py` for Twins, revisions,
identities, capabilities, bundles and tests; `continuity.py` for the continuity log; `tt.py`, a
command-line client of the same library. Local mode uses SQLite under `apps/api/storage/`. Look
here for how a Twin is stored, signed, exported and verified.

**`packages/twinthink`** (protocol library, Python). `schema.py` (the Twin document model),
`crypto/` (identity, revisions, capabilities, envelopes, bundles), `service.py` (the lifecycle
used by the CLI and the MCP server), `bom/`, `factory/`, `reality/`, `simulation/` and `mcp/`.
Look here for the protocol itself, and for the engineering domain modules.

**`schemas/v0.1`** (protocol, declarative). JSON Schemas for a Twin and a manifest. No code
loads them today, and they have drifted from the Python models. Treat them as an early statement
of intent, not as the enforced contract.

**`docs`** (documentation). Listed in section 9. `docs/FALL_SPACE.md` exists only on
`fall-space`.

**`fixtures`, `scripts`** (engineering domain, tooling). Sample Twin bundles for a physical
fixture, the scripts that regenerate them, an end-to-end verifier for the API, and a script that
builds TwinThink's own history from git. Three loose files at the repository root
(`upload_test.py`, `scratch_update.py`, `neon.ts`) are leftovers.

## 6. Important routes and surfaces

| Route | Status | What it is |
| --- | --- | --- |
| `/` | live | Front page: a few words and the way in. |
| `/slate` | live | The Shadow Slate. `?at=` opens a place; `?who=` opens someone else's ring. |
| `/whoeuvre/<name>` | live | Redirects into the Slate: johne.boi's Whoeuvre is the Slate itself; anyone else's is their ring in "from everyone". |
| `/whoeuvre/johne.boi/hex-lab` | live | Redirects to the HEX Lab group on the Slate. |
| `/support` | live | Donations. |
| `/api/*` | live | The Slate's own server routes (posts, forks, keeps, notes, media, pressure, resonance, shared Falls, auth). Not the Twin protocol API. |
| `/fall` | **preview only** | The Fall prototype, on `fall-space`. The page returns not-found when the deploy environment is production. On `main` the route does not exist; an unknown single-segment path redirects to `/slate`. |
| `/canvas`, `/roundup`, `/bounties`, `/explore`, `/create`, `/archive`, `/twins/*` | legacy | Permanent redirects to `/slate`. |

Sample content (invented makers and works) shows only on preview builds off the production host.
The gate is client-side; see section 11.

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
| Route | The path you actually took through The Fall. |
| Look Back | The deliberate outside view of the route. |
| Rose current | A human-authored (Whoeuvre) relationship, in the same space. |
| Rabi | Decides when and where real information becomes perceptible. Not a recommender. |
| Continuity | Tamper-evident history of a subject. Not multiplayer session history. |

Three layers stay apart: product language (TwinThink, Shadow Slate, The Fall, Whoeuvre, Rabi),
interaction language (the table above), and implementation language (renderer, cache, subject id,
DBpedia query, relationship strength, component, state). Implementation words never become
product words without asking.

**Metaphors are allowed for explanation, but metaphors are not architecture.** Tube, tunnel,
river, eddy, wall, seam, web and strand describe how something looks or behaves. They never become
product nouns, modes, files, types or diagrams. John names concepts; agents name variables.

Legacy names still exist in filenames and identifiers (section 8). Older documents also use words
that are not in this table, and some canonical words with a different meaning:

- `README.md` names Dew, Drop and "the Trail" as mechanics. Dew and Drop are built on the Slate
  (a reaction: carry it forward, let it drop). "The Trail" is defined nowhere; the canonical word
  for the path taken is Route.
- **Lean** means steering here. In `docs/TWINTHINK_CORE_SPEC.md`, `docs/CORE_LEDGER.md` and
  `docs/CANVAS.md`, a Lean is a deliberate committed choice, and steering is explicitly not a
  Lean. That conflict is open.
- **Rabi** here allocates perceptibility. The spec calls Rabi an architect of routes; the Slate's
  built "Rabi" is a pressure notice to fork makers; the ledger's proposals have Rabi managing
  allocation. Only the definition above is canonical.
- **Drop** is a reaction on the Slate and, in the ledger's 28 September section, also the moving
  body. Same word, two things.

## 8. Legacy names and historical baggage

`ShadowField`, `shadowfield`, `ShadowField.tsx`, `lib/shadowfield/`, `docs/CANVAS.md`, the
`tt_shadows` tables and "cast a shadow" in the UI are legacy implementation names from when the
Slate was called the Shadow Canvas and then the Shadow Field. They may stay in code for
compatibility. Do not use them to infer the current product vocabulary, and do not rename them
casually; any cleanup is a separate, audited change.

Older branches and documents reflect superseded models:

- `master` and the branches cut from it (`shadow-field-z`, `feature/shadow-canvas`,
  `feature/xyz-semantic-depth`, `feature/public-inventor-archive`) are a lineage that `main` has
  since absorbed and moved past. They are 145 commits behind `main`. Legacy.
- `docs/SHADOW_PROTOCOL_0_1.md` is a design note from the Shadow Canvas prototype, kept for
  history.
- `docs/TWINTHINK_CORE_SPEC.md` is a handoff written against earlier versions of the ledger and
  Canvas docs; it still says it is uncommitted, and some of its "unbuilt" items are now live.
- The "Decided 28 Sep (latest)" section of `docs/CORE_LEDGER.md` describes a Drop falling
  through a living web with three motion states. It predates the 30 September decision in
  section 10 and has not yet been marked superseded.
- The locomotion section of `docs/FALL_SPACE.md` on `fall-space` describes hold-to-stop and
  idle settle as current. That is the superseded continuous model.

## 9. How to know what is authoritative

Read in this order:

1. **`AGENTS.md`** for vocabulary and the rules agents and contributors follow.
2. **`README.md`** for top-level product framing and the run commands.
3. **`docs/CORE_LEDGER.md`** for what is actually built on the Slate, with evidence and open
   decisions. Its state ladder: specified, implemented locally, tested, pushed, deployed, verified
   live, experience accepted.
4. **`docs/TWINTHINK_CORE_SPEC.md`** for the intent behind the Slate, read with the caveats in
   section 8. **`docs/CANVAS.md`** for how the Slate works today (read "Canvas" as "Slate").
5. **`docs/FALL_SPACE.md` on `fall-space`** for The Fall's design rules, Rabi's decided role,
   the build order and the in-hand test, read with the caveat that its locomotion section is
   superseded.

Branch roles, verified against the remote on 30 September 2026:

- **`main`** is authoritative production. Vercel's production deployment builds from it.
- **`fall-space`** is authoritative for current Fall preview and design work.
- **`master`** is legacy and non-authoritative.
- The parked branches in section 2 are references only.

When a document and the code disagree, the code says what exists and the ledger says what has
been verified. Neither says what the product should be; that is John's decision, recorded in
`AGENTS.md` and the ledger.

## 10. Current design direction of The Fall

Decided 30 September 2026. This is the latest model and the only one to build toward. It is not
yet implemented on any branch you should use, and the repository's other documents have not yet
been updated to it (section 8).

**Two locomotion states, and only two.**

- **Traveling.** A Current carries you through one Relationship, from one Subject toward another.
- **Located.** You have arrived at a Subject and stay there until you choose to leave.

**Motion may always be present. Travel is voluntary.** The environment can keep moving while you
stay Located. Arrival gives you permission to do nothing.

While Located:

- you may remain indefinitely;
- attention reveals information, in this order: notice the name, understand the reason, then
  commit. If you keep looking past the reason, a slight pull starts and grows into Traveling. If
  you look away before it has you, the pull disappears. Reading must never turn into leaving by
  accident;
- facing an existing Current may eventually lead back into Traveling;
- turning around exposes the Current you arrived through.

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

**Decided but not built:** Rabi's role (depth for information that cannot all fit in front of you;
never deletes a relationship, never chooses the route; dense subjects become deeper, not more
cluttered), the build order (finish Traveling / Located and test it in hand, then Rabi, then going
deeper into a subject starting with Phonograph), that dates get no spatial direction yet, and the
in-hand test decision tree in `docs/FALL_SPACE.md`.

**Not built and not to be built yet:** Rabi, going deeper into a subject, body Lean via camera,
new gestures, collecting Lean on the server, aggregate Lean, pricing for space, founder rewards,
Current as an economy, any new vocabulary.

## 11. Privacy and authorship rules

These are product constraints, not implementation details. Privacy, provenance, authorship and
contextual integrity are part of what makes a Twin trustworthy.

- **Private state stays private.** "Private by default. Nothing a visitor makes is published"
  (`docs/CANVAS.md`). Posts start private and are shared only when the maker chooses.
- **Lean is private.** "Lean is private navigation state, on this device only. 'Others leaned
  this way too', server-side Lean collection and aggregate Lean statistics are not built until a
  separate aggregate privacy protocol is designed" (`docs/CANVAS.md`, confirmed in
  `docs/CORE_LEDGER.md` D-06 and D-13). The same rule is decided for The Fall on `fall-space`.
- **Human relationships to knowledge are authored or approved, never inferred as fact.** Bridges
  in The Fall are "authored by the maker, never inferred" (`docs/FALL_SPACE.md`). Machine
  similarity is not an authored relationship. See gap 1 in section 3 for where the current code
  falls short of this inside a Whoeuvre.
- **Authorship and credit are explicit.** "Build on it" says what a piece was built on and whose it
  was, drawn in rose. Generated or system-drawn paths are never credited as anyone's work, never
  enter a Whoeuvre (`docs/CANVAS.md`; `docs/TWINTHINK_CORE_SPEC.md` section 10.3).
- **Shared experiences stay viewer-filtered.** In "Fall with me" only the leader's current place is
  kept, overwritten in place; a follower's position is never collected; if the leader moves
  somewhere the follower may not see, the follower is told only "moved into a path you can't
  enter" and is never moved there (`docs/CANVAS.md`). The Fall's multiplayer design on
  `fall-space` keeps the same rule: server-held position, per-viewer filtering.
- **Sample content never reaches production or the server.** The gate is a client-side check on
  the build environment and hostname. Previews share the production database, which is why
  nothing about samples may be written server-side (`docs/CANVAS.md`).

Known shortfalls against these rules are recorded in section 3 as architectural gaps. Two smaller
ones worth knowing: a shared Fall's station rule does not exclude device-only ids before sending
the leader's place to the server, and films are stored at public URLs regardless of the post's
visibility. Both are for John to prioritise, not for this page to fix.

## 12. How to run the project

From `README.md`; these are the tested launch commands.

Launch the API and web app together:

```bash
./scripts/dev-stack.sh            # Linux / macOS
powershell -ExecutionPolicy Bypass -File scripts/dev-stack.ps1   # Windows
```

- API: http://127.0.0.1:8001 (docs at http://127.0.0.1:8001/docs)
- Web: http://localhost:3000

Individually:

```bash
python apps/api/main.py           # local mode: SQLite and disk under apps/api/storage/ (or TT_STORAGE_DIR)

cd apps/web
npm install
npm run dev
```

The web app's server features (sign-in, posting, forks, shared Falls) need the environment
variables listed under "Settings" in `docs/CANVAS.md`. Without a database URL those routes answer
503 and the Slate still runs read-only.

## 13. How to verify changes

Automated checks, from `README.md`:

```bash
python -m pytest apps/api/tests/test_foundation.py -v      # the foundation tests (README says nine; the file has ten)
python -m pytest packages/twinthink/simulation/test_simulation.py -v
python -m pytest apps/api/tests
cd apps/web && npm test                                    # vitest
cd apps/web && npm run lint && npm run check:dashes        # eslint; no em or en dashes under src/ and public/
```

End-to-end persistence for the API: `python scripts/verify_foundation.py --api http://127.0.0.1:8001`,
then restart the API and run it again with `--phase2`.

There is no continuous integration on `main`. Only Vercel's build, including the no-dashes
prebuild step, gates a deploy.

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
  approved. Do not modify the live Slate while working on `/fall` unless told.
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

1. `AGENTS.md`, all of it.
2. `docs/CORE_LEDGER.md` for what is built and verified, then `docs/CANVAS.md` for how the Slate
   works, reading "Canvas" as "Slate".
3. `apps/web/src/lib/shadowfield/core.ts`, the rules table the Slate is built from, and its tests.
4. The run and verify commands in sections 12 and 13.

### If you are trying to understand the product

1. Section 1 and section 3 of this page.
2. `README.md`.
3. Open [twinth.ink/slate](https://twinth.ink/slate) and move through it before reading further.
4. `docs/TWINTHINK_CORE_SPEC.md`, section 5 ("The target experience, from the visitor's eyes"),
   with the caveats in section 8.

### If you are working on The Fall

1. Section 10 of this page, then the vocabulary in section 7.
2. Branch `fall-space`: `docs/FALL_SPACE.md` (design rules, Rabi's role, bridges, the in-hand
   test), then `apps/web/src/lib/fall/` and `apps/web/src/components/fall/FallSpace.tsx`.
3. Know that the code there is the superseded continuous model, and that the Traveling / Located
   rewrite is parked and owned elsewhere. New `/fall` work branches fresh from `fall-space`.

### If you are working on the Twin protocol

1. Section 1 (the premise) and the pillar list in `README.md` under "Underneath: the Twin protocol".
2. `apps/api/main.py`, `apps/api/continuity.py`, `packages/twinthink/schema.py`,
   `packages/twinthink/crypto/`, `packages/twinthink/service.py`.
3. `schemas/v0.1/` as early intent, noting it is not loaded by code.
4. `apps/api/tests/` and `scripts/verify_foundation.py`.
5. Gaps 2 and 3 in section 3 are the protocol's open architectural work.
