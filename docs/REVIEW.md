# Structure review — findings & status

Originally a snapshot of `main` before the cleanup pass. Status below reflects this branch.

## How navigation works

No path/router for game modes — by design for a fullscreen kiosk baby app. Mode and
stage live in React state + `localStorage`. Hash routing via `useHashRoute` switches
the privacy page without a full reload.

---

## Fix — done

1. Duplicate `.settings-wrap` removed.
2. Dead `settings-*` / `.start-logo` CSS removed; shared emoji/particle rules in
   `styles/effects.css`.
3. `npm run lint` clean.
4. CI gates on lint + test + build.
5. Helper tests via `node --test` (13). Component/DOM tests still optional.

## Restructure — done / optional

6. Mode dispatch via `games/registry.js` + `ActiveGame`.
7. Lazy code-splitting per mode.
8. i18n: `LangProvider` / `useT`; sleep / piano / memory / shapes / shell games migrated.
9. LearningGameShell on Memory, Shapes, Piano (exit + shared chrome; piano is free-play
   with `showLevel={false}`).
10. SleepGame split into audio hook + panel + scene. Classic visual layer in
    `ClassicEffects` (input/spawn logic still in `ClassicGame.jsx` — optional further split).
11. `constants/` split (`env`, `emojis`, `audio`).
12. New work follows folder + props + named export convention; older packages still vary.
13. Global CSS with prefixes — unchanged (CSS Modules optional later).

## Polish — done

14. PWA via `vite-plugin-pwa`.
15. `<html lang/dir>` follows the language toggle.
16. Storage versioning + validators + cross-tab sync.
17. Docs updated.
