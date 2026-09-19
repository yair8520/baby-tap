# Baby Tap — improvement roadmap

## Done
1. Data-driven `levels.js` per game type + `levelUtils`
2. Folder cleanup (`games/<id>/`, ShapeGeom, PrivacyPolicy)
3. Unified persistence (`storage/keys.js`, `useGameLevel` / `useGameStars`)
4. Persist learning levels/stars, shapes score, sleep prefs, balloons on level-up
5. LearningGameShell on all learning games (ShapeMatch, Pattern, ShapeMemory, ColorMix, SizeSort)
6. Extracted from App: classic, drums, piano, sleep, balloons, targets + learning games
7. App shell ~417 lines (down from ~2700)
8. Shared `SparkBurst` + `games/shared/palette.js`
9. i18n wired into App start screen + Settings (incl. learning mode labels)
10. Settings: Reset progress (keeps prefs)
11. Vitest smoke tests (`npm test`)
12. Expanded parametric campaigns to 15 stages (learning + balloons)

## Remaining
_None required for the current cleanup pass._ Optional later: more product-tuned stage curves, React Native packaging polish.
