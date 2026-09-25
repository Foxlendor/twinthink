// The viewer's own Shadows, kept on this device.
//
// These are genuine records: every thought, revision and return is logged when
// it actually happens. They live in localStorage until the Shadow API exists;
// the ShadowStore shape is what a server-backed store will implement.

import { IdeaNode, LifeEvent } from '../model';
import { hashString } from '../rng';

export interface LocalThought {
  id: string;
  parent: string | null; // null = directly inside the Shadow
  text: string;
  t: number;
  x: number; // position in the parent's frame
  y: number;
  revisions: number[];
  letGo?: number;
}

export interface LocalShadow {
  id: string;
  text: string;
  created: number;
  x: number; // position on the Canvas
  y: number;
  visits: number[];
  revisions: number[];
  thoughts: LocalThought[];
}

export interface ShadowStore {
  list(): LocalShadow[];
  cast(text: string, x: number, y: number): LocalShadow;
  addThought(shadowId: string, parent: string | null, text: string, x: number, y: number): LocalThought | null;
  revise(shadowId: string, thoughtId: string | null, text: string): void;
  letGo(shadowId: string, thoughtId: string): void;
  visit(shadowId: string): void;
  remove(shadowId: string): void;
}

const KEY = 'twinthink.shadows.v1';
const VISIT_GAP = 30 * 60 * 1000;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function createLocalStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null): ShadowStore {
  let memory: LocalShadow[] = [];
  const read = (): LocalShadow[] => {
    if (!storage) return memory;
    try {
      const raw = storage.getItem(KEY);
      return raw ? (JSON.parse(raw) as LocalShadow[]) : [];
    } catch {
      return memory;
    }
  };
  const write = (list: LocalShadow[]) => {
    memory = list;
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(list));
    } catch {
      // storage full or blocked: keep working in memory
    }
  };
  const mutate = (fn: (list: LocalShadow[]) => void) => {
    const list = read();
    fn(list);
    write(list);
  };

  return {
    list: read,
    cast(text, x, y) {
      const now = Date.now();
      const s: LocalShadow = { id: uid(), text, created: now, x, y, visits: [now], revisions: [], thoughts: [] };
      mutate((l) => l.push(s));
      return s;
    },
    addThought(shadowId, parent, text, x, y) {
      let made: LocalThought | null = null;
      mutate((l) => {
        const s = l.find((v) => v.id === shadowId);
        if (!s) return;
        made = { id: uid(), parent, text, t: Date.now(), x, y, revisions: [] };
        s.thoughts.push(made);
      });
      return made;
    },
    revise(shadowId, thoughtId, text) {
      mutate((l) => {
        const s = l.find((v) => v.id === shadowId);
        if (!s) return;
        if (thoughtId === null) {
          if (s.text !== text) {
            s.text = text;
            s.revisions.push(Date.now());
          }
          return;
        }
        const th = s.thoughts.find((v) => v.id === thoughtId);
        if (th && th.text !== text) {
          th.text = text;
          th.revisions.push(Date.now());
        }
      });
    },
    letGo(shadowId, thoughtId) {
      mutate((l) => {
        const th = l.find((v) => v.id === shadowId)?.thoughts.find((v) => v.id === thoughtId);
        if (th) th.letGo = th.letGo ? undefined : Date.now();
      });
    },
    visit(shadowId) {
      mutate((l) => {
        const s = l.find((v) => v.id === shadowId);
        if (!s) return;
        const last = s.visits[s.visits.length - 1] ?? 0;
        if (Date.now() - last > VISIT_GAP) s.visits.push(Date.now());
      });
    },
    remove(shadowId) {
      mutate((l) => {
        const i = l.findIndex((v) => v.id === shadowId);
        if (i >= 0) l.splice(i, 1);
      });
    },
  };
}

function thoughtNode(shadow: LocalShadow, th: LocalThought): IdeaNode {
  const kids = shadow.thoughts.filter((c) => c.parent === th.id).map((c) => thoughtNode(shadow, c));
  const events: LifeEvent[] = [
    { t: th.t, kind: 'begin', note: 'first written' },
    ...th.revisions.map((t) => ({ t, kind: 'revision' as const, note: 'rewritten' })),
  ];
  if (th.letGo) events.push({ t: th.letGo, kind: 'prune', note: 'let go' });
  return {
    id: `local/${shadow.id}/${th.id}`,
    title: th.text.length > 48 ? th.text.slice(0, 46) + '…' : th.text,
    kind: 'unknown',
    origin: 'local',
    began: th.t,
    events,
    state: th.letGo ? 'abandoned' : 'alive',
    disclosure: 0,
    children: kids,
    artifact: { type: 'text', body: th.text },
    x: th.x,
    y: th.y,
    r: 0.055,
    fixed: true,
    seed: hashString(th.id),
    ownedBy: 'viewer',
  };
}

export function localShadowNode(s: LocalShadow): IdeaNode {
  const events: LifeEvent[] = [
    { t: s.created, kind: 'begin', note: 'cast' },
    ...s.revisions.map((t) => ({ t, kind: 'revision' as const, note: 'rewritten' })),
    ...s.visits.slice(1).map((t) => ({ t, kind: 'return' as const, note: 'you came back' })),
  ];
  return {
    id: `local/${s.id}`,
    title: s.text.length > 48 ? s.text.slice(0, 46) + '…' : s.text,
    note: s.text,
    kind: 'unknown',
    origin: 'local',
    began: s.created,
    events,
    state: 'alive',
    disclosure: 0,
    children: s.thoughts.filter((t) => t.parent === null).map((t) => thoughtNode(s, t)),
    artifact: s.thoughts.length === 0 ? { type: 'text', body: s.text } : undefined,
    x: s.x,
    y: s.y,
    r: 0.0025,
    fixed: true,
    seed: hashString(s.id),
    ownedBy: 'viewer',
    signals: { returns: s.visits.length - 1 },
  };
}
