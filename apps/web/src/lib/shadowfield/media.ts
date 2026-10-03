// Image cache with progressively blurred versions, so content can resolve from
// a near-white shadow into the real image as the viewer approaches. Works in
// every browser (no ctx.filter): blur comes from downsampling.

export interface Loaded {
  img: HTMLImageElement;
  /** mips[0] is full size; each next level is half the size of the last. */
  mips: (HTMLCanvasElement | HTMLImageElement)[];
}

const cache = new Map<string, Loaded | 'loading' | 'failed'>();
let onReady: (() => void) | null = null;

export function setMediaReadyCallback(fn: () => void) {
  onReady = fn;
}

export function getImage(src: string): Loaded | null {
  if (!src) return null;
  const hit = cache.get(src);
  if (hit && hit !== 'loading' && hit !== 'failed') return hit;
  if (hit) return null;
  if (typeof Image === 'undefined') return null;
  cache.set(src, 'loading');
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const mips: (HTMLCanvasElement | HTMLImageElement)[] = [img];
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    let prev: HTMLCanvasElement | HTMLImageElement = img;
    while (w > 8 && h > 8 && mips.length < 8) {
      w = Math.max(1, Math.round(w / 2));
      h = Math.max(1, Math.round(h / 2));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      if (!g) break;
      g.imageSmoothingQuality = 'high';
      g.drawImage(prev, 0, 0, w, h);
      mips.push(c);
      prev = c;
    }
    cache.set(src, { img, mips });
    onReady?.();
  };
  img.onerror = () => cache.set(src, 'failed');
  img.src = src;
  return null;
}

// Films: one silent, inline element per source, playing only while in view.

const videos = new Map<string, HTMLVideoElement>();
let filmRate = 1;

/** For recordings made frame by frame: films keep time with the frames, not the wall clock. */
export function setFilmRate(rate: number) {
  filmRate = rate;
  for (const v of videos.values()) v.playbackRate = rate;
}

/** At most this many films are kept loaded; the one used longest ago is let go first. */
const LIVE_FILMS = 5;
const usedAt = new Map<string, number>();

export function getVideo(src: string, webm?: string): HTMLVideoElement | null {
  if (typeof document === 'undefined') return null;
  let v = videos.get(src);
  usedAt.set(src, performance.now());
  if (!v) {
    // make room: the resting film used longest ago lets go of what it loaded
    while (videos.size >= LIVE_FILMS) {
      let oldest: string | null = null;
      const now = performance.now();
      for (const [k, o] of videos) {
        // playing, drawn or readied in the last second: kept
        if (!o.paused || now - (usedAt.get(k) ?? 0) < 1000) continue;
        if (oldest === null || (usedAt.get(k) ?? 0) < (usedAt.get(oldest) ?? 0)) oldest = k;
      }
      if (oldest === null) break;
      const o = videos.get(oldest)!;
      o.removeAttribute('src');
      o.load();
      videos.delete(oldest);
      usedAt.delete(oldest);
    }
    v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    const mp4 = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    v.src = !mp4 && webm && v.canPlayType('video/webm; codecs="vp9, opus"') ? webm : src;
    v.playbackRate = filmRate;
    videos.set(src, v);
  }
  return v;
}

/** After a frame: films drawn this frame play, all others rest. */
export function settleVideos(active: Set<string>) {
  for (const [src, v] of videos) {
    if (active.has(src)) {
      if (v.paused) void v.play().catch(() => undefined);
    } else if (!v.paused) {
      v.pause();
      v.muted = true;
    }
  }
}

/** Films the viewer started by hand (with reduced motion, only these ever play). */
export const startedByHand = new Set<string>();

/**
 * Whether films are heard: once the viewer turns one film's sound on, each
 * film they arrive at is heard in turn (and the one they left falls quiet),
 * until they turn a film's sound off again.
 */
let soundOn = false;

export function filmsHeard() {
  return soundOn;
}

/** Sound for a film, from a tap (browsers allow sound only after one). */
export function toggleVideoSound(src: string, webm?: string): boolean {
  startedByHand.add(src);
  const v = getVideo(src, webm);
  if (!v) return false;
  v.muted = !v.muted;
  if (!v.muted) v.volume = 1;
  soundOn = !v.muted;
  if (!v.muted) {
    // one film is heard at a time
    for (const [k, o] of videos) if (k !== src) o.muted = true;
    void v.play().catch(() => undefined);
  }
  return !v.muted;
}

/** Arriving at a film while films are heard: this one is heard, every other falls quiet. */
export function hearFilm(src: string, webm?: string): boolean {
  if (!soundOn) return false;
  const v = getVideo(src, webm);
  if (!v) return false;
  for (const [k, o] of videos) if (k !== src) o.muted = true;
  v.muted = false;
  // it swells in rather than starting at full voice
  v.volume = 0;
  const t0 = performance.now();
  const swell = () => {
    const k = Math.min(1, (performance.now() - t0) / 140);
    v.volume = k;
    if (k < 1 && !v.muted) requestAnimationFrame(swell);
  };
  requestAnimationFrame(swell);
  void v.play().catch(() => {
    // the browser would not allow it: quiet again, and wait for a tap
    v.muted = true;
  });
  return true;
}

/** A song begins: every film falls quiet (films stay heard when you arrive at the next one). */
export function quietFilms() {
  for (const v of videos.values()) v.muted = true;
}

/** Leaving the Canvas (or hiding the tab): every film rests, silently. */
export function restVideos() {
  for (const v of videos.values()) {
    v.pause();
    v.muted = true;
  }
}
