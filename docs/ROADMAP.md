# Baby Tap — improvement roadmap

Ordered workstreams toward a high-quality, maintainable codebase.

## Done
1. Data-driven `levels.js` per game type + `levelUtils`
2. Folder cleanup (`games/<id>/`, ShapeGeom, PrivacyPolicy pages)
3. Unified persistence (`storage/keys.js`, `useGameLevel` / `useGameStars`)
4. Persist all learning levels + stars; shapes score; sleep prefs; balloons on level-up
5. README structure docs

## In progress (parallel agents)
6. Extract balloons / targets from App.jsx
7. LearningGameShell shared chrome
8. Extract classic / drums / piano / sleep

## Next
9. Finish App as thin shell (&lt;400 lines) + split App.css per mode
10. Adopt `i18n/` instead of scattered `L()` / `UI_TEXT`
11. Reset-progress control in Settings
12. Expand stage counts where parametric (optional product pass)
13. Light automated smoke tests (Playwright or vitest component)
14. Brand string unify (Baby Tap vs Baby Spark)
