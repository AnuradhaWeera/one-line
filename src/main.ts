import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import './styles.css';
import { Game, type GameEvent } from './game/game';
import { LEVELS, WORLDS } from './levels';
import { Sfx } from './platform/audio';
import { haptics } from './platform/haptics';
import { loadProgress, saveProgress, type Progress } from './platform/storage';
import { Renderer } from './render/renderer';
import { Ui } from './ui/ui';

const STEP = 1000 / 60;

async function start(): Promise<void> {
  const progress: Progress = await loadProgress();
  const sfx = new Sfx();
  sfx.muted = progress.muted;
  haptics.enabled = progress.haptics;

  const canvas = document.getElementById('cv') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);
  renderer.fx.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let game: Game | null = null;
  let index = 0;
  let tick = 0;
  let resultTimer = 0;

  const unlocked = (i: number) => i === 0 || !!progress.stars[LEVELS[i - 1]!.id];
  const firstUnsolved = () => {
    const i = LEVELS.findIndex((l) => !progress.stars[l.id]);
    return i < 0 ? 0 : i;
  };

  const ui = new Ui({
    play: () => {
      sfx.unlock();
      load(firstUnsolved());
    },
    pickLevel: (i) => {
      sfx.unlock();
      load(i);
    },
    retry: () => load(index),
    next: () => (index < LEVELS.length - 1 ? load(index + 1) : ui.show('levels')),
    toggleSound: () => {
      progress.muted = !progress.muted;
      sfx.muted = progress.muted;
      if (!sfx.muted) sfx.unlock();
      ui.setSound(!progress.muted);
      void saveProgress(progress);
    },
  });
  ui.onShowLevels = () => ui.renderLevels(WORLDS, progress.stars, unlocked);
  ui.setSound(!progress.muted);

  function onEvent(e: GameEvent): void {
    const fx = renderer.fx;
    switch (e.type) {
      case 'touch':
        fx.burst(e.at.x, e.at.y, '#ffffff', 12);
        sfx.touch(e.count);
        haptics.touch();
        break;
      case 'release':
        sfx.release();
        break;
      case 'bounce':
        sfx.bounce(e.strength);
        break;
      case 'win': {
        const id = LEVELS[index]!.id;
        progress.stars[id] = Math.max(progress.stars[id] ?? 0, e.stars);
        void saveProgress(progress);
        fx.burst(e.at.x, e.at.y, '#ffd23f', 40, 6);
        fx.burst(e.at.x, e.at.y, '#6ff0b4', 24, 4);
        sfx.win();
        haptics.win();
        ui.dimHint(false);
        resultTimer = window.setTimeout(() => ui.showWin(e.stars, e.inkFraction, index < LEVELS.length - 1), 750);
        break;
      }
      case 'fail':
        if (e.at && e.reason === 'spike') fx.burst(e.at.x, e.at.y, '#ff5a4e', 20);
        fx.addShake(12);
        sfx.fail(e.near);
        haptics.fail(e.near);
        ui.dimHint(false);
        resultTimer = window.setTimeout(() => ui.showFail(e.near, e.message), 550);
        break;
    }
  }

  function load(i: number): void {
    clearTimeout(resultTimer);
    index = i;
    game = new Game(LEVELS[i]!, onEvent);
    renderer.fx.clear();
    ui.setLevel(i, game.level);
    ui.setInk(1);
    ui.show('play');
  }

  // ---- input ----
  canvas.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    if (!game || ui.current !== 'play' || game.phase !== 'ready') return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not all browsers support capture */
    }
    game.pointerDown(renderer.toWorld(e.clientX, e.clientY));
    ui.dimHint(true);
    ui.setInk(game.inkLeft);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!game || game.phase !== 'drawing') return;
    const events = e.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e]) {
      if (game.phase !== 'drawing') break;
      game.pointerMove(renderer.toWorld(ev.clientX, ev.clientY));
    }
    ui.setInk(game.inkLeft);
  });
  const up = () => {
    if (!game || game.phase !== 'drawing') return;
    game.pointerUp();
    if (game.stroke.length === 0) ui.dimHint(false); // it was a tap, not a stroke: back to ready
    ui.setInk(game.inkLeft);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  addEventListener('keydown', (e) => {
    if (e.key === 'r' && ui.current === 'play') load(index);
  });

  // ---- lifecycle ----
  const resize = () => {
    const { w, h } = ui.fit();
    renderer.resize(w, h);
  };
  addEventListener('resize', resize);
  resize();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sfx.suspend();
  });

  // ---- fixed-step loop ----
  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) {
      tick++;
      game?.update();
      renderer.fx.update();
      acc -= STEP;
    }
    renderer.draw(ui.current === 'play' ? game : null, tick);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void start();
