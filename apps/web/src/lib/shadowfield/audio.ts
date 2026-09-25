// Waveform peaks for songs, computed in the visitor's browser the first time a
// song is approached (decoding needs no user gesture; playback does).

const peaks = new Map<string, Float32Array | 'loading' | 'failed'>();
let ctx: AudioContext | null = null;

const BINS = 180;

export function getPeaks(src: string): Float32Array | null {
  const hit = peaks.get(src);
  if (hit instanceof Float32Array) return hit;
  if (hit) return null;
  if (typeof window === 'undefined') return null;
  peaks.set(src, 'loading');
  (async () => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx ??= new AC();
      const buf = await (await fetch(src)).arrayBuffer();
      const audio = await ctx.decodeAudioData(buf);
      const data = audio.getChannelData(0);
      const out = new Float32Array(BINS);
      const step = Math.max(1, Math.floor(data.length / BINS));
      let max = 0;
      for (let b = 0; b < BINS; b++) {
        let sum = 0;
        const start = b * step;
        for (let i = start; i < start + step && i < data.length; i += 16) sum += data[i] * data[i];
        out[b] = Math.sqrt(sum / (step / 16));
        if (out[b] > max) max = out[b];
      }
      for (let b = 0; b < BINS; b++) out[b] = max > 0 ? out[b] / max : 0;
      peaks.set(src, out);
    } catch {
      peaks.set(src, 'failed');
    }
  })();
  return null;
}
