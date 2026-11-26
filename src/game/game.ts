import {
  DOT_R, H, LASSO_AUTO_CLOSE, LASSO_CLOSE, LASSO_MIN_INK, LINE_W, MAX_SIM_TICKS, MIN_POINT_GAP,
  NEAR_MISS_DIST, STAR2_MAX_INK, STAR3_MAX_INK, STUCK_TICKS,
} from './constants';
import { bombAt, closest, isMoving, pointInPolygon, segmentHitsRect } from './geometry';
import { failMessage, type FailReason } from './messages';
import { stepBall } from './physics';
import type { Ball, Circle, Level, Vec } from './types';

export type Phase = 'ready' | 'drawing' | 'sim' | 'win' | 'fail';
export type Stars = 1 | 2 | 3;

export type GameEvent =
  | { type: 'touch'; index: number; count: number; at: Vec }
  | { type: 'release' }
  | { type: 'bounce'; strength: number }
  | { type: 'win'; stars: Stars; inkFraction: number; at: Vec }
  | { type: 'fail'; reason: FailReason; near: boolean; message: string; at: Vec | null };

export const starsFor = (inkFraction: number): Stars =>
  inkFraction <= STAR3_MAX_INK ? 3 : inkFraction <= STAR2_MAX_INK ? 2 : 1;

/**
 * One attempt at one level. Pure logic: feed it pointer input and call update() at 60 Hz.
 * Everything the outside world needs to react to is emitted as a GameEvent.
 */
export class Game {
  phase: Phase = 'ready';
  readonly stroke: Vec[] = [];
  inkUsed = 0;
  touched: boolean[];
  /** Connect levels: index of the dot that must be touched next. */
  nextIndex = 0;
  ball: Ball | null = null;
  /** Ticks since the level loaded; drives moving obstacles. */
  time = 0;
  bombs: Circle[];
  readonly hasMoving: boolean;

  private minGoalDist = Infinity;
  private stillTicks = 0;
  private simTicks = 0;

  constructor(readonly level: Level, private readonly emit: (e: GameEvent) => void = () => {}) {
    this.touched = (level.dots ?? []).map(() => false);
    this.hasMoving = (level.bombs ?? []).some(isMoving);
    this.bombs = this.bombsAt(0);
  }

  get inkLeft(): number {
    return Math.max(0, 1 - this.inkUsed / this.level.ink);
  }

  get done(): boolean {
    return this.phase === 'win' || this.phase === 'fail';
  }

  /** Lasso: would this target be inside the loop if it closed now? (for live feedback) */
  insideLoop(i: number): boolean {
    const d = this.level.dots?.[i];
    return !!d && this.stroke.length > 8 && pointInPolygon(d[0], d[1], this.stroke);
  }

  // ---------- input ----------

  pointerDown(p: Vec): void {
    if (this.phase !== 'ready') return;
    this.phase = 'drawing';
    this.stroke.length = 0;
    this.stroke.push({ x: p.x, y: p.y });
    if (this.hitsObstacle(p, p)) return this.fail('bomb');
    if (this.collects()) this.collectTargets(p, p);
  }

  pointerMove(p: Vec): void {
    if (this.phase !== 'drawing') return;
    const q = this.stroke[this.stroke.length - 1]!;
    let { x, y } = p;
    let len = Math.hypot(x - q.x, y - q.y);
    if (len < MIN_POINT_GAP) return;

    let outOfInk = false;
    const remaining = this.level.ink - this.inkUsed;
    if (len >= remaining) {
      const k = remaining / len;
      x = q.x + (x - q.x) * k;
      y = q.y + (y - q.y) * k;
      len = remaining;
      outOfInk = true;
    }

    const point = { x, y };
    const bad = this.hitsObstacle(q, point);
    this.stroke.push(point);
    this.inkUsed += len;
    if (bad) return this.fail('bomb');
    if (this.collects() && this.collectTargets(q, point)) return;

    if (this.level.type === 'lasso' && this.inkUsed > LASSO_MIN_INK) {
      const s = this.stroke[0]!;
      if (Math.hypot(x - s.x, y - s.y) < LASSO_AUTO_CLOSE) return this.pointerUp();
    }
    if (outOfInk) this.pointerUp();
  }

  pointerUp(): void {
    if (this.phase !== 'drawing') return;
    const { type } = this.level;

    if (type === 'guide') {
      if (this.stroke.length < 2 || this.inkUsed < 12) return this.resetStroke();
      const [sx, sy] = this.level.spawn!;
      this.ball = { x: sx, y: sy, vx: 0, vy: 0, angle: 0 };
      this.phase = 'sim';
      this.emit({ type: 'release' });
      return;
    }

    if (this.inkUsed < 4 && !this.touched.some(Boolean)) return this.resetStroke();

    if (type === 'lasso') {
      const a = this.stroke[0]!;
      const z = this.stroke[this.stroke.length - 1]!;
      if (this.stroke.length < 8 || Math.hypot(a.x - z.x, a.y - z.y) > LASSO_CLOSE) return this.fail('open');
      if (this.bombs.some((b) => pointInPolygon(b.x, b.y, this.stroke))) return this.fail('trapped');
      this.touched = (this.level.dots ?? []).map((d) => pointInPolygon(d[0], d[1], this.stroke));
      return this.touched.every(Boolean) ? this.win() : this.fail('incomplete');
    }

    this.fail(this.inkUsed >= this.level.ink - 0.5 ? 'ink' : 'incomplete');
  }

  // ---------- simulation ----------

  /** Advance one 60 Hz tick. */
  update(): void {
    if (this.done) return;

    if (this.hasMoving) {
      this.time++;
      this.bombs = this.bombsAt(this.time);
      if (this.phase === 'drawing' && this.strokeTouchesBomb()) return this.fail('moved');
    }

    if (this.phase === 'sim' && this.ball) this.stepSim(this.ball);
  }

  private stepSim(ball: Ball): void {
    const { goal } = this.level;
    const outcome = stepBall(ball, this.stroke, this.bombs, this.level.blocks ?? [], goal!, (s) =>
      this.emit({ type: 'bounce', strength: s }),
    );
    if (outcome === 'goal') return this.win();
    if (outcome === 'hit') return this.fail('spike');

    this.simTicks++;
    const [gx, gy, gw, gh] = goal!;
    this.minGoalDist = Math.min(this.minGoalDist, Math.hypot(ball.x - (gx + gw / 2), ball.y - (gy + gh / 2)));
    if (ball.y > H + 30) return this.fail('fell');
    this.stillTicks = Math.hypot(ball.vx, ball.vy) < 0.08 ? this.stillTicks + 1 : 0;
    if (this.stillTicks > STUCK_TICKS || this.simTicks > MAX_SIM_TICKS) this.fail('stuck');
  }

  // ---------- rules ----------

  private collects(): boolean {
    return this.level.type === 'connect' || this.level.type === 'slice';
  }

  /** Collect targets touched by segment q→p, in the order the segment reaches them. Returns true if the attempt ended. */
  private collectTargets(q: Vec, p: Vec): boolean {
    const dots = this.level.dots ?? [];
    const hits: { i: number; t: number }[] = [];
    dots.forEach((d, i) => {
      if (this.touched[i]) return;
      const c = closest(d[0], d[1], q.x, q.y, p.x, p.y);
      if (c.d < DOT_R + 3) hits.push({ i, t: c.t });
    });
    hits.sort((a, b) => a.t - b.t);
    for (const { i } of hits) {
      if (this.level.type === 'connect' && i !== this.nextIndex) {
        this.fail('order');
        return true;
      }
      this.touched[i] = true;
      if (this.level.type === 'connect') this.nextIndex = i + 1;
      const d = dots[i]!;
      this.emit({ type: 'touch', index: i, count: this.touched.filter(Boolean).length, at: { x: d[0], y: d[1] } });
    }
    if (dots.length && this.touched.every(Boolean)) {
      this.win();
      return true;
    }
    return false;
  }

  private hitsObstacle(q: Vec, p: Vec): boolean {
    for (const b of this.bombs) if (closest(b.x, b.y, q.x, q.y, p.x, p.y).d < b.r + LINE_W / 2) return true;
    for (const [x, y, w, h] of this.level.blocks ?? []) {
      if (segmentHitsRect(q.x, q.y, p.x, p.y, x, y, w, h, LINE_W / 2)) return true;
    }
    return false;
  }

  private strokeTouchesBomb(): boolean {
    const s = this.stroke;
    for (const b of this.bombs) {
      for (let i = 1; i < s.length; i++) {
        if (closest(b.x, b.y, s[i - 1]!.x, s[i - 1]!.y, s[i]!.x, s[i]!.y).d < b.r + LINE_W / 2) return true;
      }
    }
    return false;
  }

  private bombsAt(t: number): Circle[] {
    return (this.level.bombs ?? []).map((b) => bombAt(b, t));
  }

  private resetStroke(): void {
    this.phase = 'ready';
    this.stroke.length = 0;
    this.inkUsed = 0;
    this.touched = this.touched.map(() => false);
    this.nextIndex = 0;
  }

  private win(): void {
    if (this.done) return;
    this.phase = 'win';
    const inkFraction = this.inkUsed / this.level.ink;
    this.emit({ type: 'win', stars: starsFor(inkFraction), inkFraction, at: this.winPoint() });
  }

  private fail(reason: FailReason): void {
    if (this.done) return;
    this.phase = 'fail';
    const missing = this.touched.filter((t) => !t).length;
    let near: boolean;
    if (this.level.type === 'guide') near = reason !== 'bomb' && reason !== 'moved' && this.minGoalDist < NEAR_MISS_DIST;
    else if (this.level.type === 'lasso') near = reason === 'incomplete' && missing === 1;
    else near = missing === 1;
    this.emit({
      type: 'fail',
      reason,
      near,
      message: failMessage(this.level.type, reason, missing),
      at: this.ball ? { x: this.ball.x, y: this.ball.y } : this.stroke[this.stroke.length - 1] ?? null,
    });
  }

  private winPoint(): Vec {
    const { type, goal, dots = [] } = this.level;
    if (type === 'guide' && goal) return { x: goal[0] + goal[2] / 2, y: goal[1] };
    if (type === 'lasso' && dots.length) {
      return { x: dots.reduce((s, d) => s + d[0], 0) / dots.length, y: dots.reduce((s, d) => s + d[1], 0) / dots.length };
    }
    return this.stroke[this.stroke.length - 1] ?? { x: 180, y: 320 };
  }
}
