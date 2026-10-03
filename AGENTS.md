<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## TwinThink

Before changing the Slate, read `docs/TWINTHINK_CORE_SPEC.md` (the intent), `docs/CORE_LEDGER.md` (what is actually built, with evidence) and `docs/CANVAS.md` (how it works).

## Vocabulary (John decides names)

John names concepts; agents name variables. Agents may describe behavior with metaphors, but a
metaphor does not become architecture unless John explicitly names it.

Existing legacy names (`ShadowField.tsx`, `lib/shadowfield/`, `docs/CANVAS.md`, and the like) may
remain in code for compatibility for now, but agents must not use them to infer current product
concepts. Canonical terminology takes precedence over filenames.

Use only these terms for TwinThink concepts, in docs, UI, routes, comments and explanations:

| Term | Meaning |
| --- | --- |
| TwinThink | The whole system: the internet with depth. |
| Shadow Slate | The primary spatial interface. |
| Lens | Controls or shapes what a particular viewer is permitted to perceive. Like a microscope changing its focal lens: the same underlying Twin, different magnification and focus depending on who is looking. |
| The Fall | Moving through connected knowledge, human work and relationships. |
| Whoeuvre | One person's accumulated body of work, ideas, history and contributions. |
| Twin protocol | The infrastructure underneath: identity, provenance, signed history, evidence, rights, portability, continuity. |
| Subject | The thing being encountered (Phonograph, Drinking straw, SipSmolder). Not "node". |
| Subject region | The space around a subject. Not room, chamber or node. |
| Relationship | A real connection between two subjects. |
| Current | The traversable form of a relationship in the Fall. |
| Traveling | A current is carrying you between subjects. |
| Located | You have arrived at a subject and stay until you choose to leave. |
| Lean | The direction of attention and steering (thumb, mouse, keys, later perhaps the body). |
| Route | The path you actually took through the Fall. |
| Look Back | The deliberate outside view of the route. |
| Rose current | A human-authored (Whoeuvre) relationship, in the same space. |
| Rabi | Decides when and where real information becomes perceptible. Not a recommender. |
| Continuity | Tamper-evident history of a subject. Not multiplayer session history. |

- Tube, tunnel, river, eddy, wall, seam, fog, web, strand and the like are visual analogies for how
  something looks or behaves. They never become product nouns, modes, files, types or diagrams.
- Do not introduce, without asking John: node, graph node, room, chamber, portal, doorway, row,
  lane, channel, universe, realm, verse, canvas, field, workspace, feed, hub, lobby, mode, or any
  branded name (ShadowVerse, ShadowField, Realm, Hub, Mode, Workspace, ...).
- Keep three layers apart: product language (TwinThink, Shadow Slate, the Fall, Whoeuvre, Rabi),
  interaction language (subject, subject region, relationship, current, traveling, located, lean,
  route, Look Back), and implementation language (DBpedia query, snapshot, cache, renderer, subject
  id, relationship strength, direction, component, state). Never promote implementation language
  into product language without asking.
- If an analogy conflicts with these terms, keep the terms and treat the analogy as description.
- Before any new noun reaches docs, UI, routes, class names or architecture diagrams, ask whether it
  should become official. Internally, prefer boring descriptive names (`relationshipAllocator.ts`,
  `subjectRegion.ts`), never branded ones.
