/**
 * Automatic level solver used by the test suite. It proves every level can be beaten
 * within its ink budget by driving the REAL Game class with synthetic strokes.
 *
 * Strokes are drawn "instantly" (all in one tick), so for moving obstacles it proves
 * a solution exists at some moment; it doesn't model human drawing speed.
 */
import { DOT_R, LINE_W } from '../src/game/constants';
import { Game, type GameEvent } from '../src/game/game';
import { bombAt, closest, segmentHitsRect } from '../src/game/geometry';
import type { Circle, Level, Point, Vec } from '../src/game/types';
import { LASSO_SOLUTIONS } from './lasso-solutions';

export interface Solution {
  stroke: Vec[];
  waitTicks: number;
  stars: number;
}

/** Deterministic RNG so test runs are repeatable. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const v = (p: Point): Vec => ({ x: p[0], y: p[1] });
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const pathLen = (p: Vec[]) => p.slice(1).reduce((s, q, i) => s + dist(p[i]!, q), 0);

/** Densify so long straight edges become many points (lasso needs ≥ 8 points). */
function densify(p: Vec[], step = 10): Vec[] {
  const out: Vec[] = [p[0]!];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return out;
}

/** Play one attempt: wait, draw the whole stroke in one tick, lift, then simulate. */
export function attempt(level: Level, stroke: Vec[], waitTicks = 0): { won: boolean; stars: number; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const g = new Game(level, (e) => events.push(e));
  for (let t = 0; t < waitTicks; t++) g.update();
  g.pointerDown(stroke[0]!);
  for (let i = 1; i < stroke.length && g.phase === 'drawing'; i++) g.pointerMove(stroke[i]!);
  g.pointerUp();
  for (let t = 0; t < 1200 && !g.done; t++) g.update();
  const win = events.find((e): e is Extract<GameEvent, { type: 'win' }> => e.type === 'win');
  return { won: g.phase === 'win', stars: win?.stars ?? 0, events };
}

// ---------- connect & slice: route between targets around obstacles ----------

const MARGIN = 3;

function legClear(a: Vec, b: Vec, bombs: Circle[], level: Level, avoid: Vec[]): boolean {
  for (const c of bombs) if (closest(c.x, c.y, a.x, a.y, b.x, b.y).d < c.r + LINE_W / 2 + MARGIN) return false;
  for (const [x, y, w, h] of level.blocks ?? []) if (segmentHitsRect(a.x, a.y, b.x, b.y, x, y, w, h, LINE_W / 2 + MARGIN)) return false;
  for (const d of avoid) if (closest(d.x, d.y, a.x, a.y, b.x, b.y).d < DOT_R + 3 + MARGIN) return false;
  return true;
}

/** Shortest clear path a→b using up to two detour waypoints. */
function route(a: Vec, b: Vec, bombs: Circle[], level: Level, avoid: Vec[]): Vec[] | null {
  if (legClear(a, b, bombs, level, avoid)) return [a, b];
  const cands: Vec[] = [];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const L = dist(a, b) || 1;
  const nx = -(b.y - a.y) / L;
  const ny = (b.x - a.x) / L;
  for (let off = 20; off <= 200; off += 10) for (const s of [1, -1]) cands.push({ x: mx + nx * off * s, y: my + ny * off * s });
  for (const c of bombs) for (let k = 0; k < 16; k++) {
    const ang = (k * Math.PI) / 8;
    const r = c.r + LINE_W / 2 + MARGIN + 6;
    cands.push({ x: c.x + Math.cos(ang) * r, y: c.y + Math.sin(ang) * r });
  }
  for (const [x, y, w, h] of level.blocks ?? []) {
    const p = LINE_W / 2 + MARGIN + 6;
    cands.push({ x: x - p, y: y - p }, { x: x + w + p, y: y - p }, { x: x - p, y: y + h + p }, { x: x + w + p, y: y + h + p });
  }
  let best: Vec[] | null = null;
  const consider = (p: Vec[]) => {
    for (let i = 1; i < p.length; i++) if (!legClear(p[i - 1]!, p[i]!, bombs, level, avoid)) return;
    if (!best || pathLen(p) < pathLen(best)) best = p;
  };
  for (const c of cands) consider([a, c, b]);
  if (best) return best;
  for (const c1 of cands) for (const c2 of cands) consider([a, c1, c2, b]);
  return best;
}

function permutations(n: number): number[][] {
  const out: number[][] = [];
  const rec = (cur: number[], rest: number[]) => {
    if (!rest.length) out.push(cur);
    rest.forEach((r, i) => rec([...cur, r], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], [...Array(n).keys()]);
  return out;
}

function solveTargets(level: Level, waitTicks: number): Solution | null {
  const dots = (level.dots ?? []).map(v);
  const bombs = (level.bombs ?? []).map((b) => bombAt(b, waitTicks));
  const orders = level.type === 'connect' ? [[...dots.keys()]] : permutations(dots.length);
  const legCache = new Map<string, Vec[] | null>();
  const leg = (i: number, j: number, avoid: Vec[]) => {
    const key = `${i}-${j}`;
    if (!legCache.has(key)) legCache.set(key, route(dots[i]!, dots[j]!, bombs, level, avoid));
    return legCache.get(key)!;
  };
  let best: { path: Vec[]; len: number } | null = null;
  for (const order of orders) {
    const path: Vec[] = [dots[order[0]!]!];
    let ok = true;
    for (let k = 1; k < order.length; k++) {
      // connect: legs must not brush a later dot (that would be "wrong order")
      const avoid = level.type === 'connect' ? order.slice(k + 1).map((i) => dots[i]!) : [];
      const l = leg(order[k - 1]!, order[k]!, avoid);
      if (!l) { ok = false; break; }
      path.push(...l.slice(1));
    }
    if (!ok) continue;
    const len = pathLen(path);
    if (len < level.ink && (!best || len < best.len)) best = { path, len };
  }
  if (!best) return null;
  const r = attempt(level, best.path, waitTicks);
  return r.won ? { stroke: best.path, waitTicks, stars: r.stars } : null;
}

// ---------- guide: seeded random search over ramps ----------

function solveGuide(level: Level, tries = 40_000): Solution | null {
  const rnd = mulberry32(level.id.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const sy = level.spawn![1];
  const moving = (level.bombs ?? []).some((b) => b[3] || b[4]);
  for (let k = 0; k < tries; k++) {
    const wait = moving ? Math.floor(rnd() * 240) : 0;
    const bombs = (level.bombs ?? []).map((b) => bombAt(b, wait));
    const n = 2 + Math.floor(rnd() * 3);
    const stroke: Vec[] = [];
    for (let i = 0; i < n; i++) stroke.push({ x: 10 + rnd() * 340, y: sy + 40 + rnd() * (560 - sy) });
    if (pathLen(stroke) > level.ink * 0.95) continue;
    let clear = true;
    for (let i = 1; i < n && clear; i++) clear = legClear(stroke[i - 1]!, stroke[i]!, bombs, level, []);
    if (!clear) continue;
    const r = attempt(level, stroke, wait);
    if (r.won) return { stroke, waitTicks: wait, stars: r.stars };
  }
  return null;
}

// ---------- lasso: hand-written loops ----------

function solveLasso(level: Level): Solution | null {
  const s = LASSO_SOLUTIONS[level.id];
  if (!s) return null;
  const stroke = densify(s.loop.map(v));
  const r = attempt(level, stroke, s.waitTicks ?? 0);
  return r.won ? { stroke, waitTicks: s.waitTicks ?? 0, stars: r.stars } : null;
}

export function solve(level: Level): Solution | null {
  switch (level.type) {
    case 'guide':
      return solveGuide(level);
    case 'lasso':
      return solveLasso(level);
    default: {
      const moving = (level.bombs ?? []).some((b) => b[3] || b[4]);
      for (let wait = 0; wait <= (moving ? 400 : 0); wait += 5) {
        const s = solveTargets(level, wait);
        if (s) return s;
      }
      return null;
    }
  }
}
