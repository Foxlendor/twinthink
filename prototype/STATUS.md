# Status

Last updated: 29 September 2026.

**Milestone:** Demonstrations A (the Drop and the web) and B (a real idea through it),
as a separate local prototype in `prototype/` on branch
`claude/twinthink-prototype-restart-fwcige` (based on `main` at `1b8c98d`).
**Production freeze:** unchanged. Nothing in `apps/`, the live site, its data or
its deployment was touched. Nothing here is deployed.

**Waiting on:** John trying the motion and judging whether it feels like the
described experience. Per the brief, no further features go on top of a motion
model John has not accepted.

## What works (implemented locally, tested, pushed; not deployed)

| Area | What you can do | Evidence |
| --- | --- | --- |
| Continuous fall | With no input the Drop falls, passes through gaps, is caught by strands, rides them, crosses junctions, flies or slips off, and keeps going (the web repeats downward). | unit: "with no input…"; e2e: "phone: with no input…"; `evidence/phone-1-falling.png` |
| Miss vs catch | A fast Drop tears through a strand (it rings and slows the Drop); a slower one is caught. Strands between better-connected works hold harder. | unit: "fast falls tear through…" |
| Drift | Drag from anywhere on the web: a floating joystick; direction and strength push the Drop with momentum. A one-second nudge changes which strand catches it. At junctions Drift bends which strand it continues on. Arrows/WASD on desktop. | unit: "a thumb nudge…", "Drift has momentum…"; e2e: "phone: dragging…", "desktop: keyboard…"; `evidence/phone-3-drift.png` |
| Settle / release | Touch without dragging (or hold Space): the Drop slows and settles beside the nearest work, and the work opens in place as a reading card. Let go: motion resumes. | unit + e2e "touch and hold settles…"; `evidence/phone-2-settled-reading.png` |
| Dew | Button or E near a work: the Drop adheres (Drift cannot pull it off) and a bead is left on the work, kept on this device. | unit + e2e "Dew adheres…"; `evidence/phone-4-dew.png`, `evidence/desktop-2-dew-card.png` |
| Drop | Button or Q: detaches from the work or strand and falls; where it lands is up to the web. | same tests |
| Relationships change the web | "Relationships" sheet: switch any sample relationship off/on, add your own. The layout re-forms, strands appear/disappear, grips and pulls change. The sheet and the view show the no-input path before and after, over one whole web. "Try it" runs a repeatable comparison (Rain map ↔ Rain barrel). | unit "DECISIVE: changing one relationship…" (strand gone, works moved, route different and not just minus one strand), "adding a relationship adds a strand…"; e2e "desktop: changing a relationship…"; `evidence/desktop-1-relationship-changed.png` |
| No hidden choices | Only explicit Dew and Drop are stored. Catches, passing, settling, resting, reading and view changes record nothing. No Lean exists. | unit "passive travel emits only motion events…", "only Dew and Drop are recorded…"; e2e checks the stored journey |
| Your idea | "New idea": title + your words, optionally connected ("builds on" Rain barrel…). Saved privately in localStorage with a stable id and a history; appears as a dashed work in the web with its strand; the Drop rests beside it. Edit keeps the original words in history. Delete removes it and its relationships. | unit "a new idea is private…", "editing appends history…"; e2e "enter an idea…", "after reload…"; `evidence/desktop-3-idea-in-web.png` |
| Accessible route | "List": every work and relationship as headings, text and buttons, with Dew/Drop and "Show in the web". Reduced motion starts in the list. | e2e "list view reaches the same works…", "reduced motion…"; `evidence/desktop-4-list.png` |
| Monochrome, no collisions | Ink/paper, light and dark. Labels only on the nearest few works and never overlapping each other, the card or the Drop. Nothing overlaps or scrolls sideways at 390 px. | e2e "phone: nothing overlaps…"; screenshots |
| No tilt | No orientation or motion listeners are ever registered. | e2e "tilt/orientation is never listened to" |
| No network | The page's security policy forbids network connections; the e2e run saw only the page's own files load. | e2e "no network requests…" |

Commands and setup: see `RUN.md`. Latest run: `npm test` 18/18, `npm run e2e` 14/14.

## Simulated, partial or missing (plain list)

- **Not tried on a real phone.** Touch was Chromium's emulated touch at 390×844. Feel, thumb reach and performance on a device are unknown.
- **No AI.** Rabi's interpretation step does not exist here; entry is manual. Nothing is simulated in its place.
- **Sample content is synthetic** (seven made-up works by "Sample maker A/B/C"). Your ideas are real but local to one browser; there is no account, sync, sharing or publishing.
- **Dew persistence is a mark only**: it does not yet alter the web's physics (D-07 open).
- **Passive falls converge** on a recurring route through part of the sample web (P-9). Drift is needed to explore the rest. Whether that is right is D-14.
- **Motion model is a first candidate** (P-1…P-6 in PRODUCT.md): numbers were tuned in simulation, not by feel.
- The desktop "centered Drop with pointer lock" mode from the ledger is not in this prototype; the mouse drags like a thumb.
- Screen-reader support is the list view plus a status line; the canvas itself is hidden from assistive tech. Not tested with an actual screen reader.
- Everything in PRODUCT.md §8 beyond Demonstrations A and B (Time/Topic, Whoeuvre, Your Fall, multiplayer, co-op, maker spaces, room, Current…) is not built here.
- `window.__tt` exposes internal state for the browser tests; remove before any real release.

## Next task

1. John runs it (`RUN.md`), on desktop and ideally on a real phone, and says whether
   the fall, Drift, settle, Dew and Drop feel right, and whether the relationship
   comparison convinces. Also: is "Drop" (body) vs "Drop" (release) confusing?
2. Then, depending on the answer: tune the motion (P-1…P-6) or answer D-14/D-07,
   before any Time/Topic, Rabi or journey work.
