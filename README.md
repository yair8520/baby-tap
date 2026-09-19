# Baby Tap

Colorful tap-and-play games for babies and toddlers (React + Vite).

## Structure

```
src/
  App.jsx                 # Shell: fullscreen, settings, active mode
  Root.jsx                # Hash route: app vs privacy policy
  audio.js                # Shared Web Audio helpers
  constants/              # env, emojis, audio (no games/ imports)
  storage/                # keys, validation, progress, schema versioning
  hooks/
    useLocalStorage.js
    useGameProgress.js    # useGameLevel / useGameStars / useGameBestStars
    useHashRoute.js
  i18n/                   # LangProvider, useT, he.json / en.json
  games/
    registry.js           # Single source of truth for modes (lazy)
    <modeId>/
      levels.js           # Stage configs — append rows to add stages
      *Game.jsx / *.jsx
      index.js
  components/
    ActiveGame/           # Suspense + registry dispatch
    SettingsMenu/
    LearningGameShell/    # Shared learning chrome
    ShapeGeom/
    ResetProgressControl/
```

## Adding a mode

1. Create `src/games/<id>/` with levels + component + `index.js`
2. Add an entry to `src/games/registry.js` (`props`, `category`, `i18nKey`)
3. Add labels to `src/i18n/he.json` and `en.json`

App and SettingsMenu both read from the registry — no other wiring needed.

## Adding stages

Edit `src/games/<mode>/levels.js` and append to the mode’s `*_LEVELS` (or `PIANO_SONGS` / `DRUM_PADS`) array. Runtime reads configs by index or score threshold.

## Progress persistence

All keys go through `useLocalStorage` → `bt_<key>`. Canonical names live in `src/storage/keys.js`.

| What | Key |
|------|-----|
| Settings | `lang`, `theme`, `vibrateOn`, `muteOn`, `gameMode` |
| Memory / Shapes | `memoryLevel`, `shapesScore` |
| Learning drag games | `shapematchLevel`, `colormixLevel`, … + `*Stars` |
| Balloons | `balloonLevel` (1-based) |
| Targets | `targetHighScore` |
| Sleep | `sleepSoundMode`, `sleepVolume`, `sleepEnabled` |

## Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run deploy
```
