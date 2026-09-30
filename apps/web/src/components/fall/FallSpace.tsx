'use client';

// The Fall, formed by relationships (preview only): real examples from Wikipedia, where the space
// you move through is made by what leads to what, and by the way you actually went.
//
// You arrive somewhere. Around it, strands lead on: where it came from above, what it led to
// below, kin to either side, each nearer and clearer the stronger the connection. Lean toward one
// (move the mouse, or drag a thumb) and it comes in while the rest drift out; choose it and you
// travel along it, turning as you go, so the path you make is the shape you see. Your thread stays
// behind you through every place, with the ways you passed at each. Look back to see all of it.
//
// Nothing here reaches our server. Every id begins "sample/"; what you have seen and walked is
// kept on this device only.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import styles from './FallSpace.module.css';
import { FallNode, Graph, Strand, chooseOpenings } from '@/lib/fall/graph';
import { Frame, Opening, Place, START, V3, add, arrive, between, blend, circling, lerp3, norm, openingsAround, orbit, overlook, scale, sub, travelTime } from '@/lib/fall/space';
import { Cam, Shown, drawFall, viewOf } from '@/lib/fall/draw';
import { Entrance, isDescription, resolveEntrance } from '@/lib/fall/enter';
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


/** Where you are now: the last place on the route. */
function hereOf(places: Map<string, Place>, route: string[]) {
  const id = route[route.length - 1];
  return id ? places.get(id) ?? null : null;
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The camera for a place: a little behind and above it, looking on past it. */
function camFor(fr: Frame): Cam {
  return { eye: add(fr.p, add(scale(fr.f, -2.3), scale(fr.u, 0.32))), at: add(fr.p, scale(fr.f, 3)), up: fr.u };
}

export default function FallSpace({ serif }: { serif: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const placesRef = useRef(new Map<string, Place>());
  const routeRef = useRef<string[]>([]);
  const stackRef = useRef<string[]>([]);
  const nodesRef = useRef(new Map<string, FallNode>());
  const strandsRef = useRef(new Map<string, Strand[]>());
  const openingsRef = useRef<Opening[]>([]);
  /** Where each way on is drawn: easing toward where it now belongs, as the space forms. */
  const shownPosRef = useRef(new Map<string, V3>());
  /** How much of each way on has become legible to you (0 to 1): leaning toward it reveals it. */
  const revealRef = useRef(new Map<string, number>());
  /** What your path keeps circling, and where. */
  const centresRef = useRef<{ id: string; title: string; at: V3; n: number }[]>([]);
  const statusRef = useRef<string | undefined>(undefined);
  const travelRef = useRef<{ from: Frame; to: Frame; path: (t: number) => V3; t0: number; dur: number } | null>(null);
  const leanRef = useRef({ x: 0, y: 0, shown: 0 });
  const aimedRef = useRef<string | null>(null);
  const shownRef = useRef<Shown[]>([]);
  const hereScreenRef = useRef<[number, number] | null>(null);
  const overlookRef = useRef({ on: false, amount: 0 });
  const memRef = useRef<Memory>({ seen: {}, walked: [] });
  const touchRef = useRef<{ x: number; y: number; moved: number } | null>(null);
  const reducedRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [hereId, setHereId] = useState('');
  const [credit, setCredit] = useState<FallNode['credit'] | null>(null);
  const [canBack, setCanBack] = useState(false);
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


  /** Once what a place leads to is known, its ways on open around it, each where its strand puts it. */
  const openFrom = useCallback((id: string) => {
    const pl = placesRef.current.get(id);
    const strands = strandsRef.current.get(id);
    const cur = routeRef.current[routeRef.current.length - 1];
    if (!pl || !strands || cur !== id) return;
    // the way back to where you came from is your own thread (and "back"), not a way on
    const cameFrom = stackRef.current[stackRef.current.length - 2];
    const chosen = chooseOpenings(strands.filter((s) => s.to !== cameFrom));
    const placed = new Map<string, V3>();
    for (const [pid, p] of placesRef.current) if (pid !== id) placed.set(pid, p.frame.p);
    const place = () => {
      const open = openingsAround(pl.frame, chosen, placed);
      // earning the spiral: what your route keeps circling pulls the ways on that link to it onto an
      // orbit around it (knowledge says what links where; your route says what you keep coming round)
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
        // the thing circled itself lies at the heart of it
        const pos = o.strand.to === best.id ? lerp3(o.pos, add(best.at, scale(pl.frame.f, 0.6)), pull) : orbit(best.at, pl.frame, o.pos, pull, k);
        return { ...o, pos };
      });
    };
    openingsRef.current = place();
    statusRef.current = chosen.length ? undefined : 'nothing leads on from here that both sides name.';
    // look a step ahead: where each way on leads in turn (seen faintly, gone into without waiting); once
    // known, the space re-forms around what it reveals (things ease to where they now belong)
    const g = graphRef.current;
    if (!g) return;
    Promise.allSettled(
      openingsRef.current.map((o) =>
        g.strands(o.strand.to).then((s) => {
          strandsRef.current.set(o.strand.to, s);
        })
      )
    ).then(() => {
      if (routeRef.current[routeRef.current.length - 1] === id && !travelRef.current) openingsRef.current = place();
    });
  }, []);

  const load = useCallback(
    (id: string) => {
      const g = graphRef.current;
      if (!g) return;
      const known = strandsRef.current.get(id) ?? g.known?.(id);
      if (known) {
        strandsRef.current.set(id, known);
        openFrom(id);
      } else {
        statusRef.current = 'finding where this leads.';
        setFailed(false);
        g.strands(id)
          .then((s) => {
            strandsRef.current.set(id, s);
            openFrom(id);
          })
          .catch(() => {
            if (routeRef.current[routeRef.current.length - 1] !== id) return;
            statusRef.current = UNREACHABLE;
            setFailed(true);
          });
      }
      g.node(id)
        .then((n) => {
          nodesRef.current.set(id, n);
          if (routeRef.current[routeRef.current.length - 1] === id) setCredit(n.credit ?? null);
        })
        .catch(() => {});
    },
    [openFrom]
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
      stackRef.current = [id];
      openingsRef.current = [];
      shownPosRef.current = new Map();
      centresRef.current = [];
      travelRef.current = null;
      overlookRef.current.on = false;
      setOverlooking(false);
      setCanBack(false);
      setCredit(null);
      setHereId(id);
      setStarted(true);
      remember(null, id);
      load(id);
    },
    [load]
  );

  /** Going to a place: along the strand, turning as you go (or back along your own thread). */
  const travelTo = useCallback(
    (to: string, title: string, frame: Frame, how: 'on' | 'back') => {
      const pl = hereOf(placesRef.current, routeRef.current);
      if (!pl) return;
      const from = pl.frame;
      if (how === 'on') {
        // the ways not taken here stay, as stubs, part of where you have been
        pl.passed = openingsRef.current.filter((o) => o.strand.to !== to && !o.back).map((o) => ({ to: o.strand.to, pos: o.pos }));
        const known = placesRef.current.get(to);
        if (!known) {
          const via = openingsRef.current.find((o) => o.strand.to === to)?.strand;
          placesRef.current.set(to, { id: to, title, frame, passed: [], via: via ? { from: pl.id, why: via.why, strength: via.strength, bearing: via.bearing, shape: via.shape } : undefined });
        }
        stackRef.current.push(to);
        remember(pl.id, to);
      } else stackRef.current.pop();
      routeRef.current.push(to);
      const dest = placesRef.current.get(to)!.frame;
      travelRef.current = {
        from,
        to: dest,
        path: between(from, dest),
        t0: performance.now(),
        dur: (reducedRef.current ? 0.25 : travelTime(from.p, dest.p)) * 1000,
      };
      openingsRef.current = [];
      shownPosRef.current = new Map();
      centresRef.current = [];
      aimedRef.current = null;
      setFailed(false);
      setCanBack(stackRef.current.length > 1);
      setCredit(nodesRef.current.get(to)?.credit ?? null);
      setHereId(to);
      load(to);
    },
    [load]
  );

  const choose = useCallback(
    (o: Opening) => {
      const pl = hereOf(placesRef.current, routeRef.current);
      if (!pl || travelRef.current) return;
      const known = placesRef.current.get(o.strand.to);
      const target = openingsRef.current.find((x) => x.strand.to === o.strand.to) ?? o;
      travelTo(o.strand.to, o.strand.title, known ? known.frame : arrive(pl.frame, target.pos), 'on');
    },
    [travelTo]
  );

  const back = useCallback(() => {
    if (travelRef.current || stackRef.current.length < 2) return;
    const prev = stackRef.current[stackRef.current.length - 2];
    const pl = placesRef.current.get(prev);
    if (pl) travelTo(prev, pl.title, pl.frame, 'back');
  }, [travelTo]);

  // for checking in development only: what is open here, what is circled, and going somewhere by id
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    (window as unknown as { __fall?: unknown }).__fall = {
      here: () => routeRef.current[routeRef.current.length - 1],
      ways: () => openingsRef.current.map((o) => ({ to: o.strand.to, title: o.strand.title, strength: o.strand.strength, reveal: revealRef.current.get(o.strand.to) ?? 0 })),
      centres: () => centresRef.current.map((c) => ({ id: c.id, n: c.n })),
      go: (id: string) => {
        const o = openingsRef.current.find((x) => x.strand.to === id);
        if (o) choose(o);
        return !!o;
      },
    };
  }, [choose]);

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
        graphRef.current = createWikiGraph({ storage, snapshot });
        const cur = routeRef.current[routeRef.current.length - 1];
        if (cur) load(cur);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, load]);

  // drawing, every frame
  useEffect(() => {
    if (!allowed || !started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      reducedRef.current = reduced.matches;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pl = hereOf(placesRef.current, routeRef.current);
      if (!pl) return;
      // where the camera is: at a place, or on the way between two
      let fr = pl.frame;
      const tr = travelRef.current;
      let arriving = 1;
      if (tr) {
        const t = Math.min(1, (now - tr.t0) / tr.dur);
        arriving = t;
        fr = blend(tr.from, tr.to, ease(t), tr.path);
        if (t >= 1) travelRef.current = null;
      }
      let cam = camFor(fr);
      // leaning: the view turns a little toward the way on leaned toward, and that way comes in
      const L = leanRef.current;
      const m = Math.min(1, Math.hypot(L.x, L.y));
      let aimed: Opening | null = null;
      const hs = hereScreenRef.current;
      if (!travelRef.current && hs && m > 0.18) {
        const a = Math.atan2(L.y, L.x);
        let best = 0.8;
        for (const s of shownRef.current) {
          const d = Math.abs(Math.atan2(Math.sin(Math.atan2(s.y - hs[1], s.x - hs[0]) - a), Math.cos(Math.atan2(s.y - hs[1], s.x - hs[0]) - a)));
          if (d < best) [best, aimed] = [d, s.opening];
        }
      }
      aimedRef.current = aimed?.strand.to ?? null;
      const target = aimed ? Math.min(1, (m - 0.18) / 0.55) : 0;
      L.shown += (target - L.shown) * (1 - Math.exp(-dt * 7));
      if (aimed && !reduced.matches) cam = { ...cam, at: lerp3(cam.at, aimed.pos, 0.3 * L.shown) };
      // looking back: up and away, until the whole path is in view
      const ov = overlookRef.current;
      ov.amount += ((ov.on ? 1 : 0) - ov.amount) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 3));
      if (ov.amount > 0.001) {
        const o = overlook([...placesRef.current.values()]);
        const k = ease(ov.amount);
        cam = { eye: lerp3(cam.eye, o.eye, k), at: lerp3(cam.at, o.at, k), up: norm(lerp3(cam.up, o.up, k)) };
      }
      const v = viewOf(cam, w, h);
      // the ways on, where they are drawn: each eases toward where it now belongs (the space forming)
      const shownPos = shownPosRef.current;
      const settle = reduced.matches ? 1 : 1 - Math.exp(-dt * 3);
      const opens = openingsRef.current.map((o) => {
        const was = shownPos.get(o.strand.to);
        const pos = was ? lerp3(was, o.pos, settle) : o.pos;
        shownPos.set(o.strand.to, pos);
        return { ...o, pos };
      });
      // what you lean toward becomes legible, and stays a little clearer once looked at; a way walked
      // or a place seen before is already half known to you
      const rev = revealRef.current;
      for (const o of opens) {
        const id = o.strand.to;
        const base = memRef.current.walked.includes(`${pl.id}\u0001${id}`) || (memRef.current.seen[id] ?? 0) > 0 ? 0.55 : 0.14;
        let r = rev.get(id) ?? base;
        if (id === aimedRef.current) r = Math.min(1, r + dt * (0.4 + 0.9 * L.shown));
        else if (r < base) r = base;
        else r = Math.max(base, r - dt * 0.06);
        rev.set(id, r);
      }
      // past each way on, where it leads in turn, faintly (once known)
      const beyond = new Map<string, V3[]>();
      for (const o of opens) {
        const s = strandsRef.current.get(o.strand.to);
        if (!s) continue;
        const onward = openingsAround(arrive(pl.frame, o.pos), chooseOpenings(s.filter((x) => x.to !== pl.id), 5));
        beyond.set(
          o.strand.to,
          onward.map((x) => x.pos)
        );
      }
      const node = nodesRef.current.get(pl.id);
      const leaned = aimed ? L.shown : 0;
      shownRef.current = drawFall(ctx, v, {
        places: placesRef.current,
        route: routeRef.current,
        openings: travelRef.current ? [] : opens,
        reveal: (id) => rev.get(id) ?? 0.14,
        centres: centresRef.current,
        aimed: aimedRef.current,
        lean: leaned,
        beyond,
        here: { id: pl.id, title: node?.title ?? pl.title, line: node?.line, pos: pl.frame.p },
        seen: (id) => memRef.current.seen[id] ?? 0,
        walked: (a, b) => memRef.current.walked.includes(`${a}\u0001${b}`),
        overlooking: ov.amount,
        arriving,
        status: statusRef.current,
        serif,
      });
      const hp = viewOf(cam, w, h);
      const d = sub(pl.frame.p, hp.eye);
      const z = d[0] * hp.cf[0] + d[1] * hp.cf[1] + d[2] * hp.cf[2];
      hereScreenRef.current = z > 0.15 ? [hp.cx + ((d[0] * hp.cr[0] + d[1] * hp.cr[1] + d[2] * hp.cr[2]) * hp.F) / z, hp.cy - ((d[0] * hp.cu[0] + d[1] * hp.cu[1] + d[2] * hp.cu[2]) * hp.F) / z] : null;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [allowed, started, serif]);

  // leaning with the mouse (no button), a thumb (drag), or the arrow keys
  const hit = (x: number, y: number) => shownRef.current.find((s) => Math.hypot(s.x - x, s.y - y) < s.r) ?? null;
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const M = Math.min(r.width, r.height);
    const t = touchRef.current;
    if (e.pointerType === 'mouse') {
      const hs = hereScreenRef.current ?? [r.width / 2, r.height * 0.46];
      leanRef.current.x = (x - hs[0]) / (0.42 * M);
      leanRef.current.y = (y - hs[1]) / (0.42 * M);
    } else if (t) {
      t.moved = Math.max(t.moved, Math.hypot(x - t.x, y - t.y));
      leanRef.current.x = (x - t.x) / (0.3 * M);
      leanRef.current.y = (y - t.y) / (0.3 * M);
    }
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.pointerType !== 'mouse') {
      e.currentTarget.setPointerCapture(e.pointerId);
      touchRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, moved: 0 };
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const t = touchRef.current;
    touchRef.current = null;
    if (overlookRef.current.on) return;
    const aimed = openingsRef.current.find((o) => o.strand.to === aimedRef.current);
    if (e.pointerType === 'mouse' || (t && t.moved < 10)) {
      // a click or a tap: on a way on goes there; elsewhere, into the one leaned toward
      const h = hit(x, y);
      if (h) choose(h.opening);
      else if (e.pointerType === 'mouse' && aimed) choose(aimed);
    } else if (aimed && leanRef.current.shown > 0.75) choose(aimed);
    if (e.pointerType !== 'mouse') leanRef.current.x = leanRef.current.y = 0;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const L = leanRef.current;
    const step = 0.2;
    if (e.key === 'ArrowLeft') L.x = Math.max(-1, L.x - step);
    else if (e.key === 'ArrowRight') L.x = Math.min(1, L.x + step);
    else if (e.key === 'ArrowUp') L.y = Math.max(-1, L.y - step);
    else if (e.key === 'ArrowDown') L.y = Math.min(1, L.y + step);
    else if (e.key === 'Enter') {
      const aimed = openingsRef.current.find((o) => o.strand.to === aimedRef.current);
      if (aimed) choose(aimed);
      L.x = L.y = 0;
    } else if (e.key === 'Backspace' || e.key === 'Escape') {
      if (overlookRef.current.on) toggleOverlook();
      else back();
    } else return;
    e.preventDefault();
  };

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
          aria-label="The Fall: where you are, the ways on from it, and the path you have made."
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') leanRef.current.x = leanRef.current.y = 0;
          }}
          onKeyDown={onKeyDown}
        />
      )}
      <div className={styles.label}>examples from Wikipedia, for previews only</div>
      <Link className={styles.home} href="/slate">
        slate
      </Link>
      {!started ? (
        <div className={styles.starts}>
          <h1>Fall through Wikipedia</h1>
          <p>Real articles, connected the way Wikipedia and DBpedia connect them. Where you go shapes the space you see.</p>
          {doorway}
          {!doorChoice && <p className={styles.or}>or begin somewhere:</p>}
          {!doorChoice && WIKI_STARTS.map((t) => (
            <button key={t} type="button" className={styles.start} onClick={() => begin(wikiId(t), t)}>
              {t}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.actions}>
            {failed && !overlooking && (
              <button type="button" className={styles.quiet} onClick={() => load(hereId)}>
                try again
              </button>
            )}
            {canBack && !overlooking && (
              <button type="button" className={styles.quiet} onClick={back}>
                back
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
              <>From Wikipedia and DBpedia: {hereId ? titleOf(hereId) : ''}</>
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
