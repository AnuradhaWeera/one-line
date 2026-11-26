import type { Level } from '../game/types';
import { ring } from './helpers';

/** World 2: Lasso, plus red that moves. */
export const WORLD2: Level[] = [
  { id: 'w2-01', type: 'lasso', hint: 'New: draw a loop around all the diamonds. Finish where you started.', ink: 700,
    dots: [[150, 330], [210, 330], [180, 390]] },
  { id: 'w2-02', type: 'lasso', hint: 'Keep the red OUT of your loop.', ink: 1600,
    dots: [[100, 250], [260, 250], [100, 500], [260, 500]], bombs: [[180, 375, 30]] },
  { id: 'w2-03', type: 'connect', hint: 'New: red can move. Be quick.', ink: 1300,
    dots: [[80, 220], [280, 220], [80, 520], [280, 520]], bombs: [[180, 370, 20, 110, 0, 0.03]] },
  { id: 'w2-04', type: 'guide', hint: 'Time your drop past the moving red.', ink: 450,
    spawn: [70, 140], goal: [250, 575, 90, 45], bombs: [[200, 440, 22, 0, 70, 0.04]] },
  { id: 'w2-05', type: 'slice', hint: 'Watch both moving reds.', ink: 1400,
    dots: ring(180, 380, 130, 5), bombs: [[180, 380, 24], [180, 240, 18, 100, 0, 0.04], [180, 520, 18, -100, 0, 0.04]] },
  { id: 'w2-06', type: 'lasso', hint: 'Bend your loop inward between the reds.', ink: 1900,
    dots: [[80, 200], [280, 200], [180, 330], [80, 560], [280, 560]],
    bombs: [[180, 200, 20], [80, 400, 20], [280, 400, 20]] },
  { id: 'w2-07', type: 'guide', hint: 'Red sits right under the ball. Go around it.', ink: 600,
    spawn: [60, 140], goal: [20, 575, 90, 45], bombs: [[60, 380, 22]] },
  { id: 'w2-08', type: 'connect', hint: 'Finish in the middle.', ink: 1500,
    dots: [[60, 200], [300, 200], [300, 560], [60, 560], [180, 380]], bombs: [[180, 290, 18, 0, 60, 0.035]] },
  { id: 'w2-09', type: 'lasso', hint: 'Close the loop while the red is outside.', ink: 900,
    dots: [[130, 330], [230, 330], [130, 430], [230, 430]], bombs: [[180, 380, 20, 150, 0, 0.02]] },
  { id: 'w2-10', type: 'guide', hint: 'Red everywhere. Find the bounce.', ink: 520,
    spawn: [180, 130], goal: [130, 580, 100, 45], bombs: [[90, 350, 22], [270, 350, 22], [180, 450, 20]] },
  { id: 'w2-11', type: 'slice', hint: 'Eight stars. One stroke.', ink: 1900,
    dots: [[60, 180], [180, 180], [300, 180], [60, 380], [300, 380], [60, 580], [180, 580], [300, 580]],
    bombs: [[180, 380, 40], [180, 280, 16, 90, 0, 0.05]] },
  { id: 'w2-12', type: 'lasso', hint: 'Final test: all the diamonds, none of the red.', ink: 2200,
    dots: [[70, 170], [290, 170], [180, 300], [70, 580], [290, 580], [180, 450]],
    bombs: [[180, 170, 20], [70, 375, 22], [290, 375, 22], [180, 580, 20]] },
];
