import type { Bomb, Point } from '../game/types';

/** n points evenly spaced on a circle, starting at the top. */
export const ring = (cx: number, cy: number, r: number, n: number): Point[] =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))] as const;
  });

/** A row of small red spikes along y between x0 and x1. */
export const spikeRow = (x0: number, x1: number, y: number, gap = 30, r = 13): Bomb[] => {
  const out: Bomb[] = [];
  for (let x = x0; x <= x1; x += gap) out.push([x, y, r]);
  return out;
};
