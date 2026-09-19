# Baby Tap — improvement roadmap

## Done
1. Data-driven `levels.js` per game type + `levelUtils`
2. Folder cleanup (`games/<id>/`, ShapeGeom, PrivacyPolicy)
3. Unified persistence (`storage/keys.js`, `useGameLevel` / `useGameStars`)
4. Persist learning levels/stars, shapes score, sleep prefs, balloons on level-up
5. LearningGameShell on all learning games (ShapeMatch, Pattern, ShapeMemory, ColorMix, SizeSort)
6. Extracted from App: classic, drums, piano, sleep, balloons, targets + learning games
7. App shell uses `games/registry.js` + lazy `ActiveGame` (code-split per mode)
8. Shared `SparkBurst` + `games/shared/palette.js` + `styles/effects.css`
9. `LangProvider` / `useT` + `<html lang|dir>` follow the language toggle
10. Settings: Reset progress (keeps prefs)
11. Node test suite (`npm test`) + CI lint/test/build gate
12. Expanded parametric campaigns to 15 stages (learning + balloons)
13. Storage schema versioning + validated `useLocalStorage` with cross-tab sync
14. PWA manifest / service worker via `vite-plugin-pwa`
15. Hash routing via `useHashRoute` (privacy page without full reload)

## Remaining
See [REVIEW.md](./REVIEW.md). Still open: finish i18n adoption in sleep/piano/memory/shapes
(ternaries remain), migrate Memory/Shapes/Piano onto LearningGameShell, and split the
long SleepGame / ClassicGame modules. Optional later: more product-tuned stage curves,
React Native packaging polish.
