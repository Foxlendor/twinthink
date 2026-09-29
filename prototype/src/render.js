// Monochrome canvas drawing. Reads the physics state; never changes it.

import { wrapDy } from './physics.js';

export function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, f) => cs.getPropertyValue(n).trim() || f;
  return {
    paper: v('--paper', '#f4f1ea'),
    ink: v('--ink', '#1b1a17'),
    faint: v('--ink-faint', 'rgba(27,26,23,0.28)'),
    soft: v('--ink-soft', 'rgba(27,26,23,0.6)'),
    font: v('--font-ui', 'system-ui, sans-serif'),
  };
}

// Screen scale: the web's whole width fits a phone; desktop is 1:1.
export function viewScale(w, world) {
  const span = world.maxX - world.minX + 2 * 120;
  return Math.max(0.3, Math.min(1, w / span));
}

function wrapText(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function draw(ctx, view) {
  const { w, h, dpr, cam, scale, world, drop, works, dew, thumb, theme, now, reduced, ghosts, twang, focusId, trail } = view;
  const from = view.labelFrom ?? drop;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, w, h);

  const sx = (x) => (x - cam.x) * scale + w / 2;
  const sy = (y) => (y - cam.y) * scale + h / 2;
  const H = world.H;
  const top = cam.y - h / 2 / scale;
  const bottom = cam.y + h / 2 / scale;
  const k0 = Math.floor(top / H) - 1;
  const k1 = Math.floor(bottom / H) + 1;
  const workById = new Map(works.map((x) => [x.id, x]));

  // Strands.
  for (let k = k0; k <= k1; k++) {
    const off = k * H;
    for (const s of world.strands) {
      const ax = sx(s.ax);
      const ay = sy(s.ay + off);
      const bx = sx(s.bx);
      const by = sy(s.by + off);
      if (Math.max(ay, by) < -40 || Math.min(ay, by) > h + 40) continue;
      const riding = drop.mode === 'strand' && drop.strandId === s.id && Math.floor(drop.y / H) === k;
      ctx.strokeStyle = riding ? theme.ink : theme.soft;
      ctx.lineWidth = (0.8 + 2.4 * s.tension) * (riding ? 1.4 : 1);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      if (riding) {
        // The strand gives a little under the Drop.
        const px = sx(drop.x);
        const py = sy(drop.y) + 5;
        ctx.lineTo(px, py);
      } else {
        const tw = twang.get(s.id);
        const amp = reduced ? 0 : (tw ? tw.amp * Math.exp(-(now - tw.t) * 4) : 0) + 1.2;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const nx = -(by - ay) / len;
        const ny = (bx - ax) / len;
        const wob = Math.sin(now * (tw ? 30 : 1.3) + s.ax * 0.01) * amp;
        ctx.quadraticCurveTo(mx + nx * wob, my + ny * wob, bx, by);
      }
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  // Possible paths before/after a relationship change.
  for (const g of ghosts) {
    ctx.save();
    ctx.strokeStyle = g.kind === 'before' ? theme.faint : theme.ink;
    ctx.setLineDash(g.kind === 'before' ? [6, 6] : [2, 5]);
    ctx.lineWidth = g.kind === 'before' ? 1.5 : 2;
    ctx.beginPath();
    let last = null;
    const tile = view.ghostTile;
    for (const p of g.points) {
      const x = sx(p.x);
      const y = sy(tile === undefined ? p.y : tile + ((((p.y - tile) % H) + H) % H));
      if (!last || Math.abs(y - last.y) > h / 2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      last = { x, y };
    }
    ctx.stroke();
    ctx.restore();
  }
  // Legend for the paths, top left.
  ghosts.forEach((g, i) => {
    const y = 18 + i * 18;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = theme.paper;
    ctx.fillRect(8, y - 11, 210, 18);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = g.kind === 'before' ? theme.faint : theme.ink;
    ctx.setLineDash(g.kind === 'before' ? [6, 6] : [2, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, y - 3);
    ctx.lineTo(44, y - 3);
    ctx.stroke();
    ctx.fillStyle = theme.ink;
    ctx.font = `12px ${theme.font}`;
    ctx.textAlign = 'left';
    ctx.fillText(g.label, 52, y + 1);
    ctx.restore();
  });

  // Works: presence, then identity, then meaning as the Drop comes closer.
  const labelled = [];
  for (let k = k0; k <= k1; k++) {
    const off = k * H;
    for (const n of world.nodes) {
      const x = sx(n.x);
      const y = sy(n.y + off);
      if (y < -80 || y > h + 80) continue;
      const work = workById.get(n.id);
      const d = Math.hypot(n.x - from.x, n.y + off - from.y);
      const r = n.r * scale;
      ctx.fillStyle = theme.paper;
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = n.id === focusId ? 2.5 : 1.4;
      ctx.setLineDash(work?.private ? [4, 3] : []);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      // Persistence left by Dew: beads on the rim (this device only).
      const beads = Math.min(8, (dew[n.id] || []).length);
      for (let i = 0; i < beads; i++) {
        const a = -Math.PI / 2 + (i - (beads - 1) / 2) * 0.32;
        ctx.fillStyle = theme.ink;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // A small inner mark: sample works get an S, private ideas a keyhole.
      ctx.fillStyle = theme.soft;
      ctx.font = `600 ${Math.max(9, 11 * scale + 3)}px ${theme.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(work?.sample ? 'S' : '•', x, y);
      labelled.push({ n, work, x, y, r, d });
    }
  }
  // Only the nearest few carry words, placed so they never overlap each other
  // or a work's circle; a label that cannot fit cleanly is left out.
  labelled.sort((a, b) => a.d - b.d);
  ctx.textBaseline = 'alphabetic';
  const taken = labelled.filter((L) => L.y > -40 && L.y < h + 40).map((L) => ({ x: L.x - L.r, y: L.y - L.r, w: 2 * L.r, h: 2 * L.r }));
  taken.push(...(view.avoid || []), { x: sx(drop.x) - 16, y: sy(drop.y) - 16, w: 32, h: 32 });
  if (ghosts.length) taken.push({ x: 8, y: 7, w: 210, h: ghosts.length * 18 + 4 });
  const hits = (b) => taken.some((t) => b.x < t.x + t.w && b.x + b.w > t.x && b.y < t.y + t.h && b.y + b.h > t.y);
  let shown = 0;
  for (const L of labelled) {
    if (shown >= 5 || L.d > 700 || !L.work || L.n.id === focusId) continue;
    const maxW = Math.min(200, w * 0.4);
    ctx.font = `600 13px ${theme.font}`;
    const title = wrapText(ctx, L.work.title, maxW).slice(0, 2);
    ctx.font = `12px ${theme.font}`;
    let sum = L.d < 300 && L.work.summary ? wrapText(ctx, L.work.summary, maxW).slice(0, 2) : [];
    const widthOf = (lines, f) => {
      ctx.font = f;
      return Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    };
    const tw = Math.max(widthOf(title, `600 13px ${theme.font}`), widthOf(sum, `12px ${theme.font}`), 60);
    const place = (withSum) => {
      const bh = 14 + title.length * 15 + (withSum ? sum.length * 14 + 4 : 0);
      const opts = [
        { side: 'right', x: L.x + L.r + 8, y: L.y - 18 },
        { side: 'left', x: L.x - L.r - 8 - tw, y: L.y - 18 },
        { side: 'below', x: L.x - tw / 2, y: L.y + L.r + 4 },
        { side: 'above', x: L.x - tw / 2, y: L.y - L.r - 4 - bh },
      ];
      for (const o of opts) {
        const box = { x: o.x - 2, y: o.y - 2, w: tw + 4, h: bh + 4 };
        if (box.x < 4 || box.x + box.w > w - 4 || box.y < 4 || box.y + box.h > h - 4) continue;
        if (!hits(box)) return { ...o, box };
      }
      return null;
    };
    let spot = place(true);
    if (!spot && sum.length) {
      sum = [];
      spot = place(false);
    }
    if (!spot) continue;
    taken.push(spot.box);
    shown++;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = theme.paper;
    ctx.fillRect(spot.box.x, spot.box.y, spot.box.w, spot.box.h);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.soft;
    ctx.font = `10px ${theme.font}`;
    ctx.fillText(L.work.sample ? 'SAMPLE' : 'YOUR IDEA · PRIVATE', spot.x, spot.y + 9);
    ctx.fillStyle = theme.ink;
    ctx.font = `600 13px ${theme.font}`;
    title.forEach((line, i) => ctx.fillText(line, spot.x, spot.y + 24 + i * 15));
    ctx.fillStyle = theme.soft;
    ctx.font = `12px ${theme.font}`;
    sum.forEach((line, i) => ctx.fillText(line, spot.x, spot.y + 28 + title.length * 15 + i * 14));
  }
  ctx.textAlign = 'left';

  // The Drop and its recent path.
  ctx.strokeStyle = theme.faint;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (const p of trail) {
    const x = sx(p.x);
    const y = sy(p.y);
    if (first) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    first = false;
  }
  ctx.stroke();
  const dx = sx(drop.x);
  const dy = sy(drop.y);
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.arc(dx, dy, 8, 0, Math.PI * 2);
  ctx.fill();
  if (drop.mode === 'settle' || drop.mode === 'adhered' || drop.mode === 'rest') {
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1;
    ctx.setLineDash(drop.mode === 'rest' ? [3, 4] : []);
    const rr = 14 + (reduced ? 0 : Math.sin(now * 3) * 2);
    ctx.beginPath();
    ctx.arc(dx, dy, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (drop.mode === 'adhered') {
    // Adhered: a short thread to the work it is holding on to.
    const n = world.nodeById.get(drop.anchorId);
    if (n) {
      const ny = sy(drop.y + wrapDy(n.y - drop.y, H));
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(sx(n.x), ny);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // The floating thumb joystick.
  if (thumb) {
    ctx.strokeStyle = theme.faint;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(thumb.ox, thumb.oy, thumb.radius, 0, Math.PI * 2);
    ctx.stroke();
    let kx = thumb.x - thumb.ox;
    let ky = thumb.y - thumb.oy;
    const m = Math.hypot(kx, ky);
    if (m > thumb.radius) {
      kx = (kx / m) * thumb.radius;
      ky = (ky / m) * thumb.radius;
    }
    ctx.fillStyle = thumb.dragging ? theme.soft : theme.faint;
    ctx.beginPath();
    ctx.arc(thumb.ox + kx, thumb.oy + ky, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}
