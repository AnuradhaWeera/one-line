import type { Level } from '../game/types';
import { ring, spikeRow } from './helpers';

/** World 1: the three core mechanics. */
export const WORLD1: Level[] = [
  { id: 'w1-01', type: 'connect', hint: 'Draw ONE line through the dots in order: 1 → 2 → 3', ink: 600,
    dots: [[90, 360], [180, 360], [270, 360]] },
  { id: 'w1-02', type: 'connect', hint: 'Zig-zag. Keep an eye on your ink.', ink: 1150,
    dots: [[80, 200], [280, 280], [80, 360], [280, 440], [180, 540]] },
  { id: 'w1-03', type: 'slice', hint: 'New: touch every star, any order. Never touch red.', ink: 1300,
    dots: [[60, 200], [300, 200], [180, 380], [60, 520], [300, 520]], bombs: [[180, 280, 20], [180, 470, 22]] },
  { id: 'w1-04', type: 'guide', hint: 'New: draw a ramp, then lift your finger. Get the ball in the cup.', ink: 500,
    spawn: [80, 150], goal: [230, 560, 90, 50] },
  { id: 'w1-05', type: 'connect', hint: 'Go around the red block.', ink: 1000,
    dots: [[80, 250], [280, 250], [280, 500], [80, 500]], blocks: [[110, 280, 140, 190]] },
  { id: 'w1-06', type: 'slice', hint: 'Circle the danger.', ink: 1100,
    dots: ring(180, 380, 120, 6), bombs: [[180, 380, 50]] },
  { id: 'w1-07', type: 'guide', hint: 'Ramp over the red.', ink: 450,
    spawn: [60, 140], goal: [250, 575, 90, 45], bombs: [[180, 470, 26], [110, 560, 22]] },
  { id: 'w1-08', type: 'connect', hint: 'The straight path is blocked. Curve it.', ink: 1600,
    dots: [[80, 200], [280, 500], [280, 200], [80, 500]], bombs: [[180, 350, 28]] },
  { id: 'w1-09', type: 'guide', hint: 'Low ink. A small nudge is enough.', ink: 260,
    spawn: [180, 130], goal: [270, 580, 80, 45], bombs: spikeRow(30, 230, 618) },
  { id: 'w1-10', type: 'slice', hint: 'Find the shortest route.', ink: 1800,
    dots: [[60, 160], [300, 160], [300, 600], [60, 600], [180, 380]],
    bombs: [[180, 160, 20], [300, 380, 20], [180, 600, 20], [60, 380, 20]] },
  { id: 'w1-11', type: 'guide', hint: 'Thread between the spikes.', ink: 520,
    spawn: [300, 140], goal: [20, 575, 90, 45], bombs: [[120, 420, 24], [230, 330, 24], [200, 560, 22]] },
  { id: 'w1-12', type: 'connect', hint: 'Steady hand. Curve around every red.', ink: 1900,
    dots: [[60, 180], [300, 180], [60, 330], [300, 330], [60, 480], [300, 480]],
    bombs: [[180, 180, 18], [180, 255, 22], [180, 405, 22]] },
];
