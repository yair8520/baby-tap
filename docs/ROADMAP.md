# Baby Tap — improvement roadmap

## Done
1. Data-driven `levels.js` per game type + `levelUtils`
2. Folder cleanup (`games/<id>/`, ShapeGeom, PrivacyPolicy)
3. Unified persistence (`storage/keys.js`, `useGameLevel` / `useGameStars`)
4. Persist learning levels/stars, shapes score, sleep prefs, balloons on level-up
5. LearningGameShell on **all** learning modes (incl. Memory, Shapes, Piano)
6. Extracted from App: classic, drums, piano, sleep, balloons, targets + learning games
7. App shell uses `games/registry.js` + lazy `ActiveGame` (code-split per mode)
8. Shared effects CSS + palette helpers
9. `LangProvider` / `useT` across shell games + sleep / piano / memory / shapes
10. Settings: Reset progress (keeps prefs)
11. Node test suite (`npm test`) + CI lint/test/build gate
12. Expanded parametric campaigns to 15 stages (learning + balloons)
13. Storage schema versioning + validated `useLocalStorage` with cross-tab sync
14. PWA manifest / service worker via `vite-plugin-pwa`
15. Hash routing via `useHashRoute` (privacy page without full reload)
16. SleepGame split: `useSleepAudio` + `SleepPanel` + `SleepScene`
17. ClassicGame visual layer extracted to `ClassicEffects` + `songUtils`

## Remaining
Optional later: deeper ClassicGame input/spawn extraction, CSS Modules, more
product-tuned stage curves, React Native packaging polish. See [REVIEW.md](./REVIEW.md).
