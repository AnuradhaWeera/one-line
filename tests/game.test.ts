import { describe, expect, it } from 'vitest';
import { Game, starsFor, type GameEvent } from '../src/game/game';
import { pointInPolygon, segmentHitsRect } from '../src/game/geometry';
import type { Level } from '../src/game/types';
import { attempt } from './solver';

const connect: Level = { id: 't-c', type: 'connect', hint: '', ink: 600, dots: [[90, 360], [180, 360], [270, 360]] };

describe('geometry', () => {
  it('detects points in a polygon', () => {
    const sq = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(pointInPolygon(5, 5, sq)).toBe(true);
    expect(pointInPolygon(15, 5, sq)).toBe(false);
  });
  it('detects a segment crossing a rectangle', () => {
    expect(segmentHitsRect(0, 50, 100, 50, 40, 40, 20, 20, 0)).toBe(true);
    expect(segmentHitsRect(0, 0, 100, 0, 40, 40, 20, 20, 0)).toBe(false);
  });
});

describe('stars', () => {
  it('awards by ink used', () => {
    expect(starsFor(0.5)).toBe(3);
    expect(starsFor(0.8)).toBe(2);
    expect(starsFor(0.95)).toBe(1);
  });
});

describe('connect', () => {
  it('wins when all dots are joined in order', () => {
    const r = attempt(connect, [{ x: 70, y: 360 }, { x: 290, y: 360 }]);
    expect(r.won).toBe(true);
    expect(r.events.filter((e) => e.type === 'touch')).toHaveLength(3);
  });
  it('fails when dots are joined out of order', () => {
    const r = attempt(connect, [{ x: 270, y: 360 }, { x: 90, y: 360 }]);
    expect(r.won).toBe(false);
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'order' });
  });
  it('calls one missing dot a near miss', () => {
    const r = attempt(connect, [{ x: 70, y: 360 }, { x: 190, y: 360 }]);
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', near: true });
  });
  it('stops the stroke when ink runs out', () => {
    const tight: Level = { ...connect, ink: 100 };
    const r = attempt(tight, [{ x: 70, y: 360 }, { x: 290, y: 360 }]);
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'ink' });
  });
  it('treats a tap as no attempt', () => {
    const g = new Game(connect);
    g.pointerDown({ x: 10, y: 600 });
    g.pointerUp();
    expect(g.phase).toBe('ready');
  });
});

describe('red obstacles', () => {
  it('fails when the line touches red', () => {
    const lvl: Level = { ...connect, bombs: [[135, 360, 10]] };
    const r = attempt(lvl, [{ x: 70, y: 360 }, { x: 290, y: 360 }]);
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'bomb' });
  });
  it('fails when moving red sweeps into a drawn line', () => {
    const lvl: Level = { id: 't-m', type: 'connect', hint: '', ink: 2000, dots: [[60, 200], [300, 200], [300, 500]],
      bombs: [[180, 350, 15, 0, 150, 0.05]] };
    const events: GameEvent[] = [];
    const g = new Game(lvl, (e) => events.push(e));
    g.pointerDown({ x: 60, y: 200 });
    g.pointerMove({ x: 300, y: 200 }); // half done, keep the finger down…
    for (let t = 0; t < 120 && !g.done; t++) g.update(); // …the red reaches y≈200
    expect(events.at(-1)).toMatchObject({ type: 'fail', reason: 'moved' });
  });
});

describe('lasso', () => {
  const lasso: Level = { id: 't-l', type: 'lasso', hint: '', ink: 2000, dots: [[180, 360]], bombs: [[300, 360, 10]] };
  const loop = (r: number, cx = 180) =>
    Array.from({ length: 33 }, (_, i) => ({ x: cx + r * Math.cos((i / 32) * Math.PI * 2), y: 360 + r * Math.sin((i / 32) * Math.PI * 2) }));
  it('wins with a closed loop around the diamond', () => {
    expect(attempt(lasso, loop(60)).won).toBe(true);
  });
  it('fails when the loop is left open', () => {
    const r = attempt(lasso, loop(60).slice(0, 25));
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'open' });
  });
  it('fails when red is trapped inside', () => {
    const r = attempt(lasso, loop(140, 220));
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'trapped' });
  });
});

describe('guide', () => {
  const guide: Level = { id: 't-g', type: 'guide', hint: '', ink: 500, spawn: [80, 150], goal: [230, 560, 90, 50] };
  it('rolls the ball down a ramp into the cup', () => {
    expect(attempt(guide, [{ x: 40, y: 250 }, { x: 260, y: 520 }]).won).toBe(true);
  });
  it('reports a missed ball', () => {
    const r = attempt(guide, [{ x: 200, y: 250 }, { x: 110, y: 330 }]) // ramp misses the ball's drop line;
    expect(r.events.at(-1)).toMatchObject({ type: 'fail', reason: 'fell' });
  });
});
