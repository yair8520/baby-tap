# Baby Tap

Colorful tap-and-play games for babies and toddlers (React + Vite).

## Structure

```
src/
  App.jsx              # Shell: fullscreen, settings, mode routing
  audio.js             # Shared Web Audio helpers
  constants.js         # Themes, emoji pools, piano keys
  storage/keys.js      # All localStorage key names (bt_* prefix via hook)
  hooks/
    useLocalStorage.js
    useGameProgress.js # useGameLevel / useGameStars
  games/
    <modeId>/
      levels.js        # Stage configs — append rows to add stages
      *Game.jsx
      index.js
  components/
    SettingsMenu/
    ShapeGeom/
    LearningGameShell/ # (if present)
```

## Adding stages

Edit `src/games/<mode>/levels.js` and append to the mode’s `*_LEVELS` (or `PIANO_SONGS` / `DRUM_PADS`) array. Runtime reads configs by index or score threshold.

## Progress persistence

All keys go through `useLocalStorage` → `bt_<key>`. Canonical names live in `src/storage/keys.js`.

| What | Key |
|------|-----|
| Settings | `lang`, `theme`, `vibrateOn`, `muteOn`, `gameMode` |
| Memory / Shapes level | `memoryLevel`, `shapesLevel`, `shapesScore` |
| Learning drag games | `shapematchLevel`, `colormixLevel`, … + `*Stars` |
| Balloons | `balloonLevel` (1-based) |
| Targets | `targetHighScore` |
| Sleep | `sleepSoundMode`, `sleepVolume`, `sleepEnabled` |

## Scripts

```bash
npm run dev
npm run build
npm run deploy
```
