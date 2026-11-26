import type { Point } from '../src/game/types';

/**
 * Hand-written reference loops for lasso levels. The last point equals the first.
 * `waitTicks`: for moving red, wait this many 60 Hz ticks before drawing.
 */
export const LASSO_SOLUTIONS: Record<string, { loop: Point[]; waitTicks?: number }> = {
  'w2-01': {
    loop: Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [180 + 70 * Math.cos(a), 350 + 70 * Math.sin(a)] as const;
    }),
  },
  // rectangle with a channel from the left that keeps the centre red outside
  'w2-02': {
    loop: [[70, 220], [290, 220], [290, 530], [70, 530], [70, 415], [230, 415], [230, 335], [70, 335], [70, 220]],
  },
  // three channels (top, left, right) reaching in to exclude each red
  'w2-06': {
    loop: [
      [50, 160], [150, 160], [150, 235], [210, 235], [210, 160], [310, 160], [310, 370], [245, 370],
      [245, 430], [310, 430], [310, 590], [50, 590], [50, 430], [115, 430], [115, 370], [50, 370], [50, 160],
    ],
  },
  // draw while the moving red is far to the right
  'w2-09': {
    loop: [[100, 300], [260, 300], [260, 460], [100, 460], [100, 300]],
    waitTicks: 60,
  },
  // four channels, one per red
  'w2-12': {
    loop: [
      [40, 140], [150, 140], [150, 205], [210, 205], [210, 140], [320, 140], [320, 345], [255, 345],
      [255, 405], [320, 405], [320, 610], [210, 610], [210, 545], [150, 545], [150, 610], [40, 610],
      [40, 405], [105, 405], [105, 345], [40, 345], [40, 140],
    ],
  },
};
