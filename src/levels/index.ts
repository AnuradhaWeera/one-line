import type { Level } from '../game/types';
import { WORLD1 } from './world1';
import { WORLD2 } from './world2';

export interface World {
  id: string;
  name: string;
  levels: Level[];
}

export const WORLDS: World[] = [
  { id: 'w1', name: 'First Lines', levels: WORLD1 },
  { id: 'w2', name: 'Loops & Motion', levels: WORLD2 },
];

/** All levels in play order. */
export const LEVELS: Level[] = WORLDS.flatMap((w) => w.levels);
