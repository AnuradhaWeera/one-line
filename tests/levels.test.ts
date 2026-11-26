import { describe, expect, it } from 'vitest';
import { H, W } from '../src/game/constants';
import { LEVELS } from '../src/levels';
import { solve } from './solver';

describe('level data', () => {
  it('has unique ids', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(LEVELS.map((l) => [l.id, l] as const))('%s is well-formed', (_, l) => {
    expect(l.ink).toBeGreaterThan(0);
    for (const [x, y] of l.dots ?? []) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(W);
      expect(y).toBeGreaterThanOrEqual(100); // below the HUD
      expect(y).toBeLessThanOrEqual(H);
    }
    if (l.type === 'guide') {
      expect(l.spawn).toBeDefined();
      expect(l.goal).toBeDefined();
    } else {
      expect(l.dots?.length).toBeGreaterThan(0);
    }
  });
});

describe('every level is solvable within its ink budget', () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))('%s', (_, level) => {
    const s = solve(level);
    expect(s, `no solution found for ${level.id}`).not.toBeNull();
  });
});
