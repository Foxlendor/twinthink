// Thumb/pointer and keyboard -> { drift, hold }.
// Touch without moving = hold (settle). Drag = Drift, measured from where the
// thumb came down (a floating joystick). Lifting = release. Device tilt and
// orientation are never read.

const DEADZONE = 14; // px before a touch becomes Drift
const RADIUS = 80; // px of thumb travel for full Drift

export function createInput(surface, { onJudgment } = {}) {
  const pointer = { id: null, ox: 0, oy: 0, x: 0, y: 0, dragging: false };
  const keys = new Set();

  surface.addEventListener('pointerdown', (e) => {
    if (pointer.id !== null) return;
    pointer.id = e.pointerId;
    pointer.ox = pointer.x = e.clientX;
    pointer.oy = pointer.y = e.clientY;
    pointer.dragging = false;
    surface.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer.id) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (Math.hypot(pointer.x - pointer.ox, pointer.y - pointer.oy) > DEADZONE) pointer.dragging = true;
  });
  const end = (e) => {
    if (e.pointerId !== pointer.id) return;
    pointer.id = null;
    pointer.dragging = false;
  };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
  surface.addEventListener('lostpointercapture', end);
  surface.addEventListener('contextmenu', (e) => e.preventDefault());

  const typing = (e) => e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]');
  const MOVE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '];
  window.addEventListener('keydown', (e) => {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (MOVE.includes(k)) {
      if (k === ' ' && e.target instanceof HTMLElement && e.target.closest('button, a, summary')) return;
      if (!surface.isConnected || surface.closest('[hidden]')) return;
      keys.add(k);
      e.preventDefault();
    } else if (k === 'e' && !e.repeat) onJudgment?.('dew');
    else if (k === 'q' && !e.repeat) onJudgment?.('drop');
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.delete(k);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    pointer.id = null;
  });

  return {
    read() {
      let dx = 0;
      let dy = 0;
      let hold = false;
      if (pointer.id !== null) {
        if (pointer.dragging) {
          dx = (pointer.x - pointer.ox) / RADIUS;
          dy = (pointer.y - pointer.oy) / RADIUS;
        } else hold = true;
      }
      if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
      if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
      if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
      if (keys.has('ArrowDown') || keys.has('s')) dy += 1;
      if (keys.has(' ')) hold = true;
      const m = Math.hypot(dx, dy);
      if (m > 1) {
        dx /= m;
        dy /= m;
      }
      return { drift: { x: dx, y: dy }, hold };
    },
    // For drawing the joystick where the thumb is.
    thumb() {
      if (pointer.id === null) return null;
      return { ox: pointer.ox, oy: pointer.oy, x: pointer.x, y: pointer.y, dragging: pointer.dragging, radius: RADIUS };
    },
  };
}
