export interface Vec {
  x: number;
  y: number;
}

export type Mechanic = 'connect' | 'slice' | 'guide' | 'lasso';

export type Point = readonly [x: number, y: number];

/** Red obstacle: [x, y, radius, moveX?, moveY?, speed?]. Moving ones follow sin(time * speed). */
export type Bomb = readonly [x: number, y: number, r: number, moveX?: number, moveY?: number, speed?: number];

/** Axis-aligned rectangle: [x, y, width, height]. */
export type Rect = readonly [x: number, y: number, w: number, h: number];

export interface Level {
  id: string;
  type: Mechanic;
  hint: string;
  /** Ink budget in logical units of stroke length. */
  ink: number;
  /** Targets: numbered dots (connect), stars (slice) or diamonds (lasso). */
  dots?: readonly Point[];
  bombs?: readonly Bomb[];
  blocks?: readonly Rect[];
  /** Guide levels: ball start and cup. */
  spawn?: Point;
  goal?: Rect;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

/** A bomb's position at the current tick. */
export interface Circle {
  x: number;
  y: number;
  r: number;
}
