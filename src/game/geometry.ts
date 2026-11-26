import type { Bomb, Circle, Vec } from './types';

export interface Closest {
  t: number;
  cx: number;
  cy: number;
  d: number;
}

/** Closest point to (px,py) on segment a→b. */
export function closest(px: number, py: number, ax: number, ay: number, bx: number, by: number): Closest {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return { t, cx, cy, d: Math.hypot(px - cx, py - cy) };
}

/** Do segments (a,b)→(c,d) and (e,f)→(g,h) intersect? */
export function segmentsIntersect(
  a: number, b: number, c: number, d: number,
  e: number, f: number, g: number, h: number,
): boolean {
  const den = (c - a) * (h - f) - (d - b) * (g - e);
  if (!den) return false;
  const t = ((e - a) * (h - f) - (f - b) * (g - e)) / den;
  const u = ((e - a) * (d - b) - (f - b) * (c - a)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Does segment a→b touch rectangle (x,y,w,h) grown by pad? */
export function segmentHitsRect(
  ax: number, ay: number, bx: number, by: number,
  x: number, y: number, w: number, h: number, pad: number,
): boolean {
  x -= pad; y -= pad; w += 2 * pad; h += 2 * pad;
  const inside = (px: number, py: number) => px >= x && px <= x + w && py >= y && py <= y + h;
  if (inside(ax, ay) || inside(bx, by)) return true;
  return (
    segmentsIntersect(ax, ay, bx, by, x, y, x + w, y) ||
    segmentsIntersect(ax, ay, bx, by, x + w, y, x + w, y + h) ||
    segmentsIntersect(ax, ay, bx, by, x, y + h, x + w, y + h) ||
    segmentsIntersect(ax, ay, bx, by, x, y, x, y + h)
  );
}

/** Even-odd point-in-polygon test; the polygon is implicitly closed. */
export function pointInPolygon(x: number, y: number, poly: readonly Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export const isMoving = (b: Bomb): boolean => !!(b[3] || b[4]);

/** Bomb position at simulation tick t. */
export function bombAt(b: Bomb, t: number): Circle {
  if (!isMoving(b)) return { x: b[0], y: b[1], r: b[2] };
  const s = Math.sin(t * (b[5] ?? 0.03));
  return { x: b[0] + (b[3] ?? 0) * s, y: b[1] + (b[4] ?? 0) * s, r: b[2] };
}

export function polylineLength(pts: readonly Vec[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
  return len;
}
