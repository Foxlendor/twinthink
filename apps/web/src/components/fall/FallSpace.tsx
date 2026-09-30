'use client';

// The Fall, formed by relationships (preview only): real examples from Wikipedia, as a river.
//
// Motion is always present; travel is voluntary. Traveling, a current carries you through one
// relationship. Arriving, you are Located: you stay at the subject until you leave, while the web
// around you keeps flowing. Arrival gives you permission to do nothing.
//
// Look around (drag, or A/D and the arrows). Whatever current you look at resolves: its name, then
// why it connects, and, if you keep looking past that, it begins to carry you. Look away before
// you are properly in it and you drift back. Turn around: the passage you arrived through is still
// there, and looked at the same way it carries you back along the path you actually came. W leans
// you in sooner. Look back to see the path you rode and where you stayed.
//
// Nothing here reaches our server. Every id begins "sample/"; what you have seen and ridden is
// kept on this device only.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import styles from './FallSpace.module.css';
import { FallNode, Graph, Strand, chooseOpenings } from '@/lib/fall/graph';
import { Opening, Place, START, V3, add, arrive, between, blend, circling, len, lerp3, norm, openingsAround, orbit, overlook, scale, sub } from '@/lib/fall/space';
import { Cam, drawFall, viewOf } from '@/lib/fall/draw';
import { CurrentLabel, LeavingCurrent, RouteCurrent, drawCurrents } from '@/lib/fall/drawCurrents';
import { COMMITTED_AFTER, CRUISE, CurrentPath, Look, REACH, REST, arrivalSpeed, attention, currentPath, easeSpeed, entryPath, isReverseOf, lookAt, lookFor, lookedAt, paceOf, reversePath, sBefore } from '@/lib/fall/locomotion';
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

/** Located: at a subject, resting on the passage you arrived by (at `s` along it). */
interface Located {
  kind: 'located';
  at: string;
  leg: CurrentPath;
  s: number;
  since: number;
  marked: boolean;
}
/**
 * Traveling along a relationship. Until you are properly in it (COMMITTED_AFTER), it is only a pull, and
 * looking away lets you drift back to where you were (`anchor`).
 */
interface Traveling {
  kind: 'travel';
  leg: CurrentPath;
  s: number;
  s0: number;
  speed: number;
  /** Where the view started from, eased away as you go (so nothing jumps). */
  offset: V3;
  way: string;
  anchor: Located | null;
  taken: boolean;
  /** What taking it means: going on into a new relationship, or retracing (the spine pops). */
  on: 'forward' | 'back';
}
type Motion = Located | Traveling;

/** A current you could take from where you are: its mouth (what you look at), and the leg it is. */
interface ReachableCurrent {
  id: string;
  title: string;
  why?: string;
  strength: number;
  human?: boolean;
  back: boolean;
  mouth: V3;
  leg: CurrentPath;
  s0: number;
  opening?: Opening;
}

interface Leaving {
  id: string;
  openings: Opening[];
}

export default function FallSpace({ serif }: { serif: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const placesRef = useRef(new Map<string, Place>());
  /** Every subject reached, in order (for looking back). */
  const routeRef = useRef<string[]>([]);
  /** Your own path, as a spine of the relationships you went on by: retracing takes them off again. */
  const routeStackRef = useRef<CurrentPath[]>([]);
  const nodesRef = useRef(new Map<string, FallNode>());
  const strandsRef = useRef(new Map<string, Strand[]>());
  const leavingRef = useRef(new Map<string, Leaving>());
  const centresRef = useRef<{ id: string; title: string; at: V3; n: number }[]>([]);
  const statusRef = useRef<string | undefined>(undefined);
  const motionRef = useRef<Motion | null>(null);
  /** Where each current is drawn: easing toward where it now belongs, as the split forms. */
  const shownPosRef = useRef(new Map<string, V3>());
  const reachableRef = useRef<ReachableCurrent[]>([]);
  /** Where you look, relative to the way you are going (or went); how long you have looked at one current. */
  const lookRef = useRef<Look>({ yaw: 0, pitch: 0 });
  const attnRef = useRef<{ id: string | null; t: number }>({ id: null, t: 0 });
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const keysRef = useRef(new Set<string>());
  const camRef = useRef<{ f: V3; u: V3 }>({ f: START.f, u: START.u });
  /** The path actually ridden, and where you stayed a while. */
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

  /**
   * Once what a subject leads to is known, the currents leaving it form, each where its strand puts
   * it (the relationship you came in by is behind you, not one of them).
   */
  const formLeaving = useCallback((id: string) => {
    const pl = placesRef.current.get(id);
    const strands = strandsRef.current.get(id);
    if (!pl || !strands) return;
    const inLeg = routeStackRef.current[routeStackRef.current.length - 1];
    const cameFrom = inLeg?.to === id ? inLeg.from : null;
    // except where you crossed between knowledge and a person's work: the way back across stays open
    const crossed = !!cameFrom && isWiki(cameFrom) !== isWiki(id);
    const chosen = chooseOpenings(strands.filter((s) => s.to !== cameFrom || crossed));
    const placed = new Map<string, V3>();
    for (const [pid, p] of placesRef.current) if (pid !== id) placed.set(pid, p.frame.p);
    const place = () => {
      const open = openingsAround(pl.frame, chosen, placed);
      // earning the spiral: what your route keeps circling pulls the currents that link to it onto
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
    leavingRef.current.set(id, { id, openings: place() });
    statusRef.current = chosen.length ? undefined : 'nothing leads on from here that both sides name.';
    // where each current leads in turn forms too (seen faintly); once known, this subject's currents
    // re-form around what it reveals
    const g = graphRef.current;
    if (!g) return;
    Promise.allSettled(
      chosen.map((s) =>
        strandsRef.current.has(s.to)
          ? Promise.resolve()
          : g.strands(s.to).then((x) => {
              strandsRef.current.set(s.to, x);
            })
      )
    ).then(() => leavingRef.current.set(id, { id, openings: place() }));
  }, []);

  const load = useCallback(
    (id: string) => {
      const g = graphRef.current;
      if (!g) return;
      const known = strandsRef.current.get(id) ?? g.known?.(id);
      if (known) {
        strandsRef.current.set(id, known);
        formLeaving(id);
      } else {
        statusRef.current = 'finding where this leads.';
        setFailed(false);
        g.strands(id)
          .then((s) => {
            strandsRef.current.set(id, s);
            formLeaving(id);
          })
          .catch(() => {
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
    [formLeaving]
  );

  const remember = (from: string | null, to: string) => {
    const m = memRef.current;
    if (!from) m.seen[to] = (m.seen[to] ?? 0) + 1;
    if (from && !m.walked.includes(`${from}\u0001${to}`)) m.walked.push(`${from}\u0001${to}`);
    writeMemory(m);
  };

  const begin = useCallback(
    (id: string, title: string) => {
      placesRef.current = new Map([[id, { id, title, frame: START, passed: [] }]]);
      routeRef.current = [id];
      const lead = entryPath(START, id);
      routeStackRef.current = [lead];
      // you are already moving when you arrive: a little way up the current into where you entered
      motionRef.current = { kind: 'travel', leg: lead, s: 0.1, s0: 0, speed: CRUISE, offset: [0, 0, 0], way: id, anchor: null, taken: true, on: 'forward' };
      leavingRef.current = new Map();
      shownPosRef.current = new Map();
      centresRef.current = [];
      rideRef.current = [];
      stopsRef.current = [];
      lookRef.current = { yaw: 0, pitch: 0 };
      attnRef.current = { id: null, t: 0 };
      camRef.current = { f: START.f, u: START.u };
      overlookRef.current.on = false;
      setOverlooking(false);
      setCredit(null);
      regionRef.current = id;
      setHereId(id);
      setStarted(true);
      load(id);
    },
    [load]
  );

  /** Properly in a current: it has you. Going on adds it to your path; going back takes it off. */
  const take = useCallback(
    (tr: Traveling) => {
      tr.taken = true;
      tr.anchor = null;
      const leg = tr.leg;
      if (tr.on === 'back') {
        routeStackRef.current.pop();
        routeRef.current.push(leg.to);
      } else {
        const from = placesRef.current.get(leg.from ?? '');
        const w = reachableRef.current.find((x) => x.id === tr.way);
        const existing = placesRef.current.get(leg.to);
        if (existing) existing.frame = leg.b;
        else if (from && w)
          placesRef.current.set(leg.to, {
            id: leg.to,
            title: w.title,
            frame: leg.b,
            passed: [],
            via: { from: from.id, why: w.why, strength: w.strength, bearing: w.opening?.strand.bearing ?? 'beside', shape: w.opening?.strand.shape },
          });
        // the currents not taken there stay, as stubs, part of where you have been
        if (from) from.passed = (leavingRef.current.get(from.id)?.openings ?? []).filter((o) => o.strand.to !== leg.to && !o.back).map((o) => ({ to: o.strand.to, pos: shownPosRef.current.get(o.strand.to) ?? o.pos }));
        routeStackRef.current.push(leg);
        routeRef.current.push(leg.to);
        remember(leg.from, leg.to);
      }
      setFailed(false);
      load(leg.to);
    },
    [load]
  );

  // for checking in development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    (window as unknown as { __fall?: unknown }).__fall = {
      state: () => {
        const m = motionRef.current;
        if (!m) return null;
        return m.kind === 'located'
          ? { kind: m.kind, at: m.at, since: m.since, back: !!m.leg.back }
          : { kind: m.kind, from: m.leg.from, to: m.leg.to, s: m.s, speed: m.speed, taken: m.taken, on: m.on };
      },
      ways: () => reachableRef.current.map((w) => ({ id: w.id, title: w.title, back: w.back, human: !!w.human })),
      attention: () => ({ ...attnRef.current }),
      look: (yaw: number, pitch = 0) => {
        lookRef.current = { yaw, pitch };
      },
      /** Look straight at a current by id (as if you had turned to it). */
      face: (id: string) => {
        const m = motionRef.current;
        const w = reachableRef.current.find((x) => x.id === id);
        if (!m || !w) return false;
        const eye = m.kind === 'located' ? m.leg.path(m.s) : m.leg.path(m.s);
        const fr = blend(m.leg.a, m.leg.b, m.s, m.leg.path);
        lookRef.current = lookFor(fr, sub(w.mouth, eye));
        return true;
      },
      route: () => [...routeRef.current],
      spine: () => routeStackRef.current.map((l) => `${l.from}>${l.to}`),
      stops: () => stopsRef.current.map((s) => s.title),
      enter: (id: string, title: string) => begin(id, title),
    };
  }, [begin]);

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
        const m = motionRef.current;
        const cur = m ? (m.kind === 'located' ? m.at : m.leg.to) : null;
        if (cur) load(cur);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, load]);

  // moving (or not), and drawing, every frame
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

    /** The currents you could take from a subject, arriving (or arrived) along `arrival`. */
    const currentsAt = (at: string, arrival: CurrentPath, s: number): ReachableCurrent[] => {
      const pl = placesRef.current.get(at);
      if (!pl) return [];
      const out: ReachableCurrent[] = [];
      const settle = reduced.matches ? 1 : 1 - Math.exp(-0.016 * 3);
      for (const o of leavingRef.current.get(at)?.openings ?? []) {
        // the one you arrived along (retracing, you came back up it) is the way behind you instead
        if (arrival.back && o.strand.to === arrival.from) continue;
        const was = shownPosRef.current.get(o.strand.to);
        const pos = was ? lerp3(was, o.pos, settle) : o.pos;
        shownPosRef.current.set(o.strand.to, pos);
        const known = placesRef.current.get(o.strand.to);
        const leg = currentPath(at, o.strand.to, pl.frame, arrive(pl.frame, known ? known.frame.p : pos), o.strand.strength, o.strand.why, !!o.strand.human);
        out.push({ id: o.strand.to, title: o.strand.title, why: o.strand.why, strength: o.strand.strength, human: o.strand.human, back: false, mouth: leg.path(0.35), leg, s0: 0, opening: o });
      }
      if (arrival.from) {
        // behind you: the passage you arrived through, still there, the way back along your path
        const back = reversePath(arrival);
        out.push({ id: `back:${arrival.from}`, title: titleOfPlace(arrival.from), why: arrival.why, strength: arrival.strength, human: arrival.human, back: true, mouth: arrival.path(Math.max(0, s - 1.4 / arrival.length)), leg: back, s0: 1 - s });
      }
      if (arrival.back) {
        // arrived by retracing: further back along your path, if it goes further
        const inLeg = routeStackRef.current[routeStackRef.current.length - 1];
        if (inLeg?.to === at && inLeg.from) {
          const further = reversePath(inLeg);
          out.push({ id: `back:${inLeg.from}`, title: titleOfPlace(inLeg.from), why: inLeg.why, strength: inLeg.strength, human: inLeg.human, back: true, mouth: further.path(0.35), leg: further, s0: 0 });
        }
      }
      return out;
    };

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
      let m = motionRef.current;
      if (!m) return;

      // turning where you look: A/D and the arrows (a drag is handled as it happens)
      const keys = keysRef.current;
      const turnX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      const turnY = (keys.has('arrowup') ? 1 : 0) - (keys.has('arrowdown') ? 1 : 0);
      if (turnX || turnY) lookRef.current = { yaw: lookRef.current.yaw + turnX * 1.4 * dt, pitch: clamp(lookRef.current.pitch + turnY * 1.0 * dt, -1.3, 1.3) };

      // the subject you are at (or coming to), and the currents you could take from it
      const at = m.kind === 'located' ? m.at : m.leg.to;
      const arrival = m.kind === 'located' ? m.leg : m.anchor ? m.anchor.leg : m.leg;
      const restS = m.kind === 'located' ? m.s : m.anchor ? m.anchor.s : sBefore(m.leg, REST);
      const ways = m.kind === 'travel' && !m.taken && m.anchor ? currentsAt(m.anchor.at, m.anchor.leg, m.anchor.s) : currentsAt(at, arrival, restS);
      // a current that is pulling you: what you look at along it stays ahead of you
      if (m.kind === 'travel' && !m.taken) {
        const tr = m;
        const wy = ways.find((x) => x.id === tr.way);
        if (wy) wy.mouth = tr.leg.path(Math.min(1, tr.s + 0.35));
      }
      reachableRef.current = ways;

      // where you are and which way you look
      const base = blend(m.leg.a, m.leg.b, m.s, m.leg.path);
      let eye = base.p;
      if (m.kind === 'travel') {
        const gone = Math.abs(m.s - m.s0) * m.leg.length;
        eye = add(eye, scale(m.offset, 1 - smooth(0, 1.1, gone)));
      }
      const view = lookAt(base, lookRef.current);

      // attention: what you look at resolves (name, then why), and past that it begins to carry you
      const approaching = m.kind === 'travel' && m.taken && (1 - m.s) * m.leg.length < REACH + 1.5;
      const lookable = m.kind === 'located' || approaching || (m.kind === 'travel' && !m.taken);
      const fid = lookable ? faced(eye, view.f, ways) : null;
      const at0 = attnRef.current;
      if (fid !== at0.id) attnRef.current = { id: fid, t: 0 };
      else if (fid) at0.t += dt * (keys.has('w') ? 3 : 1);
      const attn = attention(attnRef.current.t);
      const aimed = ways.find((x) => x.id === attnRef.current.id) ?? null;

      if (m.kind === 'located') {
        m.since += dt;
        if (!m.marked && m.since > 1.5) {
          m.marked = true;
          stopsRef.current.push({ at: eye, title: titleOfPlace(m.at) });
        }
        // keep looking past understanding, and the current begins to carry you
        if (aimed && attn.pull > 0) {
          const off = sub(eye, aimed.leg.path(aimed.s0));
          const tr: Traveling = { kind: 'travel', leg: aimed.leg, s: aimed.s0, s0: aimed.s0, speed: 0, offset: off, way: aimed.id, anchor: m, taken: false, on: aimed.leg.back ? 'back' : 'forward' };
          lookRef.current = lookFor(blend(tr.leg.a, tr.leg.b, tr.s, tr.leg.path), view.f);
          motionRef.current = m = tr;
        }
      } else {
        if (!m.taken) {
          // only a pull so far: it strengthens while you keep looking; look away and you drift back
          const pulling = attnRef.current.id === m.way ? attn.pull : 0;
          const target = pulling > 0 ? CRUISE * 0.7 * pulling : -0.5;
          m.speed = pulling > 0 ? easeSpeed(m.speed, target, dt) : Math.max(-0.5, m.speed - dt * 1.5);
          m.s += (m.speed * dt) / m.leg.length;
          if (m.s <= m.s0 && m.anchor) {
            const anchor = m.anchor;
            lookRef.current = lookFor(blend(anchor.leg.a, anchor.leg.b, anchor.s, anchor.leg.path), view.f);
            motionRef.current = m = anchor;
          } else if ((m.s - m.s0) * m.leg.length >= COMMITTED_AFTER) take(m);
        } else {
          // carried: full pace between subjects, arrival friction as you reach one
          const left = (1 - m.s) * m.leg.length;
          const cruise = CRUISE * (rm ? 0.6 : 1) * paceOf(m.leg.strength);
          m.speed = easeSpeed(m.speed, arrivalSpeed(left, cruise), dt);
          const restAt = sBefore(m.leg, REST);
          m.s = Math.min(restAt, m.s + (m.speed * dt) / m.leg.length);
          // far from any subject, the view settles back along the current (never while you look ahead to one)
          if (!approaching && !dragRef.current && !turnX && !turnY) {
            const k = 1 - Math.exp(-dt / 1.5);
            lookRef.current = { yaw: lookRef.current.yaw * (1 - k), pitch: lookRef.current.pitch * (1 - k) };
          }
          if (m.s >= restAt - 1e-4 && m.speed < 0.03) {
            // arrived. Already looking into one of its currents, past understanding: it carries you
            // straight on. Otherwise you are Located, and may stay as long as you like.
            const next = aimed && attn.pull > 0 && !aimed.back ? aimed : null;
            const located: Located = { kind: 'located', at: m.leg.to, leg: m.leg, s: m.s, since: 0, marked: false };
            remember(null, m.leg.to);
            if (next) {
              const tr: Traveling = { kind: 'travel', leg: next.leg, s: 0, s0: 0, speed: 0.4, offset: sub(eye, next.leg.path(0)), way: next.id, anchor: located, taken: false, on: 'forward' };
              lookRef.current = lookFor(blend(tr.leg.a, tr.leg.b, 0, tr.leg.path), view.f);
              motionRef.current = m = tr;
            } else motionRef.current = m = located;
          }
        }
      }

      // the camera, eased (a new relationship never jerks the view)
      const fr2 = blend(m.leg.a, m.leg.b, m.s, m.leg.path);
      const v2 = lookAt(fr2, lookRef.current);
      const cam = camRef.current;
      const kc = rm ? 1 : 1 - Math.exp(-dt / 0.18);
      const cf = norm(lerp3(cam.f, v2.f, kc));
      let cu = lerp3(cam.u, v2.u, kc);
      cu = norm(sub(cu, scale(cf, cf[0] * cu[0] + cf[1] * cu[1] + cf[2] * cu[2])));
      camRef.current = { f: cf, u: cu };

      const ride = rideRef.current;
      if (!ride.length || len(sub(eye, ride[ride.length - 1])) > 0.1) {
        ride.push(eye);
        if (ride.length > 4000) ride.shift();
      }
      // the subject you are at (for the credit): the one ahead once past halfway
      const legNow = m.leg;
      const region = m.kind === 'located' ? m.at : m.anchor ? m.anchor.at : m.s >= 0.5 || !legNow.from ? legNow.to : legNow.from;
      if (region !== regionRef.current) {
        regionRef.current = region;
        setHereId(region);
        setCredit(nodesRef.current.get(region)?.credit ?? null);
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

      // what is drawn: the relationship you are on, the ones either side of it on your path, and the
      // currents leaving the subject you are at (or coming to)
      const tubes: RouteCurrent[] = [];
      const seenLeg = new Set<CurrentPath>();
      const addTube = (l: CurrentPath | undefined, alpha: number, rose: (t: number) => boolean) => {
        if (!l || seenLeg.has(l)) return;
        seenLeg.add(l);
        tubes.push({ path: l.path, length: l.length, strength: l.strength, swellB: 1, alpha, roseAt: l.human ? rose : undefined });
      };
      const roseTo = (l: CurrentPath) => (l.back ? (t: number) => t < 0.55 : (t: number) => t > 0.45);
      addTube(m.leg, 1, roseTo(m.leg));
      if (m.kind === 'travel' && m.anchor) addTube(m.anchor.leg, 1, roseTo(m.anchor.leg));
      const sp = routeStackRef.current;
      for (const l of sp.slice(-2)) if (!seenLeg.has(l) && !(m.leg.back && m.leg.from === l.to && m.leg.to === l.from)) addTube(l, 0.7, (t) => t > 0.45);
      const forkAt = m.kind === 'travel' && !m.taken && m.anchor ? m.anchor.at : at;
      const forward = ways.filter((x) => !x.back);
      const branches: LeavingCurrent[] = forward.map((x) => {
        const onward = strandsRef.current.get(x.id);
        const bf = x.leg.b;
        const isAimed = aimed?.id === x.id;
        const pull = m.kind === 'travel' && !m.taken && m.way === x.id ? 1 : 0;
        return {
          id: x.id,
          path: x.leg.path,
          length: x.leg.length,
          strength: x.strength,
          human: x.human,
          emph: isAimed ? 1 + 0.5 * attn.name + 0.6 * attn.pull + pull : aimed ? 0.7 : 1,
          onward: onward ? openingsAround(bf, chooseOpenings(onward.filter((y) => y.to !== forkAt), 4)).map((y) => between(bf, arrive(bf, y.pos))) : [],
        };
      });
      // the back passages are tubes already (on your path); only the one you look at is named
      const labels: CurrentLabel[] = [];
      if (aimed && attn.name > 0.02)
        labels.push({ at: aimed.mouth, title: aimed.back ? `back to ${aimed.title}` : aimed.title, why: aimed.why, nameA: attn.name, whyA: attn.why, rose: aimed.human, big: true });
      const human = forward.find((x) => x.human);
      const onLeg = m.kind === 'travel' && !m.taken && m.anchor ? m.anchor.leg : m.leg;
      const threads = human && !onLeg.human && !onLeg.back ? { tube: { path: onLeg.path, length: onLeg.length, strength: onLeg.strength, swellB: 1 }, toward: human.leg.path(0.3) } : null;

      // the caption: the subject you are at (its line once you are there), or drifting past as you travel
      let caption: Parameters<typeof drawCurrents>[2]['caption'] = null;
      const node = (id: string) => nodesRef.current.get(id);
      if (m.kind === 'located' || (m.kind === 'travel' && !m.taken && m.anchor)) {
        const loc = m.kind === 'located' ? m : m.anchor!;
        caption = { title: titleOfPlace(loc.at), titleA: 1, line: node(loc.at)?.line, lineA: smooth(0.8, 1.6, loc.since) };
      } else if (m.kind === 'travel') {
        const left = (1 - m.s) * m.leg.length;
        const gone = m.s * m.leg.length;
        const aheadA = smooth(REACH + 1.8, REACH, left);
        const behindA = m.leg.from ? 1 - smooth(0.3, 1.6, gone) : 0;
        if (aheadA >= behindA && aheadA > 0.02) caption = { title: titleOfPlace(m.leg.to), titleA: aheadA, lineA: 0 };
        else if (behindA > 0.02 && m.leg.from) caption = { title: titleOfPlace(m.leg.from), titleA: behindA, lineA: 0 };
      }
      const status = m.kind === 'located' && !leavingRef.current.get(m.at) ? statusRef.current ?? 'finding where this leads.' : m.kind === 'located' ? statusRef.current : undefined;

      const v = viewOf({ eye, at: add(eye, cf), up: cu }, w, h);
      // a wide view from inside the web
      v.F = 0.42 * Math.max(Math.min(w, h), 0.6 * Math.max(w, h));
      drawCurrents(ctx, v, { eye, tubes, branches, threads, labels, caption, status, time, reduced: rm, serif });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [allowed, started, serif, take]);

  // dragging turns where you look (phone and mouse alike): the only gesture
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (overlookRef.current.on) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, yaw: lookRef.current.yaw, pitch: lookRef.current.pitch };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dr = dragRef.current;
    if (!dr || overlookRef.current.on) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = 1.6 / Math.min(r.width, r.height);
    // the world moves under your finger
    lookRef.current = { yaw: dr.yaw - (e.clientX - dr.x) * k, pitch: clamp(dr.pitch + (e.clientY - dr.y) * k, -1.3, 1.3) };
  };
  const release = () => {
    dragRef.current = null;
  };

  // desktop: A/D and the arrows turn where you look; W leans you in sooner
  useEffect(() => {
    if (!started) return;
    const ours = ['w', 'a', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
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
  }, [started]);

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
          aria-label="The Fall: drag to look around. Keep looking at a current and it carries you; turn around to go back the way you came."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
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
              <button type="button" className={styles.quiet} onClick={() => load(regionRef.current)}>
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
