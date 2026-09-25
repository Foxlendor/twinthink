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
