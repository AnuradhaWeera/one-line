/** Tiny synthesized sound effects. No audio files, so the app stays small. */
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  private lastBounce = 0;

  /** Must be called from a user gesture before the first sound (browser autoplay rules). */
  unlock(): void {
    if (this.muted) return;
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  suspend(): void {
    void this.ctx?.suspend().catch(() => {});
  }

  private tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.12, delay = 0): void {
    if (this.muted || !this.ctx) return;
    const a = this.ctx;
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Rising pitch for each collected target: the "combo" feeling. */
  touch(count: number): void {
    this.tone(440 * Math.pow(2, ((count - 1) * 2) / 12), 0.14, 'triangle', 0.13);
  }
  release(): void {
    this.tone(660, 0.08, 'sine', 0.1);
  }
  bounce(strength: number): void {
    const now = performance.now();
    if (strength < 2.2 || now - this.lastBounce < 100) return;
    this.lastBounce = now;
    this.tone(300 + Math.min(strength, 10) * 30, 0.05, 'sine', 0.06);
  }
  win(): void {
    [523, 659, 784, 1047].forEach((f, k) => this.tone(f, 0.18, 'triangle', 0.12, k * 0.08));
  }
  fail(near: boolean): void {
    this.tone(near ? 220 : 150, 0.28, 'sawtooth', 0.07);
  }
}
