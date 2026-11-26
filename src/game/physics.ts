import { BALL_R, GRAVITY, LINE_W, MAX_SPEED, PHYSICS_SUBSTEPS, RESTITUTION, W } from './constants';
import { closest } from './geometry';
import type { Ball, Circle, Rect, Vec } from './types';

export type BallOutcome = 'goal' | 'hit' | null;

/**
 * Advance the ball one 60 Hz tick: gravity, collisions with the drawn stroke and the side walls,
 * then checks against red obstacles and the cup.
 */
export function stepBall(
  ball: Ball,
  stroke: readonly Vec[],
  bombs: readonly Circle[],
  blocks: readonly Rect[],
  goal: Rect,
  onBounce?: (strength: number) => void,
): BallOutcome {
  const S = PHYSICS_SUBSTEPS;
  const R = BALL_R + LINE_W / 2;
  for (let s = 0; s < S; s++) {
    ball.vy += GRAVITY / S;
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > MAX_SPEED) {
      ball.vx *= MAX_SPEED / sp;
      ball.vy *= MAX_SPEED / sp;
    }
    ball.x += ball.vx / S;
    ball.y += ball.vy / S;

    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1]!;
      const b = stroke[i]!;
      const c = closest(ball.x, ball.y, a.x, a.y, b.x, b.y);
      if (c.d >= R) continue;
      let nx: number;
      let ny: number;
      if (c.d > 1e-6) {
        nx = (ball.x - c.cx) / c.d;
        ny = (ball.y - c.cy) / c.d;
      } else {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        nx = -dy / l;
        ny = dx / l;
        if (ny > 0) { nx = -nx; ny = -ny; }
      }
      ball.x = c.cx + nx * R;
      ball.y = c.cy + ny * R;
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= (1 + RESTITUTION) * vn * nx;
        ball.vy -= (1 + RESTITUTION) * vn * ny;
        onBounce?.(-vn);
      }
      ball.vx *= 0.9995;
      ball.vy *= 0.9995;
    }

    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.5; }

    for (const b of bombs) if (Math.hypot(ball.x - b.x, ball.y - b.y) < b.r + BALL_R) return 'hit';
    for (const [rx, ry, rw, rh] of blocks) {
      const cx = Math.max(rx, Math.min(ball.x, rx + rw));
      const cy = Math.max(ry, Math.min(ball.y, ry + rh));
      if (Math.hypot(ball.x - cx, ball.y - cy) < BALL_R) return 'hit';
    }
    const [gx, gy, gw, gh] = goal;
    if (ball.x > gx && ball.x < gx + gw && ball.y > gy && ball.y < gy + gh) return 'goal';
  }
  ball.angle += ball.vx / BALL_R;
  return null;
}
