// Plots: the Canvas grid, in blocks of 3 x 3 cells. A plot is a neighbourhood
// of related ideas that someone looks after. For now only the founder holds
// plots (around each of their public ideas); early members will be offered
// open plots, bought or earned through real, sustained work.

import { IdeaNode } from './model';
import { hash01 } from './rng';

/** One grid cell, in Canvas units (the Canvas lattice spacing). */
export const CELL = 1 / 8;
export const PLOT = 3 * CELL;

export interface Plot {
  /** Lower-left corner in Canvas units. */
  x: number;
  y: number;
  holder: string;
  hue: number;
}

/** The founder's plots: the 3 x 3 block holding each of their public ideas. */
export function founderPlots(field: IdeaNode[], holder = 'johne.boi'): Plot[] {
  const seen = new Map<string, Plot>();
  for (const n of field) {
    if (n.ownedBy || n.id.startsWith('local/')) continue;
    // plots tile a fixed 3 x 3 grid, so they never overlap; ideas that fall in
    // the same block share it
    const cx = Math.floor(n.x / PLOT);
    const cy = Math.floor(n.y / PLOT);
    const x = cx * PLOT;
    const y = cy * PLOT;
    const key = `${cx},${cy}`;
    if (!seen.has(key)) seen.set(key, { x, y, holder, hue: Math.floor(hash01(cx * 131 + cy, 7) * 360) });
  }
  return [...seen.values()];
}
