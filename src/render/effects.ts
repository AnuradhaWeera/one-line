interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

/** Particles and screen shake: the "juice". Purely visual. */
export class Effects {
  private particles: Particle[] = [];
  private shake = 0;
  reducedMotion = false;

  burst(x: number, y: number, color: string, count = 14, speed = 4): void {
    if (this.reducedMotion) count = Math.ceil(count / 3);
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random());
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
    }
  }

  addShake(amount: number): void {
    if (!this.reducedMotion) this.shake = Math.max(this.shake, amount);
  }

  clear(): void {
    this.particles = [];
    this.shake = 0;
  }

  /** Advance one 60 Hz tick. */
  update(): void {
    if (this.shake) this.shake = this.shake < 0.5 ? 0 : this.shake * 0.85;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.98;
      p.life -= 0.025;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  shakeOffset(): [number, number] {
    return this.shake ? [(Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake] : [0, 0];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 + p.life * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
