# TwinThink

**The internet with depth.**

Most of the internet is flat: a feed, a list of results, a page of links. TwinThink gives things
depth instead: history, relationships, provenance, and the persistence of people returning to
them. You do not scroll past things; you move through how they connect.

## Four ideas

- **TwinThink**: the internet with depth. The whole system.
- **Shadow Slate**: the spatial interface. Where a person experiences TwinThink.
- **The Fall**: moving through connected things instead of scrolling. The space you move through
  is formed by the relationships themselves and by the route you take, so where you went, what
  you passed, and what you keep coming back to stay visible.
- **Whoeuvre**: one person's accumulated work, ideas and history, as a place you can enter.

> Wikipedia can describe a thing; a Twin can contain the history of the thing becoming real.

Everything else (Lean, Dew, Drop, the Trail, Rabi, and so on) is a mechanic inside these four,
described in the docs, not a headline.

## Where it stands

- **The Slate is live** at [twinth.ink](https://twinth.ink) (`/slate`): johne.boi's Whoeuvre,
  songs, dancing, moments and inventions, as a spatial place.
- **`/fall` is the current prototype of the Fall.** It is built on the `fall-space` branch and
  shows on preview deployments only. It proves the first part of the loop with real data:
  **search for something, enter it, fall through real relationships.** Wikipedia and DBpedia
  are the test material: they say what is connected; the Fall decides what those connections
  feel like as space. See [`docs/FALL_SPACE.md`](https://github.com/Foxlendor/twinthink/blob/fall-space/docs/FALL_SPACE.md).
- **Next:** the missing step, meeting people's own contributions inside that space. A piece of a
  Whoeuvre should appear as a strand off the knowledge it relates to: a song about the
  phonograph, hanging off the Phonograph article.

## Underneath: the Twin protocol

The experience runs on a protocol for things with a real history. It lives in
`packages/twinthink` (the library), `apps/api` (the API) and `apps/api/tt.py` (the CLI).

- **Identity and provenance:** creator identities (Ed25519), signed revisions, tamper-evident
  history.
- **Evidence:** what supports a claim about a thing, and how real it is.
- **Rights:** capability-based permissions, encrypted segments.
- **Portability:** `.twin` bundles, exports (including Digital Product Passport projections).
- **Continuity:** an append-only, hash-chained log per subject, so "someone kept returning to
  this" is evidence rather than a claim (`apps/api/continuity.py`, `/api/continuity`; local mode
  only for now).
- **Tools:** the CLI and an MCP server (`packages/twinthink/mcp`).

**Engineering is one domain running on the protocol, not the definition of TwinThink.**
Hierarchical bills of materials, cost, simulation and calibration (`packages/twinthink/bom`,
`simulation`, `factory`) let a Twin hold the working history of a physical object: sketch, CAD,
parts, prototype, tests, revisions.

## Running it

### Quick start (tested launch commands)

### 1. Launch Both API & Web Concurrently
On Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-stack.ps1
```
On Linux / macOS (Bash):
```bash
./scripts/dev-stack.sh
```

- **API**: [http://127.0.0.1:8001](http://127.0.0.1:8001) (API Docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs))
- **Web UI**: [http://localhost:3000](http://localhost:3000)


### Running individually

#### API server
```powershell
# Default storage at apps/api/storage/ (or set TT_STORAGE_DIR)
python apps/api/main.py
```
- Operates in **local mode** using SQLite (`twinthink.db`) and local disk storage for bundles and extracted assets.
- No cloud credentials (S3/Postgres) required for local development.

#### Web application
```powershell
cd apps/web
npm install
npm run dev
```


### Tests and verification

#### Automated tests
```powershell
# Run the 9 foundation tests covering M0 & M1
python -m pytest apps/api/tests/test_foundation.py -v

# Run physics simulation tests
python -m pytest packages/twinthink/simulation/test_simulation.py -v

# Run the whole API suite, and the web app's tests
python -m pytest apps/api/tests
cd apps/web && npm test
```

#### End-to-end persistence verifier
```powershell
# Phase 1: Creates two distinct creator-owned twins, edits one, tests 403 access control, exports and re-imports
python scripts/verify_foundation.py --api http://127.0.0.1:8001

# (Kill and restart your API server process)

# Phase 2: Verifies that twins, creator records, edited titles, and ownership permissions persist across server restarts
python scripts/verify_foundation.py --api http://127.0.0.1:8001 --phase2
```

## Docs

- [`docs/TWINTHINK_CORE_SPEC.md`](docs/TWINTHINK_CORE_SPEC.md): what the Slate is meant to be.
- [`docs/CORE_LEDGER.md`](docs/CORE_LEDGER.md): what is actually built, with evidence.
- [`docs/CANVAS.md`](docs/CANVAS.md): how the Slate works.
- [`docs/FALL_SPACE.md`](https://github.com/Foxlendor/twinthink/blob/fall-space/docs/FALL_SPACE.md): the Fall formed by relationships, and its design rules (on the `fall-space` branch).
- [`docs/SHADOW_PROTOCOL_0_1.md`](docs/SHADOW_PROTOCOL_0_1.md): an earlier design note from the Shadow Canvas prototype (kept for history).
