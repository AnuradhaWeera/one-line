# One Line: notes for Claude Code

Casual mobile puzzle game: every level is solved with ONE continuous stroke and limited ink. Red is always off-limits.
TypeScript + Vite + Capacitor 8 (Android + iOS). See PLAN.md for the roadmap and milestones.

## Commands
- `npm run dev` runs the dev server (open on a phone on the same Wi-Fi via the printed network URL)
- `npm test` runs Vitest, including the level-solvability check. **Must pass before every commit.**
- `npm run typecheck` / `npm run build`
- `npm run android` / `npm run ios` build, `cap sync`, and open the native IDE

## Architecture rules
- `src/game/` is **pure logic**: no DOM, canvas, audio or Capacitor imports. It must run under Node for tests.
- The `Game` class is the single source of truth. It communicates outward only through `GameEvent`s. Renderer/UI read state and never mutate it.
- Simulation runs at a fixed 60 Hz (`update()` once per tick). Don't scale physics by real frame time.
- Coordinates are logical units in a 360×640 portrait world (`W`, `H` in `constants.ts`). The renderer scales.
- Levels are data in `src/levels/`. Bombs are `[x, y, r, moveX?, moveY?, speed?]`. Moving bombs follow `sin(time * speed)`.
- Platform features (`src/platform/`) must fail softly on web and when plugins are unavailable.

## Adding levels
1. Add the level to a world file in `src/levels/` with a unique `id`.
2. Run `npm test`. The solver in `tests/solver.ts` must find a solution within the ink budget.
   Lasso levels are verified against hand-written loops in `tests/lasso-solutions.ts`. Add one for each new lasso level.
3. Ink budget rule of thumb: about 1.4× the shortest clean solution. 3 stars require ≤ 70% ink used.

## Style
- Strict TypeScript, no `any`. Small modules, named exports.
- Player-facing text: short, friendly, sentence case. Near-miss failures say "So close!".
- Palette: slate `#0f3d44`, sun `#ffd23f` (the line), coral `#ff5a4e` (danger), mint `#6ff0b4` (success). Font: Baloo 2.
