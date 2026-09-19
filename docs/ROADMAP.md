# Baby Tap — improvement roadmap

## Done (merged / on branch)
1. Data-driven `levels.js` per game type + `levelUtils`
2. Folder cleanup (`games/<id>/`, ShapeGeom, PrivacyPolicy)
3. Unified persistence (`storage/keys.js`, `useGameLevel` / `useGameStars`)
4. Persist learning levels/stars, shapes score, sleep prefs, balloons on level-up
5. LearningGameShell (ShapeMatch, Pattern, ShapeMemory)
6. Extracted from App: classic, drums, piano, sleep + learning games
7. App shell ~927 lines (down from ~2700)

## Remaining (follow-up PRs)
1. Extract **balloons** + **targets** still inline in App.jsx
2. Adopt LearningGameShell in ColorMix / SizeSort
3. Dead CSS leftovers in App.css; shared SparkBurst / palette
4. Wire unused `i18n/` instead of scattered strings
5. Settings: “Reset progress” button
6. Expand parametric stage counts (product pass)
7. Light automated smoke tests
8. App shell goal &lt;400 lines once balloons/targets extracted
