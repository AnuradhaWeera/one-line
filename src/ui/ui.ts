import type { Stars } from '../game/game';
import type { Level, Mechanic } from '../game/types';
import type { World } from '../levels';

export type ScreenName = 'title' | 'levels' | 'play';

const TYPE_LABEL: Record<Mechanic, string> = {
  connect: 'Connect · in order',
  slice: 'Slice · any order',
  guide: 'Guide · ramp the ball',
  lasso: 'Lasso · loop them all',
};

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

export interface UiHandlers {
  play(): void;
  pickLevel(index: number): void;
  retry(): void;
  next(): void;
  toggleSound(): void;
}

/** All DOM work lives here; the canvas game board is drawn by the Renderer. */
export class Ui {
  readonly game = $('game');

  constructor(h: UiHandlers) {
    $('bPlay').onclick = () => h.play();
    $('bLevels').onclick = () => this.show('levels');
    $('bBack').onclick = () => this.show('title');
    $('bMenu').onclick = () => this.show('levels');
    $('bRetry').onclick = () => h.retry();
    $('ovRetry').onclick = () => h.retry();
    $('ovNext').onclick = () => h.next();
    $('bSound').onclick = () => h.toggleSound();
    this.onPick = h.pickLevel;
    $('version').textContent = `Prototype ${__APP_VERSION__}`;
  }

  private onPick: (i: number) => void;
  current: ScreenName = 'title';

  show(screen: ScreenName): void {
    this.current = screen;
    $('title').classList.toggle('hidden', screen !== 'title');
    $('levels').classList.toggle('hidden', screen !== 'levels');
    $('hud').classList.toggle('hidden', screen !== 'play');
    if (screen !== 'play') this.hideResult();
    if (screen === 'levels') this.onShowLevels?.();
  }

  onShowLevels?: () => void;

  /** Fit a 9:16 board into the viewport; returns its CSS size. */
  fit(): { w: number; h: number } {
    const wrap = $('wrap');
    const cs = getComputedStyle(wrap);
    const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let h = availH;
    let w = (h * 9) / 16;
    if (w > availW) {
      w = availW;
      h = (w * 16) / 9;
    }
    this.game.style.width = `${w}px`;
    this.game.style.height = `${h}px`;
    this.game.style.fontSize = `${(w / 360) * 16}px`;
    return { w, h };
  }

  setLevel(index: number, level: Level): void {
    $('lvlNum').textContent = `Level ${index + 1}`;
    $('lvlType').textContent = TYPE_LABEL[level.type];
    $('hint').textContent = level.hint;
    this.dimHint(false);
    this.hideResult();
  }

  setInk(fractionLeft: number): void {
    $('inkFill').style.width = `${fractionLeft * 100}%`;
    $('ink').classList.toggle('low', fractionLeft < 0.25);
  }

  dimHint(dim: boolean): void {
    $('hint').classList.toggle('dim', dim);
  }

  setSound(on: boolean): void {
    $('bSound').classList.toggle('off', !on);
  }

  showWin(stars: Stars, inkFraction: number, hasNext: boolean): void {
    $('ovTitle').textContent = ({ 1: 'Solved', 2: 'Nice line!', 3: 'Perfect!' } as const)[stars];
    $('ovStars').innerHTML = [1, 2, 3].map((k) => (k <= stars ? '★' : '<span class="off">★</span>')).join('');
    $('ovMsg').textContent =
      stars < 3 ? 'Use under 70% of the ink for 3 stars.' : `Used only ${Math.round(inkFraction * 100)}% of the ink.`;
    const next = $('ovNext');
    next.classList.remove('hidden');
    next.textContent = hasNext ? 'Next' : 'Levels';
    $('overlay').classList.remove('hidden');
    next.focus({ preventScroll: true });
  }

  showFail(near: boolean, message: string): void {
    $('ovTitle').textContent = near ? 'So close!' : 'Try again';
    $('ovStars').innerHTML = '';
    $('ovMsg').textContent = message;
    $('ovNext').classList.add('hidden');
    $('overlay').classList.remove('hidden');
    $('ovRetry').focus({ preventScroll: true });
  }

  hideResult(): void {
    $('overlay').classList.add('hidden');
  }

  get resultOpen(): boolean {
    return !$('overlay').classList.contains('hidden');
  }

  renderLevels(worlds: World[], stars: Record<string, number>, unlocked: (index: number) => boolean): void {
    let index = 0;
    const box = $('worlds');
    box.replaceChildren();
    for (const w of worlds) {
      const section = document.createElement('section');
      section.className = 'world';
      const h = document.createElement('h3');
      h.textContent = w.name;
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (const lvl of w.levels) {
        const i = index++;
        const s = stars[lvl.id] ?? 0;
        const open = unlocked(i);
        const b = document.createElement('button');
        b.className = `cell${open ? '' : ' locked'}${s ? ' done' : ''}`;
        b.disabled = !open;
        b.setAttribute('aria-label', `Level ${i + 1}, ${lvl.type}${open ? `, ${s} stars` : ', locked'}`);
        b.innerHTML = `${i + 1}<small>${lvl.type}</small><span class="st">${s ? '★'.repeat(s) : ''}</span>`;
        if (open) b.onclick = () => this.onPick(i);
        grid.append(b);
      }
      section.append(h, grid);
      box.append(section);
    }
  }
}
