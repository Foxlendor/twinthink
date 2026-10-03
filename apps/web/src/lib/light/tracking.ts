// The camera, on this device: a head found in the picture, and a person map, turned into the
// eye at the window and the silhouette in the light (see head.ts). Nothing leaves the device:
// the picture is read in the browser, the models run in the browser, and no frame is kept.
// Stopping lets the camera go at once.
//
// Reading the camera and drawing the Fall are two separate loops: the camera at its own pace,
// the Fall at the screen's; the Fall only ever reads the latest result.

import { HeadFilter, MASK_N, calibrate, eyeAt, maskFrom, shadeAt, type Calibration, type HeadReading, type ViewerLight } from './head';

export type LightStatus = 'off' | 'asking' | 'loading' | 'on' | 'lost' | 'denied' | 'nocamera' | 'failed';

export interface LightController {
  start(): Promise<void>;
  stop(): void;
  /** Where the head is now becomes straight ahead. */
  setCentre(): void;
  /** What the renderer is handed this frame, or null when the room does not see anyone. */
  current(now: number): ViewerLight | null;
  status(): LightStatus;
}

export interface LightOptions {
  /** The camera, or, on a preview, a made-up person for seeing the effect without one. */
  source: 'camera' | 'synthetic';
  onStatus?: (s: LightStatus) => void;
}

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const PERSON_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
/** The nose's tip, and the outer corners of the eyes, in the face model's numbering. */
const NOSE = 1;
const EYE_L = 33;
const EYE_R = 263;
/** How long a person map stays after the last one, before the shadow lifts. */
const MASK_HOLD_MS = 500;
const MASK_EASE_MS = 700;

export function createLight(opts: LightOptions): LightController {
  const filter = new HeadFilter();
  let cal: Calibration | null = null;
  let status: LightStatus = 'off';
  const mask = new Float32Array(MASK_N * MASK_N);
  let maskSeen = 0;
  let maskImage: HTMLCanvasElement | null = null;
  let stopLoop: (() => void) | null = null;
  let stream: MediaStream | null = null;
  let closers: (() => void)[] = [];
  let firstSeen = 0;

  const setStatus = (s: LightStatus) => {
    if (status === s) return;
    status = s;
    opts.onStatus?.(s);
  };

  const paintMask = () => {
    if (!maskImage) {
      maskImage = document.createElement('canvas');
      maskImage.width = MASK_N;
      maskImage.height = MASK_N;
    }
    const ctx = maskImage.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(MASK_N, MASK_N);
    for (let i = 0; i < mask.length; i++) {
      const v = Math.round(mask[i] * 255);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  const feedHead = (r: HeadReading) => {
    filter.feed(r);
    if (!firstSeen) firstSeen = r.t;
    // straight ahead is where the head was once it had settled for a moment, until the viewer sets it
    if (!cal && r.t - firstSeen > 600 && filter.value) cal = calibrate(filter.value);
    setStatus('on');
  };

  async function startCamera() {
    setStatus('asking');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, audio: false });
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setStatus(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'nocamera' : 'denied');
      return;
    }
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => undefined);
    setStatus('loading');
    let face: { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: { x: number; y: number }[][] }; close: () => void };
    let person: {
      segmentForVideo: (v: HTMLVideoElement, t: number, cb: (r: { confidenceMasks?: { width: number; height: number; getAsFloat32Array: () => Float32Array }[] }) => void) => void;
      getLabels: () => string[];
      close: () => void;
    };
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const files = await vision.FilesetResolver.forVisionTasks(WASM);
      const make = async (delegate: 'GPU' | 'CPU') => {
        const f = await vision.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: FACE_MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1 });
        const p = await vision.ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: PERSON_MODEL, delegate }, runningMode: 'VIDEO', outputConfidenceMasks: true, outputCategoryMask: false });
        return [f, p] as const;
      };
      let made: Awaited<ReturnType<typeof make>>;
      try {
        made = await make('GPU');
      } catch {
        made = await make('CPU');
      }
      [face, person] = made;
    } catch {
      setStatus('failed');
      stopTracks();
      return;
    }
    if (status === 'off') {
      // stopped while loading
      face.close();
      person.close();
      stopTracks();
      return;
    }
    closers = [() => face.close(), () => person.close()];
    const labels = person.getLabels();
    const personIndex = Math.max(0, labels.findIndex((l) => /person|selfie|foreground/i.test(l)));
    let tick = 0;
    let live = true;
    const step = () => {
      if (!live) return;
      const t = performance.now();
      if (video.readyState >= 2) {
        try {
          const r = face.detectForVideo(video, t);
          const lm = r.faceLandmarks[0];
          if (lm && lm[NOSE] && lm[EYE_L] && lm[EYE_R]) {
            feedHead({ x: lm[NOSE].x, y: lm[NOSE].y, d: Math.hypot(lm[EYE_L].x - lm[EYE_R].x, lm[EYE_L].y - lm[EYE_R].y), t });
          } else if (status === 'on' && t - (filter.value?.t ?? 0) > 1200) setStatus('lost');
          // the person map every other picture: it is the heavier of the two
          if (tick++ % 2 === 0) {
            person.segmentForVideo(video, t, (res) => {
              const m = res.confidenceMasks?.[personIndex];
              if (!m) return;
              maskFrom(m.getAsFloat32Array(), m.width, m.height, MASK_N, mask, 1);
              paintMask();
              maskSeen = t;
            });
          }
        } catch {
          // a dropped picture is only that
        }
      }
      schedule();
    };
    const schedule = () => {
      if (!live) return;
      if ('requestVideoFrameCallback' in video) (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(step);
      else window.setTimeout(step, 40);
    };
    stopLoop = () => {
      live = false;
    };
    schedule();
  }

  function startSynthetic() {
    // a made-up person: a head and shoulders, swaying, for a preview without a camera
    const t0 = performance.now();
    let live = true;
    const w = 64;
    const h = 48;
    const src = new Float32Array(w * h);
    const step = () => {
      if (!live) return;
      const t = performance.now();
      const s = (t - t0) / 1000;
      const hx = 0.5 + 0.11 * Math.sin(s / 1.6);
      const hy = 0.5 + 0.04 * Math.sin(s / 2.3);
      feedHead({ x: hx, y: hy, d: 0.11 + 0.01 * Math.sin(s / 3.1), t });
      src.fill(0);
      const cx = hx * w;
      const cy = (hy - 0.08) * h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const head = Math.hypot((x - cx) / 7, (y - cy) / 8) < 1;
        const neck = Math.abs(x - cx) < 3 && y > cy + 6 && y < cy + 12;
        const shoulders = y > cy + 11 && Math.abs(x - cx) < 16 + (y - cy - 11) * 0.6;
        src[y * w + x] = head || neck || shoulders ? 1 : 0;
      }
      maskFrom(src, w, h, MASK_N, mask, 1);
      paintMask();
      maskSeen = t;
      window.setTimeout(step, 40);
    };
    stopLoop = () => {
      live = false;
    };
    step();
  }

  const stopTracks = () => {
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
  };

  return {
    async start() {
      if (status !== 'off') return;
      filter.reset();
      cal = null;
      firstSeen = 0;
      maskSeen = 0;
      if (opts.source === 'synthetic') {
        setStatus('on');
        startSynthetic();
      } else await startCamera();
    },
    stop() {
      stopLoop?.();
      stopLoop = null;
      for (const c of closers) c();
      closers = [];
      stopTracks();
      filter.reset();
      cal = null;
      maskSeen = 0;
      setStatus('off');
    },
    setCentre() {
      if (filter.value) cal = calibrate(filter.value);
    },
    current(now) {
      if (status === 'off' || status === 'asking' || status === 'loading' || status === 'denied' || status === 'nocamera' || status === 'failed') return null;
      const eye = eyeAt(filter, cal, now);
      const sinceMask = now - maskSeen;
      const maskW = maskSeen === 0 ? 0 : sinceMask <= MASK_HOLD_MS ? 1 : Math.max(0, 1 - (sinceMask - MASK_HOLD_MS) / MASK_EASE_MS);
      const headW = filter.weight(now);
      if (!eye && maskW <= 0) return null;
      return {
        eye: eye ?? { ex: 0, ey: 0, near: 1 },
        shade: (sx, sy, dz, eyeX, eyeY, F) => (maskW > 0 ? shadeAt(mask, MASK_N, sx, sy, dz, eyeX, eyeY, F) * maskW : 0),
        maskImage: maskW > 0 ? maskImage : null,
        weight: Math.max(headW, maskW),
      };
    },
    status: () => status,
  };
}
