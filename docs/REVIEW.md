# Structure review — findings & recommendations

Originally a snapshot of `main` before the cleanup pass on this branch. Status tags
below reflect the branch after that pass.

## How navigation works

There is still no path/router for game modes — by design for a fullscreen kiosk baby
app. Mode and stage live in React state + `localStorage`. Hash routing via
`useHashRoute` now switches the privacy page without a full reload.

---

## Fix

1. ~~**`.settings-wrap` declared twice**~~ — done; single `position: fixed` rule kept.
2. ~~**Dead `settings-*` / `.start-logo` CSS**~~ — done; removed. Shared emoji/particle
   rules live in `styles/effects.css`.
3. ~~**`npm run lint` failing**~~ — done on this branch (`npm run lint` is clean).
4. ~~**CI never runs lint/tests**~~ — done; deploy workflow gates on lint + test + build,
   plus `.github/workflows/ci.yml`.
5. ~~**Tests cannot cover components**~~ — partially superseded: the suite now uses
   `node --test` for pure helpers (13 tests). Component/DOM tests are still optional.

## Restructure

6. ~~**Mode dispatch hand-written in App**~~ — done. `games/registry.js` is the single
   source of truth; `ActiveGame` + `SettingsMenu` both read from it.
7. ~~**No code splitting**~~ — done. Each mode is `React.lazy` via the registry.
8. **i18n half migrated** — foundation done (`LangProvider` / `useT`, dictionaries
   complete, `<html lang|dir>` synced). Still open: sleep / piano / memory / shapes
   still use `lang === 'he' ? …` ternaries in places; ColorMix / Pattern / SizeSort /
   ShapeMemory shell copy now goes through `useT`.
9. **`LearningGameShell` not on every learning mode** — shell is split
   (ShellHeader / ShellComplete / LevelDots) with optional score slot + `isLastLevel`.
   Memory / Shapes / Piano still hand-roll their chrome.
10. **SleepGame / ClassicGame still very long** — not split yet.
11. ~~**`constants.js` grab bag**~~ — done; split into `constants/{env,emojis,audio}`.
12. **Component folder convention inconsistent** — improved for new work (ActiveGame,
    shell subcomponents); SettingsMenu and older games still vary.
13. **All CSS is global** — unchanged; prefixes still the convention.

## Polish

14. ~~**No PWA manifest**~~ — done via `vite-plugin-pwa`.
15. ~~**`<html lang/dir>` never follows the toggle**~~ — done in `LangProvider`.
16. ~~**`useLocalStorage` lacks cross-tab sync / schema versioning**~~ — done
    (`storage/storage.js` + validators from main).
17. **Docs** — this file + `ROADMAP.md` updated; README may still be slightly stale.

## Suggested remaining order

Finish i18n adoption in sleep / piano / memory / shapes, migrate those three onto
LearningGameShell, then split SleepGame's audio engine and ClassicGame's input layer.
