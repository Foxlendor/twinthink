'use client';

import { useEffect, useRef, useState } from 'react';
import type { PaperScope } from 'paper';
import { selectMarks, tracePixels, type Trace } from '@/lib/tracer';
import styles from './trace.module.css';

type Mark = 'dots' | 'strokes' | 'letters' | 'shapes';

function download(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TracePage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scope = useRef<InstanceType<typeof PaperScope> | null>(null);
  const request = useRef(0);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [density, setDensity] = useState(35);
  const [mark, setMark] = useState<Mark>('strokes');
  const [letters, setLetters] = useState('TwinThink');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const pending = request;
    import('paper').then(module => {
      if (!active || !canvas.current) return;
      const next = new module.default.PaperScope();
      next.setup(canvas.current);
      scope.current = next;
      setReady(true);
    }).catch(() => { if (active) setError('The drawing tools could not load. Please reload this page.'); });
    return () => { active = false; pending.current++; scope.current?.project.remove(); scope.current = null; };
  }, []);

  useEffect(() => {
    const paper = scope.current;
    if (!paper || !ready) return;
    paper.activate();
    paper.project.clear();
    if (!trace) return;
    paper.view.viewSize = new paper.Size(trace.width, trace.height);
    const marks = selectMarks(trace, density);
    const text = Array.from(letters || 'TwinThink');
    marks.forEach((segment, index) => {
      const from = new paper.Point(...segment.from);
      const to = new paper.Point(...segment.to);
      const center = from.add(to).divide(2);
      const color = new paper.Color('#d7bca1');
      if (mark === 'strokes') {
        new paper.Path.Line({ from, to, strokeColor: color, strokeWidth: .8, strokeCap: 'round' });
      } else if (mark === 'dots') {
        new paper.Path.Circle({ center, radius: .7, fillColor: color });
      } else if (mark === 'letters') {
        new paper.PointText({ point: center, content: text[index % text.length], fontSize: 4, fillColor: color, justification: 'center' });
      } else {
        new paper.Path.RegularPolygon({ center, sides: 4, radius: 1.2, strokeColor: color, strokeWidth: .45 });
      }
    });
    paper.view.update();
  }, [trace, density, mark, letters, ready]);

  async function load(file?: File) {
    if (!file) return;
    const id = ++request.current;
    setError('');
    setTrace(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setBusy(false);
      setError('Choose a PNG, JPEG, or WebP picture.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setBusy(false);
      setError('Choose a picture smaller than 20 MB.');
      return;
    }
    setBusy(true);
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await createImageBitmap(file);
      if (id !== request.current) return;
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(2, Math.round(bitmap.width * scale));
      const height = Math.max(2, Math.round(bitmap.height * scale));
      const pixels = document.createElement('canvas');
      pixels.width = width;
      pixels.height = height;
      const context = pixels.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Your browser could not read this picture.');
      context.drawImage(bitmap, 0, 0, width, height);
      const result = tracePixels(context.getImageData(0, 0, width, height).data, width, height);
      if (id === request.current) setTrace(result);
    } catch {
      if (id === request.current) setError('This picture could not be read. Try another PNG, JPEG, or WebP.');
    } finally {
      bitmap?.close();
      if (id === request.current) setBusy(false);
    }
  }

  function exportSvg() {
    if (!trace || !scope.current) return;
    download(scope.current.project.exportSVG({ asString: true, bounds: 'view' }) as string, 'image/svg+xml', 'twinthink-trace.svg');
  }

  function exportJson() {
    if (!trace) return;
    download(JSON.stringify({ format: 'twinthink-trace', version: 1, generatedBy: 'brightness-contours', originalCreator: null, width: trace.width, height: trace.height, density, mark, letters: mark === 'letters' ? letters || 'TwinThink' : undefined, segments: selectMarks(trace, density) }, null, 2), 'application/json', 'twinthink-trace.json');
  }

  const count = trace ? selectMarks(trace, density).length : 0;
  return (
    <main className={styles.main}>
      <header><p className={styles.eyebrow}>TwinThink / Picture to marks</p><h1>Let the outline emerge.</h1><p>A picture, held in a different form. Your picture stays on this device.</p></header>
      <div className={styles.controls}>
        <label className={styles.file}>Choose a picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void load(event.target.files?.[0]); event.target.value = ''; }} /></label>
        <label>Density <output>{density}</output><input aria-label="Density" type="range" min="1" max="100" value={density} onChange={event => setDensity(Number(event.target.value))} /></label>
        <label>Marks<select value={mark} onChange={event => setMark(event.target.value as Mark)}><option value="dots">Dots</option><option value="strokes">Strokes</option><option value="letters">Letters</option><option value="shapes">SVG shapes</option></select></label>
        {mark === 'letters' && <label>Letters<input value={letters} maxLength={40} onChange={event => setLetters(event.target.value)} /></label>}
      </div>
      <div className={styles.stage} aria-busy={busy}>
        <canvas ref={canvas} width="512" height="384" aria-label="Traced picture preview" role="img" style={{ display: trace ? 'block' : 'none' }} />
        {!trace && <p>{busy ? 'Finding the outlines…' : 'Choose a picture to begin.'}</p>}
        {trace && count === 0 && <p>No outlines at these brightness levels. Try a picture with more contrast.</p>}
      </div>
      <footer><p role="status">{error || (busy ? 'Reading picture…' : trace ? `${count.toLocaleString()} marks. Change their form without tracing again.` : 'PNG, JPEG or WebP. Up to 20 MB.')}</p><div className={styles.actions}><button disabled={!ready || !trace || !count || busy} onClick={exportSvg}>Save SVG</button><button disabled={!ready || !trace || !count || busy} onClick={exportJson}>Save JSON</button></div></footer>
    </main>
  );
}


