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

export function getVideo(src: string, webm?: string): HTMLVideoElement | null {
  if (typeof document === 'undefined') return null;
  let v = videos.get(src);
  if (!v) {
    v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    const mp4 = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    v.src = !mp4 && webm && v.canPlayType('video/webm; codecs="vp9, opus"') ? webm : src;
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

/** Sound for a film, from a tap (browsers allow sound only after one). */
export function toggleVideoSound(src: string): boolean {
  const v = videos.get(src);
  if (!v) return false;
  v.muted = !v.muted;
  if (!v.muted) void v.play().catch(() => undefined);
  return !v.muted;
}
