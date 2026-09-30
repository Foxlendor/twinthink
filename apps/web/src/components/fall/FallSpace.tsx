'use client';

// The Fall, formed by relationships (preview only): real examples from Wikipedia, ridden as a
// current.
//
// You are always moving. The relationship you are riding is the tube around you; where it reaches
// a subject the tube swells and the subject drifts past, and its own relationships split off ahead.
// Lean toward one (drag a thumb, move the mouse, or A/D and the arrows) and it gradually captures
// you as you near the split; lean nowhere and the strongest current carries you. Hold (a finger
// down, the mouse button, S or Space) and you slow at once; still, what is here resolves: the
// subject, why two things connect, where each branch goes and why. Let go and the current picks
// you back up. Pay no attention for a while and it lets you settle inside a subject. Look back to
// see the path you actually rode, and where you stopped.
//
// Momentum carries you. Attention changes you. Inattention eventually lets you settle.
//
// Nothing here reaches our server. Every id begins "sample/"; what you have seen and ridden is
// kept on this device only.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import styles from './FallSpace.module.css';
import { FallNode, Graph, Strand, chooseOpenings } from '@/lib/fall/graph';
import { Opening, Place, START, V3, add, arrive, between, blend, circling, cross, dot, len, lerp3, norm, openingsAround, orbit, overlook, scale, sub } from '@/lib/fall/space';
import { Cam, drawFall, viewOf } from '@/lib/fall/draw';
import { Branch, drawStream } from '@/lib/fall/stream';
import { CRUISE, LEAN_DEAD, Leg, SETTLE_AFTER, branchFor, captureAt, densityOf, easeSpeed, leadIn, legOf, paceAt, settleSpeed, zoneAt } from '@/lib/fall/ride';
import { Entrance, isDescription, resolveEntrance } from '@/lib/fall/enter';
import { BRIDGES } from '@/lib/fall/bridges';
import { isWiki, joinSources } from '@/lib/fall/sources';
import { createWhoeuvreGraph } from '@/lib/fall/whoeuvre';
import { buildWorld } from '@/lib/shadowfield/world';
import { AUTHOR } from '@/lib/shadowfield/sources/author';
import { Snapshot, WIKI_STARTS, createWikiGraph, titleOf, wikiId } from '@/lib/fall/wiki';

import { samplesAllowed } from '@/lib/shadowfield/sources/samples';

const MEMORY_KEY = 'twinthink.fall.v1';
const UNREACHABLE = 'Wikipedia and DBpedia could not be reached just now, so nothing is shown here.';

interface Memory {
  seen: Record<string, number>;
  walked: string[];
}

function readMemory(): Memory {
  try {
    const d = JSON.parse(window.localStorage.getItem(MEMORY_KEY) ?? '{}') as Partial<Memory>;
    return { seen: d.seen && typeof d.seen === 'object' ? d.seen : {}, walked: Array.isArray(d.walked) ? d.walked.filter((w) => typeof w === 'string') : [] };
  } catch {
    return { seen: {}, walked: [] };
  }
}

function writeMemory(m: Memory) {
  try {
    const seen = Object.fromEntries(Object.entries(m.seen).slice(-400));
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify({ seen, walked: m.walked.slice(-600) }));
  } catch {
    // not allowed: remembered for this visit only
  }
}

const noop = () => () => {};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** The split ahead: the subject it is at, and its branches, each where its strand puts it. */
interface Fork {
  id: string;
  openings: Opening[];
}

export default function FallSpace({ serif }: { serif: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const placesRef = useRef(new Map<string, Place>());
  /** Every subject passed through, in order. */
  const routeRef = useRef<string[]>([]);
  const nodesRef = useRef(new Map<string, FallNode>());
  const strandsRef = useRef(new Map<string, Strand[]>());
  /** What your path keeps circling, and where. */
  const centresRef = useRef<{ id: string; title: string; at: V3; n: number }[]>([]);
  const statusRef = useRef<string | undefined>(undefined);
  /** The relationship being ridden, how far along it (0 to 1), and how fast (world units a second). */
  const legRef = useRef<Leg | null>(null);
  const sRef = useRef(0);
  const speedRef = useRef(0);
  const forkRef = useRef<Fork | null>(null);
  /** Where each branch is drawn: easing toward where it now belongs, as the split forms. */
  const shownPosRef = useRef(new Map<string, V3>());
  /** The branch that has you, as you near the split. */
  const capturedRef = useRef<string | null>(null);
  /** Leaning (screen terms: right +x, down +y), and what it came from (a mouse holds its lean). */
  const leanRef = useRef<{ x: number; y: number; src: 'mouse' | 'touch' | 'keys' }>({ x: 0, y: 0, src: 'keys' });
  const pressRef = useRef<{ x: number; y: number; lx: number; ly: number; moved: number; steering: boolean } | null>(null);
  const holdRef = useRef(false);
  const keysRef = useRef(new Set<string>());
  /** Attention: any since the last split; subjects passed without any; letting you settle. */
  const attendedRef = useRef(false);
  const idleRef = useRef(0);
  const settlingRef = useRef(false);
  /** Stopping: how long still (s), how far what is here has resolved (0 to 1), and whether marked. */
  const stillRef = useRef({ t: 0, amount: 0, marked: false });
  /** The camera, eased (so a split never jerks the view). */
  const camRef = useRef<{ f: V3; u: V3 }>({ f: START.f, u: START.u });
  const eyeRef = useRef<V3>(START.p);
  /** The path actually ridden, and where you stopped to look. */
  const rideRef = useRef<V3[]>([]);
  const stopsRef = useRef<{ at: V3; title: string }[]>([]);
  const regionRef = useRef('');
  const overlookRef = useRef({ on: false, amount: 0 });
  const memRef = useRef<Memory>({ seen: {}, walked: [] });

  const [started, setStarted] = useState(false);
  const [hereId, setHereId] = useState('');
  const [credit, setCredit] = useState<FallNode['credit'] | null>(null);
  const [overlooking, setOverlooking] = useState(false);
  const [failed, setFailed] = useState(false);
  // the doorway: where you want to enter (open on the first page, and on asking while falling)
  const [door, setDoor] = useState(false);
  const [doorText, setDoorText] = useState('');
  const [doorBusy, setDoorBusy] = useState(false);
  const [doorNote, setDoorNote] = useState<string | null>(null);
  const [doorChoice, setDoorChoice] = useState<Extract<Entrance, { kind: 'choose' }>['options'] | null>(null);
  const allowed = useSyncExternalStore(
    noop,
    () => samplesAllowed(process.env.NEXT_PUBLIC_DEPLOY_ENV, window.location.hostname),
    () => null
  );

  /** Any attention at all: the current will not let you settle while you are paying it. */
  const attend = useCallback(() => {
    attendedRef.current = true;
    idleRef.current = 0;
    settlingRef.current = false;
  }, []);

  /**
   * Once what a subject leads to is known, the split at it forms: its branches, each where its
   * strand puts it (the relationship you rode in on is behind you, not a branch).
   */
  const formFork = useCallback((id: string) => {
    const leg = legRef.current;
    const pl = placesRef.current.get(id);
    const strands = strandsRef.current.get(id);
    if (!leg || leg.to !== id || !pl || !strands) return;
    const cameFrom = leg.from;
    // except where you crossed between knowledge and a person's work: the way back across stays open
    const crossed = !!cameFrom && isWiki(cameFrom) !== isWiki(id);
    let chosen = chooseOpenings(strands.filter((s) => s.to !== cameFrom || crossed));
    // nothing else leads on: the only way is back the way you came
    if (!chosen.length && cameFrom) chosen = strands.filter((s) => s.to === cameFrom).slice(0, 1);
    const placed = new Map<string, V3>();
    for (const [pid, p] of placesRef.current) if (pid !== id) placed.set(pid, p.frame.p);
    const place = () => {
      const open = openingsAround(pl.frame, chosen, placed);
      // earning the spiral: what your route keeps circling pulls the branches that link to it onto
      // an orbit around it (knowledge says what links where; your route says what you keep coming round)
      const centres = circling(routeRef.current, (x) => strandsRef.current.get(x), id);
      const at = (cid: string, from: string[]): V3 => {
        const p = placesRef.current.get(cid);
        if (p) return p.frame.p;
        let sum: V3 = [0, 0, 0];
        for (const f of from) sum = add(sum, placesRef.current.get(f)?.frame.p ?? [0, 0, 0]);
        return scale(sum, 1 / from.length);
      };
      centresRef.current = [...centres].map(([cid, c]) => ({ id: cid, title: c.title, at: at(cid, c.from), n: c.n }));
      const around = new Map<string, number>();
      return open.map((o) => {
        if (o.back) return o;
        let best: (typeof centresRef.current)[number] | null = null;
        for (const c of centresRef.current) {
          const links = o.strand.to === c.id || !!strandsRef.current.get(o.strand.to)?.some((x) => x.to === c.id && x.strength >= 0.45);
          if (links && (!best || c.n > best.n)) best = c;
        }
        if (!best) return o;
        const k = around.get(best.id) ?? 0;
        around.set(best.id, k + 1);
        const pull = Math.min(1, (best.n - 2) / 2);
        const pos = o.strand.to === best.id ? lerp3(o.pos, add(best.at, scale(pl.frame.f, 0.6)), pull) : orbit(best.at, pl.frame, o.pos, pull, k);
        return { ...o, pos };
      });
    };
    forkRef.current = { id, openings: place() };
    statusRef.current = chosen.length ? undefined : 'nothing leads on from here that both sides name.';
    // the split after this one forms too (seen faintly); once known, this split re-forms around what
    // it reveals (branches ease to where they now belong)
    const g = graphRef.current;
    if (!g) return;
    Promise.allSettled(
      forkRef.current.openings.map((o) =>
        strandsRef.current.has(o.strand.to)
          ? Promise.resolve()
          : g.strands(o.strand.to).then((s) => {
              strandsRef.current.set(o.strand.to, s);
            })
      )
    ).then(() => {
      if (legRef.current?.to === id && forkRef.current?.id === id) forkRef.current = { id, openings: place() };
    });
  }, []);

  const load = useCallback(
    (id: string) => {
      const g = graphRef.current;
      if (!g) return;
      const known = strandsRef.current.get(id) ?? g.known?.(id);
      if (known) {
        strandsRef.current.set(id, known);
        formFork(id);
      } else {
        statusRef.current = 'finding where this leads.';
        setFailed(false);
        g.strands(id)
          .then((s) => {
            strandsRef.current.set(id, s);
            formFork(id);
          })
          .catch(() => {
            if (legRef.current?.to !== id) return;
            statusRef.current = UNREACHABLE;
            setFailed(true);
          });
      }
      if (!nodesRef.current.has(id))
        g.node(id)
          .then((n) => {
            nodesRef.current.set(id, n);
            if (regionRef.current === id) setCredit(n.credit ?? null);
          })
          .catch(() => {});
    },
    [formFork]
  );

  const remember = (from: string | null, to: string) => {
    const m = memRef.current;
    m.seen[to] = (m.seen[to] ?? 0) + 1;
    if (from && !m.walked.includes(`${from}\u0001${to}`)) m.walked.push(`${from}\u0001${to}`);
    writeMemory(m);
  };

  const begin = useCallback(
    (id: string, title: string) => {
      placesRef.current = new Map([[id, { id, title, frame: START, passed: [] }]]);
      routeRef.current = [id];
      // you are already moving when you arrive: a little way up the current into where you entered
      legRef.current = leadIn(START, id);
      sRef.current = 0.2;
      speedRef.current = CRUISE * 0.8;
      forkRef.current = null;
      shownPosRef.current = new Map();
      capturedRef.current = null;
      centresRef.current = [];
      rideRef.current = [];
      stopsRef.current = [];
      stillRef.current = { t: 0, amount: 0, marked: false };
      leanRef.current = { x: 0, y: 0, src: 'keys' };
      holdRef.current = false;
      idleRef.current = 0;
      attendedRef.current = false;
      settlingRef.current = false;
      camRef.current = { f: START.f, u: START.u };
      overlookRef.current.on = false;
      setOverlooking(false);
      setCredit(null);
      regionRef.current = id;
      setHereId(id);
      setStarted(true);
      remember(null, id);
      load(id);
    },
    [load]
  );

  /**
   * Passing the split: the branch that has you becomes the relationship you ride. The branches not
   * taken stay, as stubs, part of where you have been.
   */
  const pass = useCallback(
    (over: number) => {
      const leg = legRef.current;
      const fork = forkRef.current;
      const B = leg ? placesRef.current.get(leg.to) : undefined;
      if (!leg || !fork || fork.id !== leg.to || !B || !fork.openings.length) return false;
      const target = fork.openings.find((o) => o.strand.to === capturedRef.current) ?? branchFor(B.frame, fork.openings, leanRef.current);
      if (!target) return false;
      const pos = shownPosRef.current.get(target.strand.to) ?? target.pos;
      B.passed = fork.openings.filter((o) => o !== target && !o.back).map((o) => ({ to: o.strand.to, pos: shownPosRef.current.get(o.strand.to) ?? o.pos }));
      const to = target.strand.to;
      const existing = placesRef.current.get(to);
      const frame = arrive(B.frame, existing ? existing.frame.p : pos);
      if (existing) existing.frame = frame;
      else
        placesRef.current.set(to, {
          id: to,
          title: target.strand.title,
          frame,
          passed: [],
          via: { from: B.id, why: target.strand.why, strength: target.strand.strength, bearing: target.strand.bearing, shape: target.strand.shape },
        });
      const next = legOf(B.id, to, B.frame, frame, target.strand.strength, target.strand.why, !!target.strand.human);
      legRef.current = next;
      sRef.current = Math.min(0.5, (over * leg.length) / next.length);
      routeRef.current.push(to);
      remember(B.id, to);
      // inattention: subjects passed with no attention at all, and the current lets you settle
      if (attendedRef.current) idleRef.current = 0;
      else idleRef.current += 1;
      attendedRef.current = false;
      if (idleRef.current >= SETTLE_AFTER) settlingRef.current = true;
      forkRef.current = null;
      shownPosRef.current = new Map();
      capturedRef.current = null;
      setFailed(false);
      load(to);
      return true;
    },
    [load]
  );

  // for checking in development only: the ride, the split ahead, and steering by hand
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    (window as unknown as { __fall?: unknown }).__fall = {
      leg: () => ({ from: legRef.current?.from, to: legRef.current?.to, s: sRef.current, speed: speedRef.current, still: stillRef.current.amount, settling: settlingRef.current, idle: idleRef.current }),
      fork: () => forkRef.current?.openings.map((o) => ({ to: o.strand.to, title: o.strand.title, strength: o.strand.strength, human: !!o.strand.human })) ?? null,
      captured: () => capturedRef.current,
      route: () => [...routeRef.current],
      stops: () => stopsRef.current.map((s) => s.title),
      enter: (id: string, title: string) => begin(id, title),
      lean: (x: number, y: number) => {
        leanRef.current = { x, y, src: 'mouse' };
        attend();
      },
      hold: (on: boolean) => {
        holdRef.current = on;
        attend();
      },
    };
  }, [begin, attend]);

  /** Search chooses where you enter; the Fall determines where you go. */
  const enterBy = async (text: string) => {
    if (doorBusy || !text.trim()) return;
    setDoorBusy(true);
    setDoorNote(null);
    setDoorChoice(null);
    const r = await resolveEntrance(text);
    setDoorBusy(false);
    if (r.kind === 'enter') {
      setDoor(false);
      setDoorText('');
      begin(r.id, r.title);
    } else if (r.kind === 'choose') setDoorChoice(r.options);
    else setDoorNote(r.kind === 'none' ? (isDescription(text) ? 'nothing matches that yet.' : 'nothing by that name.') : 'Wikipedia could not be reached just now.');
  };
  const enterAt = (id: string, title: string) => {
    setDoor(false);
    setDoorChoice(null);
    setDoorText('');
    begin(id, title);
  };

  const doorway = (
    <form
      className={styles.door}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        enterBy(doorText);
      }}
    >
      <input
        className={styles.doorInput}
        type="search"
        value={doorText}
        autoFocus
        placeholder="where do you want to enter?"
        aria-label="Where do you want to enter? A name, or what you are curious about."
        onChange={(e) => {
          setDoorText(e.target.value);
          setDoorNote(null);
          setDoorChoice(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && started) setDoor(false);
        }}
      />
      {doorBusy && <p className={styles.doorNote}>finding it.</p>}
      {doorNote && <p className={styles.doorNote}>{doorNote}</p>}
      {doorChoice && (
        <div className={styles.doorChoice}>
          {doorChoice.map((o) => (
            <button key={o.id} type="button" className={styles.start} onClick={() => enterAt(o.id, o.title)}>
              {o.title}
              {o.about ? <span className={styles.about}>{o.about}</span> : null}
            </button>
          ))}
        </div>
      )}
    </form>
  );

  const toggleOverlook = () => {
    overlookRef.current.on = !overlookRef.current.on;
    setOverlooking(overlookRef.current.on);
  };

  // the source, and a snapshot of it for the first steps (fetched from this site, sent nowhere)
  useEffect(() => {
    if (!allowed) return;
    memRef.current = readMemory();
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    let cancelled = false;
    fetch('/fall/wiki-snapshot.json')
      .then((r) => (r.ok ? (r.json() as Promise<Snapshot>) : null))
      .catch(() => null)
      .then((snapshot) => {
        if (cancelled) return;
        // knowledge and a maker's own work in one space, joined only where the maker says so (only
        // pieces open to everyone; built here, sent nowhere)
        graphRef.current = joinSources(createWikiGraph({ storage, snapshot }), createWhoeuvreGraph(buildWorld([])), BRIDGES, AUTHOR.name);
        const cur = legRef.current?.to;
        if (cur) load(cur);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, load]);

  // riding, and drawing, every frame
  useEffect(() => {
    if (!allowed || !started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let last = performance.now();
    let time = 0;
    const titleOfPlace = (id: string) => nodesRef.current.get(id)?.title ?? placesRef.current.get(id)?.title ?? '';
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      const rm = reduced.matches;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!legRef.current) return;

      // leaning: held keys lean you; a thumb's lean relaxes once lifted; a mouse's stays where it points
      const keys = keysRef.current;
      const L = leanRef.current;
      const kx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      const ky = (keys.has('arrowdown') ? 1 : 0) - (keys.has('arrowup') ? 1 : 0);
      if (kx || ky) {
        L.x = clamp(L.x + kx * dt * 2, -1, 1);
        L.y = clamp(L.y + ky * dt * 2, -1, 1);
        L.src = 'keys';
      } else if (L.src !== 'mouse' && !pressRef.current?.steering) {
        const k = Math.exp(-dt / 2.2);
        L.x *= k;
        L.y *= k;
      }

      // momentum: the current's pace, slowed by holding, by settling, and by a split not yet formed
      const holding = holdRef.current || keys.has('s') || keys.has(' ') || overlookRef.current.on;
      let leg = legRef.current;
      let fork = forkRef.current?.id === leg.to ? forkRef.current : null;
      const s0 = sRef.current;
      const cruise = CRUISE * (rm ? 0.6 : 1) * (keys.has('w') ? 1.5 : 1);
      let target = cruise * (rm ? 1 : paceAt(s0, leg.strength, densityOf(strandsRef.current.get(leg.to))));
      if (settlingRef.current) target = Math.min(target, settleSpeed(s0, cruise));
      // the way ahead still forming (or nothing leads on): the current slows, and waits inside the subject
      if (!fork || !fork.openings.length) target = Math.min(target, cruise * clamp((0.93 - s0) / 0.35, 0, 1));
      if (holding) target = 0;
      let speed = easeSpeed(speedRef.current, target, dt, holding);
      if (target === 0 && speed < 0.004) speed = 0;
      speedRef.current = speed;
      let s = s0 + (speed * dt) / leg.length;
      if (s >= 1) {
        if (pass(s - 1)) {
          leg = legRef.current!;
          fork = null;
          s = sRef.current;
        } else s = 1;
      }
      sRef.current = s;

      // stopping is understanding: the stop begins at once, what is here resolves a beat later
      const st = stillRef.current;
      if (speed < 0.05) st.t += dt;
      else {
        st.t = 0;
        st.marked = false;
      }
      const wantStill = smooth(0.15, 0.6, st.t);
      st.amount += (wantStill - st.amount) * (1 - Math.exp(-dt / (wantStill > st.amount ? 0.25 : 0.1)));

      const B = placesRef.current.get(leg.to);
      if (!B) return;
      const zone = zoneAt(s, !!leg.from);

      // the split ahead: each branch where it is drawn, easing to where it now belongs
      const settle = rm ? 1 : 1 - Math.exp(-dt * 3);
      const opens = (fork?.openings ?? []).map((o) => {
        const was = shownPosRef.current.get(o.strand.to);
        const pos = was ? lerp3(was, o.pos, settle) : o.pos;
        shownPosRef.current.set(o.strand.to, pos);
        return { ...o, pos };
      });
      // which branch has you: the one you lean toward (or the main current), more and more as you near it
      const captured = opens.length ? branchFor(B.frame, opens, L) : null;
      capturedRef.current = captured?.strand.to ?? null;
      const cap = captured ? captureAt(s) : 0;
      const branches: Branch[] = opens.map((o) => {
        const bf = arrive(B.frame, o.pos);
        const onward = strandsRef.current.get(o.strand.to);
        return {
          id: o.strand.to,
          title: o.strand.title,
          why: o.strand.why,
          strength: o.strand.strength,
          human: o.strand.human,
          path: between(B.frame, bf),
          onward: onward ? openingsAround(bf, chooseOpenings(onward.filter((x) => x.to !== B.id), 4)).map((x) => between(bf, arrive(bf, x.pos))) : [],
        };
      });

      // the camera: riding the current, drawn toward the branch that has you, turned a little by attention
      const base = blend(leg.a, leg.b, s, leg.path);
      let eye = base.p;
      let f = base.f;
      const capB = branches.find((b) => b.id === capturedRef.current);
      if (capB && cap > 0) {
        const cp = capB.path(0.3);
        f = norm(lerp3(f, norm(sub(cp, eye)), 0.4 * cap));
        const off = sub(cp, B.frame.p);
        const side = sub(off, scale(B.frame.f, dot(off, B.frame.f)));
        if (len(side) > 1e-3) eye = add(eye, scale(norm(side), 0.08 * cap));
      }
      const r0 = norm(cross(f, base.u));
      if (Math.hypot(L.x, L.y) > LEAN_DEAD && !rm) f = norm(add(f, add(scale(r0, 0.14 * L.x), scale(base.u, -0.14 * L.y))));
      const cam = camRef.current;
      const kc = rm ? 1 : 1 - Math.exp(-dt / 0.2);
      const cf = norm(lerp3(cam.f, f, kc));
      let cu = lerp3(cam.u, base.u, kc);
      cu = norm(sub(cu, scale(cf, dot(cu, cf))));
      camRef.current = { f: cf, u: cu };
      eyeRef.current = eye;

      // the path actually ridden
      const ride = rideRef.current;
      if (!ride.length || len(sub(eye, ride[ride.length - 1])) > 0.1) {
        ride.push(eye);
        if (ride.length > 4000) ride.shift();
      }
      const aheadT = titleOfPlace(leg.to);
      const behindT = leg.from ? titleOfPlace(leg.from) : '';
      // where you stopped to look, kept as a landmark on your path
      if (st.t > 0.6 && !st.marked && !overlookRef.current.on) {
        st.marked = true;
        stopsRef.current.push({ at: eye, title: zone === 'arriving' ? aheadT : zone === 'leaving' ? behindT : `between ${behindT} and ${aheadT}` });
      }
      // the subject you are in (for the credit): the one ahead once past halfway
      const region = s >= 0.5 || !leg.from ? leg.to : leg.from;
      if (region !== regionRef.current) {
        regionRef.current = region;
        setHereId(region);
        setCredit(nodesRef.current.get(region)?.credit ?? null);
      }

      // held still: a person's own work a step or two on (when it is not a branch here already)
      let roseNear: { title: string; through: string; path: (t: number) => V3 } | null = null;
      if (st.amount > 0.02 && !branches.some((b) => b.human) && !leg.human) {
        if (zone === 'arriving') {
          for (const b of branches) {
            const hs = strandsRef.current.get(b.id)?.find((x) => x.human);
            if (hs) {
              roseNear = { title: hs.title, through: b.title, path: b.path };
              break;
            }
          }
        } else {
          const hs = strandsRef.current.get(leg.to)?.find((x) => x.human);
          if (hs) roseNear = { title: hs.title, through: aheadT, path: (t: number) => leg.path(s + (1 - s) * t) };
        }
      }

      // looking back: up and away from where you are, until the whole path you rode is in view
      const ov = overlookRef.current;
      ov.amount += ((ov.on ? 1 : 0) - ov.amount) * (rm ? 1 : 1 - Math.exp(-dt * 3));
      if (ov.amount > 0.02) {
        const o = overlook([...placesRef.current.values()]);
        const k = ease(ov.amount);
        const from: Cam = { eye, at: add(eye, cf), up: cu };
        const c: Cam = { eye: lerp3(from.eye, o.eye, k), at: lerp3(from.at, o.at, k), up: norm(lerp3(from.up, o.up, k)) };
        drawFall(ctx, viewOf(c, w, h), {
          places: placesRef.current,
          route: routeRef.current,
          openings: [],
          aimed: null,
          lean: 0,
          beyond: new Map(),
          reveal: () => 1,
          centres: centresRef.current,
          here: null,
          seen: (id) => memRef.current.seen[id] ?? 0,
          walked: (a, b) => memRef.current.walked.includes(`${a}\u0001${b}`),
          overlooking: ov.amount,
          arriving: 0,
          serif,
          ride,
          stops: stopsRef.current,
        });
        return;
      }

      const v = viewOf({ eye, at: add(eye, cf), up: cu }, w, h);
      // a wide view from inside the current
      v.F = 0.42 * Math.max(Math.min(w, h), 0.6 * Math.max(w, h));
      const node = (id: string | null) => (id ? nodesRef.current.get(id) : undefined);
      drawStream(ctx, v, {
        leg: { path: leg.path, s, length: leg.length, strength: leg.strength, human: leg.human, why: leg.why },
        behind: leg.from ? { title: behindT, line: node(leg.from)?.line } : null,
        ahead: { title: aheadT, line: node(leg.to)?.line },
        branches,
        captured: capturedRef.current,
        capture: cap,
        still: st.amount,
        zone,
        roseNear,
        status: s > 0.55 ? statusRef.current : undefined,
        time,
        reduced: rm,
        serif,
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [allowed, started, serif, pass]);

  // a thumb: held, you slow to a stop; dragged, you lean (steer). A mouse leans where it points, and
  // held, stops you too.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (overlookRef.current.on) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pressRef.current = { x: e.clientX, y: e.clientY, lx: leanRef.current.x, ly: leanRef.current.y, moved: 0, steering: false };
    holdRef.current = true;
    attend();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (overlookRef.current.on) return;
    const r = e.currentTarget.getBoundingClientRect();
    const M = Math.min(r.width, r.height);
    if (e.pointerType === 'mouse') {
      let x = (e.clientX - r.left - r.width / 2) / (0.42 * M);
      let y = (e.clientY - r.top - r.height * 0.46) / (0.42 * M);
      const m = Math.hypot(x, y);
      if (m > 1) [x, y] = [x / m, y / m];
      leanRef.current = { x, y, src: 'mouse' };
      attend();
      return;
    }
    const p = pressRef.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.moved = Math.max(p.moved, Math.hypot(dx, dy));
    if (p.moved > 10) {
      // dragging is steering, not stopping: the current picks back up
      p.steering = true;
      holdRef.current = false;
      let x = p.lx + dx / (0.3 * M);
      let y = p.ly + dy / (0.3 * M);
      const m = Math.hypot(x, y);
      if (m > 1) [x, y] = [x / m, y / m];
      leanRef.current = { x, y, src: 'touch' };
      attend();
    }
  };
  const release = () => {
    pressRef.current = null;
    holdRef.current = false;
  };

  // desktop: A/D and the arrows lean, S or Space held stops you, W held hurries you on
  useEffect(() => {
    if (!started) return;
    const ours = ['w', 'a', 's', 'd', ' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' && overlookRef.current.on) {
        overlookRef.current.on = false;
        setOverlooking(false);
        return;
      }
      if (!ours.includes(k) || typing(e) || e.metaKey || e.ctrlKey || e.altKey || overlookRef.current.on) return;
      e.preventDefault();
      keysRef.current.add(k);
      attend();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const clear = () => keysRef.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [started, attend]);

  if (allowed === null) return <div className={styles.field} />;
  if (!allowed)
    return (
      <div className={styles.field}>
        <div className={styles.starts}>
          <p>This is only on previews for now.</p>
          <Link className={styles.start} href="/slate">
            to the Slate
          </Link>
        </div>
      </div>
    );

  return (
    <div className={styles.field}>
      {started && (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={0}
          aria-label="The Fall: you are moving through relationships. Drag, or move the mouse, to steer; hold to stop and see what is here."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') {
              leanRef.current = { x: 0, y: 0, src: 'mouse' };
              release();
            }
          }}
        />
      )}
      <div className={styles.label}>{!started || isWiki(hereId) ? 'examples from Wikipedia, for previews only' : `${AUTHOR.name}'s Whoeuvre, on a preview`}</div>
      <Link className={styles.home} href="/slate">
        slate
      </Link>
      {!started ? (
        <div className={styles.starts}>
          <h1>Fall through Wikipedia</h1>
          <p>Real articles, connected the way Wikipedia and DBpedia connect them. Where you go shapes the space you see.</p>
          {doorway}
          {!doorChoice && <p className={styles.or}>or begin somewhere:</p>}
          {!doorChoice &&
            WIKI_STARTS.map((t) => (
              <button key={t} type="button" className={styles.start} onClick={() => begin(wikiId(t), t)}>
                {t}
              </button>
            ))}
        </div>
      ) : (
        <>
          <div className={styles.actions}>
            {failed && !overlooking && (
              <button type="button" className={styles.quiet} onClick={() => legRef.current && load(legRef.current.to)}>
                try again
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={toggleOverlook}>
              {overlooking ? 'return' : 'look back'}
            </button>
            {!overlooking && (
              <button type="button" className={styles.quiet} onClick={() => setDoor(true)}>
                enter elsewhere
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={() => setStarted(false)}>
              start again
            </button>
          </div>
          <div className={styles.credit}>
            {credit ? (
              <>
                From{' '}
                <a href={credit.href} target="_blank" rel="noreferrer">
                  {credit.label}
                </a>
                {credit.license && credit.licenseHref ? (
                  <>
                    {' '}
                    (
                    <a href={credit.licenseHref} target="_blank" rel="noreferrer">
                      {credit.license}
                    </a>
                    )
                  </>
                ) : null}
                {credit.data ? (
                  <>
                    . Connections from{' '}
                    <a href={credit.data.href} target="_blank" rel="noreferrer">
                      {credit.data.label}
                    </a>
                    .
                  </>
                ) : null}
              </>
            ) : (
              <>{isWiki(hereId) ? `From Wikipedia and DBpedia: ${titleOf(hereId)}` : `From ${AUTHOR.name}'s Whoeuvre`}</>
            )}
          </div>
          {door && (
            <div
              className={styles.doorLayer}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setDoor(false);
              }}
            >
              {doorway}
            </div>
          )}
        </>
      )}
    </div>
  );
}
