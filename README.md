# One Line

**Every puzzle. One stroke.** A casual puzzle game for Android and iOS: solve each level with a single
continuous line and limited ink, and never touch red.

| Mechanic | Goal |
|---|---|
| **Connect** | Join the numbered dots in order |
| **Slice** | Touch every star, in any order |
| **Guide** | Draw a ramp, lift your finger, roll the ball into the cup |
| **Lasso** | Loop every diamond while keeping all the red outside |

Currently 24 levels in 2 worlds, with moving obstacles and 1–3 stars by ink used.

## Getting started

```bash
npm install
npm run dev        # play in the browser (also on your phone via the network URL)
npm test           # unit tests + proof that every level is solvable
```

### Run on a phone

```bash
npm run android    # needs Android Studio + JDK 21
npm run ios        # needs a Mac with Xcode
```

Both commands build the web app, copy it into the native project (`cap sync`) and open the native IDE,
where you press **Run** with a device connected.

## Project layout

```
src/game/      pure game logic (rules, physics, geometry), unit-tested under Node
src/levels/    level data, one file per world
src/render/    canvas renderer + particle effects
src/ui/        DOM screens (title, level select, HUD, result card)
src/platform/  audio, haptics, storage (Capacitor plugins with web fallbacks)
tests/         Vitest tests and the automatic level solver
android/ ios/  native Capacitor projects
```

See **[PLAN.md](PLAN.md)** for the roadmap and **[CLAUDE.md](CLAUDE.md)** for conventions when working with Claude Code.
