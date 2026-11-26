import { BALL_R, DOT_R, H, LINE_W, W } from '../game/constants';
import type { Game } from '../game/game';
import type { Vec } from '../game/types';
import { Effects } from './effects';

const C = {
  bgTop: '#13474f',
  bgBottom: '#0c3439',
  line: '#ffd23f',
  danger: '#ff5a4e',
  dangerLight: '#ff8a7f',
  dangerDark: '#d93a30',
  good: '#6ff0b4',
  target: '#ffffff',
  slate: '#0f3d44',
};

/** Draws a Game onto a canvas. Reads state only; never mutates the game. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private scale = 1;
  readonly fx = new Effects();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
  }

  resize(cssWidth: number, cssHeight: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.scale = this.canvas.width / W;
  }

  /** Convert a pointer event to logical world coordinates. */
  toWorld(clientX: number, clientY: number): Vec {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) * W) / r.width, y: ((clientY - r.top) * H) / r.height };
  }

  draw(game: Game | null, tick: number): void {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const [sx, sy] = this.fx.shakeOffset();
    ctx.translate(sx, sy);
    this.background();
    if (!game) return;

    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.12);
    const L = game.level;

    if (L.type === 'guide' && L.goal) this.cup(L.goal);
    for (const r of L.blocks ?? []) this.block(r);
    for (const b of L.bombs ?? []) {
      if (b[3] || b[4]) this.track(b[0] - (b[3] ?? 0), b[1] - (b[4] ?? 0), b[0] + (b[3] ?? 0), b[1] + (b[4] ?? 0));
    }
    for (const b of game.bombs) this.bomb(b.x, b.y, b.r, pulse);
    this.targets(game, pulse);

    if (L.type === 'guide' && L.spawn && (game.phase === 'ready' || game.phase === 'drawing')) {
      this.dropGuide(L.spawn[0], L.spawn[1]);
    }
    if (L.type === 'lasso' && game.phase === 'drawing' && game.stroke.length) this.lassoStart(game, pulse);
    if (game.stroke.length > 1) this.stroke(game.stroke, game.phase === 'fail' && !game.ball ? C.danger : C.line);
    if (L.type === 'guide' && L.spawn) {
      const b = game.ball ?? { x: L.spawn[0], y: L.spawn[1], angle: 0 };
      this.ballSprite(b.x, b.y, b.angle);
    }
    this.fx.draw(ctx);
  }

  // ---------- pieces ----------

  private background(): void {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.bgTop);
    g.addColorStop(1, C.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = 15; x < W; x += 30) for (let y = 105; y < H; y += 30) ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  private cup([x, y, w, h]: readonly number[]): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,210,63,.12)';
    ctx.fillRect(x!, y!, w!, h!);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x!, y!);
    ctx.lineTo(x! + 6, y! + h!);
    ctx.lineTo(x! + w! - 6, y! + h!);
    ctx.lineTo(x! + w!, y!);
    ctx.stroke();
    ctx.restore();
  }

  private block([x, y, w, h]: readonly number[]): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,90,78,.2)';
    ctx.strokeStyle = C.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x!, y!, w!, h!, 10);
    ctx.fill();
    ctx.stroke();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,90,78,.35)';
    ctx.lineWidth = 6;
    for (let k = -h!; k < w!; k += 22) {
      ctx.beginPath();
      ctx.moveTo(x! + k, y! + h!);
      ctx.lineTo(x! + k + h!, y!);
      ctx.stroke();
    }
    ctx.restore();
  }

  private track(x0: number, y0: number, x1: number, y1: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = 'rgba(255,90,78,.3)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  private bomb(x: number, y: number, r: number, pulse: number): void {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, C.dangerLight);
    g.addColorStop(1, C.dangerDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,90,78,${0.25 + 0.25 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 4 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  private targets(game: Game, pulse: number): void {
    const ctx = this.ctx;
    const L = game.level;
    const live = L.type === 'lasso' && game.phase === 'drawing';
    (L.dots ?? []).forEach(([x, y], i) => {
      const on = game.touched[i] || (live && game.insideLoop(i));
      const fill = on ? C.good : C.target;
      ctx.save();
      if (L.type === 'connect' && i === game.nextIndex && !on) {
        ctx.strokeStyle = `rgba(255,255,255,${0.3 + 0.4 * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, DOT_R + 5 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (L.type === 'lasso') {
        ctx.beginPath();
        ctx.moveTo(x, y - DOT_R - 2);
        ctx.lineTo(x + DOT_R, y);
        ctx.lineTo(x, y + DOT_R + 2);
        ctx.lineTo(x - DOT_R, y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.fillStyle = 'rgba(15,61,68,.35)';
        ctx.beginPath();
        ctx.moveTo(x, y - DOT_R - 2);
        ctx.lineTo(x + DOT_R, y);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
      } else if (L.type === 'slice') {
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const r = k % 2 ? DOT_R * 0.5 : DOT_R + 2;
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.fillStyle = C.slate;
        ctx.font = '800 16px "Baloo 2", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x, y + 1);
      }
      ctx.restore();
    });
  }

  private dropGuide(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + BALL_R + 4);
    ctx.lineTo(x, H);
    ctx.stroke();
    ctx.restore();
  }

  private lassoStart(game: Game, pulse: number): void {
    const ctx = this.ctx;
    const a = game.stroke[0]!;
    const z = game.stroke[game.stroke.length - 1]!;
    const near = game.inkUsed > 150 && Math.hypot(a.x - z.x, a.y - z.y) < 60;
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = near ? C.good : 'rgba(255,255,255,.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(a.x, a.y, near ? 16 + pulse * 4 : 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private stroke(pts: readonly Vec[], color: string): void {
    const ctx = this.ctx;
    const path = (dx: number, dy: number) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x + dx, p.y + dy) : ctx.moveTo(p.x + dx, p.y + dy)));
      ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = LINE_W;
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    path(2, 3);
    ctx.strokeStyle = color;
    path(0, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    path(-1, -1.5);
    ctx.restore();
  }

  private ballSprite(x: number, y: number, angle: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_R - 4, -0.6, 0.6);
    ctx.stroke();
    ctx.restore();
  }
}
