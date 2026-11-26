# One Line: Development Plan

> Every puzzle. One stroke.
> A casual mobile puzzle game for Android and iOS, built with TypeScript + Capacitor.

## 1. Product summary

| | |
|---|---|
| **Core rule** | Each level is solved with one continuous finger stroke and a limited amount of ink. Red is always off-limits. |
| **Session length** | 10–40 seconds per level, instant retry |
| **Mechanics (v1)** | **Connect** (numbered dots in order) · **Slice** (all stars, any order) · **Guide** (draw a ramp, a ball rolls into the cup) · **Lasso** (loop all diamonds, keep red outside) |
| **Twists** | Moving red obstacles, blocks, ink limits, 1–3 stars by ink used |
| **Platforms** | Android + iOS at launch (one codebase); web build for testing and marketing |
| **Business model** | Free, rewarded ads for hints, one-off "Remove ads" purchase, cosmetic line skins. No energy timers, no pay-to-win |

### Design principles
1. **The 10-second action must be fun with no rewards attached.** Every feature is judged against this.
2. **Fair hooks only:** near-miss feedback, stars, streaks and daily puzzles. No paywalls on progress, no fake urgency.
3. **One rule set, many ideas.** New mechanics must still be "one stroke, limited ink, avoid red".

## 2. Architecture

```
src/
  main.ts              bootstrap: wires input → Game → renderer/audio/haptics/UI
  game/                PURE logic: no DOM, no canvas, fully unit-testable
    constants.ts       world size (360×640 logical units), physics + rule tuning
    types.ts           Level, Bomb, Vec, …
    geometry.ts        segment/circle/rect/polygon math
    physics.ts         ball simulation for Guide levels
    messages.ts        fail / near-miss copy
    game.ts            Game class: state machine + rules for all mechanics, emits events
  levels/              level data, one file per world
  render/              Canvas renderer + particles/shake (reads Game state, never mutates it)
  ui/                  DOM screens: title, level select, HUD, result card
  platform/            audio (WebAudio), haptics + storage (Capacitor plugins with web fallback)
tests/                 Vitest: geometry, rules, and an automatic solver proving every level is solvable
android/  ios/         native Capacitor projects (generated, committed)
```

**Key decisions**
- **Fixed 60 Hz simulation** in logical units (360×640) so physics behaves the same on every phone and refresh rate.
- **Game emits events** (`touch`, `win`, `fail`, `bounce`, `release`); audio, haptics, particles and UI subscribe. Logic never calls the renderer.
- **Levels are plain data.** A future level editor (and later remote-config levels) just produces the same objects.
- **Solvability is a test.** CI fails if any level can't be solved within its ink budget.

## 3. Milestones

### M0: Foundation ✅ *(this commit)*
- [x] Vite + TypeScript + Capacitor project
- [x] Prototype ported to typed modules (4 mechanics, moving red, 24 levels)
- [x] Unit tests + automatic level-solvability check
- [x] Progress saved with Capacitor Preferences; haptics via Capacitor Haptics
- [x] Font bundled locally so the app works offline

### M1: Native shells (1 week)
- [x] Android + iOS projects generated (`android/`, `ios/`), portrait locked
- [ ] First device builds (Android Studio / Xcode)
- [ ] Fill tall screens (19.5:9 phones): extend the world height instead of letterboxing
- [ ] App icon + splash (`@capacitor/assets`), status bar, safe areas, portrait lock
- [ ] Android back button → pause/level select
- [ ] Pause audio when app goes to background (`@capacitor/app`)
- [ ] Performance pass on a low-end Android phone (target: steady 60 fps)

### M2: Content & feel (2–3 weeks)
- [ ] In-game **level editor** (dev builds only) that exports level JSON
- [ ] 60+ levels across 5 worlds, difficulty curve with "breather" levels
- [ ] Two more mechanics, e.g. **Bounce** (the ball is launched, the line is a trampoline) and **Mirror** (the stroke is drawn twice, mirrored)
- [ ] Juice: line-drawing sound, star fly-in, world-complete celebration
- [ ] First-time tutorial hand animation per mechanic
- [ ] Settings: sound, haptics, left-hand mode

### M3: Retention (2 weeks)
- [ ] **Daily puzzle**: deterministic level from the date, same for every player
- [ ] Streaks + calendar, local stats (levels, stars, best ink)
- [ ] Share card: an image of your solution line plus your ink %
- [ ] (Backend, later) global heat map of how everyone drew the daily line (Supabase or Firebase)

### M4: Monetization, analytics, compliance (1–2 weeks)
- [ ] Rewarded ads for hints (AdMob via a Capacitor plugin) + Google UMP consent
- [ ] "Remove ads" and line-skin purchases (RevenueCat or native IAP)
- [ ] Analytics events: level_start, level_fail(reason), level_win(stars), retry, hint_used
- [ ] Privacy policy page, data-safety form (Play), privacy nutrition labels (App Store)

### M5: Soft launch
- [ ] Google Play **closed testing**. New personal developer accounts must run a closed test with a minimum number of testers for a set period before production (currently 12 testers for 14 days; check Play Console for the current rule)
- [ ] TestFlight beta on iOS
- [ ] Watch D1 / D7 retention, level-fail heatmap, then tune the difficulty curve

### M6: Global launch
- [ ] Store listing: video of the one-stroke mechanic, screenshots, localized text (English, Sinhala, Tamil, Hindi, …)

## 4. What you need

| Item | Why | Cost |
|---|---|---|
| Node.js 20+ | build tooling | free |
| Android Studio + JDK 21 | Android builds | free |
| Mac with Xcode | iOS builds (required by Apple) | free (needs a Mac) |
| Google Play Console account | publish on Android | $25 one-time |
| Apple Developer Program | publish on iOS | $99 / year |

No Mac? Use a cloud Mac build service (e.g. Ionic Appflow, Codemagic) for iOS.

## 5. Working with Claude Code

Open this repo in Claude Code and work milestone by milestone. Good first prompts:
- "Read PLAN.md and CLAUDE.md, then do M1: add the Android platform and make the back button open level select."
- "Build the dev-only level editor described in M2."
- "Add 12 levels for World 3 and make sure `npm test` proves they're solvable."
