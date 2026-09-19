# Structure review — findings & recommendations

Snapshot of the repo as of the current `main`. Grouped by severity: **Fix** (broken or
dead), **Restructure** (architecture), **Polish** (nice to have).

## How navigation works today

There is no router. `main.jsx` reads `window.location.hash` **once at boot** and renders
either `<App />` or `<PrivacyPolicy />`. Everything else — which of the 13 game modes is
active, and which stage inside that mode — is React state persisted to `localStorage`
(`bt_gameMode`, `bt_<mode>Level`, `bt_<mode>Stars`). Stages are not pages; each game
rebuilds its board from `levels.js` when `levelIdx` changes.

For a fullscreen kiosk-style baby app that is the right call. Two consequences are worth
knowing:

- Because there is no `hashchange` listener, the privacy link needs a full page reload to
  work, and the Back button on that page calls `window.location.reload()` explicitly.
- No URL ever reflects the current mode or stage, so there is no deep link, no browser
  Back, and no way to resume a specific stage from a link.

---

## Fix

1. **`.settings-wrap` is declared twice in `App.css`** (lines ~387 and ~681) with
   conflicting `position: fixed` then `position: relative`. The second wins, so the
   `top` / `right` values from the first rule now act as relative offsets. Almost
   certainly unintended.
2. **Dead CSS left in `App.css`** from before `SettingsMenu` was extracted:
   `.settings-panel`, `.settings-divider`, `.settings-row`, `.settings-label`,
   `.settings-mode-grid`, `.settings-mode-btn`, `.settings-toggle-row`,
   `.settings-toggle-label`, `.settings-toggle-btn`, `.start-logo`. The live menu uses
   `sm-*` classes. Roughly 150 unused lines.
3. **`npm run lint` fails**: 34 errors, 7 warnings. Breakdown: `no-empty` ×10 and
   `no-unused-vars` ×11 (mostly `catch (_e) {}` in `audio.js` and `SleepGame.jsx`),
   `react-hooks/set-state-in-effect` ×8, `exhaustive-deps` ×7,
   `preserve-manual-memoization` ×4. Adding `caughtErrorsIgnorePattern: '^_'` to the
   `no-unused-vars` rule and using optional catch binding (`catch {}`) clears about 20 of
   them; the hook warnings need real review.
4. **CI never runs lint or tests.** `.github/workflows/deploy.yml` only runs
   `npm run build` on `main`. Add a PR workflow running `npm run lint && npm test`.
5. **Tests cannot cover components.** `vite.config.js` sets `environment: "node"` and
   `include: ["src/**/*.test.js"]`, so `.test.jsx` files are never collected. The single
   test file covers pure helpers only (10 tests).

## Restructure

6. **Mode dispatch in `App.jsx` is a hand-written conditional chain, split in two
   places.** Five modes render inside the `{isFullscreen && (<>…</>)}` fragment; five more
   render as separate `{isFullscreen && gameMode === "x" && …}` blocks below it. The same
   mode list is duplicated a third time in `SettingsMenu` (`GAME_MODES` /
   `LEARNING_MODES`). Introduce `src/games/registry.js` holding
   `{ id, Component, category, emoji, i18nKey, levels }` per mode, render
   `<Active {...props} />`, and drive the settings grids from it.
7. **No code splitting.** Every game is imported eagerly, producing one ~305 KB JS chunk.
   Once the registry exists, `React.lazy` per mode is a one-line change per entry.
8. **i18n is half migrated — the largest inconsistency in the codebase.** `he.json` and
   `en.json` already contain keys for sleep, piano, memory, shapes, balloons and targets,
   but only `App`, `SettingsMenu`, `BalloonsGame` and `TargetsGame` call `getT`.
   `SleepGame` alone has ~23 inline `isHebrewUI ? … : …` ternaries; `MemoryGame` and
   `ShapesGame` use a local `L(he, en)` helper; `ColorMix`, `ShapeMemory`, `PatternGame`,
   `SizeSort` and `LearningGameShell` inline `lang === 'he' ? … : …`. Stage labels are a
   fourth mechanism (`label: { he, en }` inside each `levels.js`). Pick one: a `useT()`
   hook backed by a language context, and move stage labels into the JSON dictionaries.
9. **`LearningGameShell` is not applied to every learning mode.** ShapeMatch, ColorMix,
   SizeSort, ShapeMemory and Pattern use it. Memory, Shapes and Piano sit in the same
   "learning" tab but hand-roll their own header, win overlay and stage indicator, and
   have no exit button or star scoring. Progression UX also diverges: a clickable dot
   strip in Memory/Shapes versus a "next stage" overlay with no stage picker in the shell
   games. Extend the shell with optional `levelDots` / `onSelectLevel` and migrate the
   stragglers.
10. **Two components are far too long** for the project's own convention: `SleepGame.jsx`
    (727 lines) and `ClassicGame.jsx` (713). `SleepGame` in particular mixes a ~300-line
    Web Audio engine with a settings panel; the engine belongs in `games/sleep/audio.js`
    or a `useSleepAudio` hook, and the panel in its own `SleepPanel/` folder.
11. **`constants.js` (328 lines) is a grab bag** — environment detection, emoji pools,
    note frequencies, letter→emoji maps and piano keys in one file — and it re-exports
    `SONGS` and `DRUM_PADS` *from* `games/piano` and `games/drums`, i.e. shared code
    depending on feature code. Split into `constants/env.js`, `constants/emojis.js`,
    `constants/audio.js` and drop the re-exports.
12. **Component folder convention is applied inconsistently.** Every component has a
    folder with a CSS file and an index, which is good, but `SettingsMenu/index.jsx` *is*
    the component (there is no `SettingsMenu.jsx`), components use `export default` with a
    named alias re-exported from the index rather than a named export plus
    `export * from "./Component"`, and no folder has a separate props file.
13. **All CSS is global.** Collisions are avoided only by manual prefixes, which mostly
    holds (`sm-`, `lgs-`, `mg-`, `shm-`…) but leaks in `ClassicGame.css`
    (`combo-`, `ultra-`, `trail-`, `swipe-`, `song-`, `key-`, `idle-`, `emoji-`) and
    `SleepGame.css` (`sleep-` plus `heartbeat-`). CSS Modules would enforce this for free.
    Separately, the shared `.emoji-item` and `.particle` rules still live in `App.css`
    while balloons, targets, classic and shapematch depend on them — they belong in a
    shared stylesheet.

## Polish

14. **No PWA manifest or service worker**, even though `src/assets` already ships 192/512
    and maskable icons. For a tablet app meant to be installed, add `vite-plugin-pwa`.
15. **`index.html` hardcodes `lang="he"`** and neither `lang` nor `dir` on `<html>` is
    updated when the user switches language; `dir` is set per-card inside React instead.
    Also `rel="icon" type="image/svg+xml"` points at a PNG, and there is no `theme-color`
    or `description` meta.
16. **`useLocalStorage` has no cross-tab sync and no schema versioning**, so a future
    change to a stored shape cannot be migrated. Also `balloonLevel` is 1-based while
    every other level key is 0-based — documented in `storage/keys.js`, but a trap.
17. **Docs are stale.** `README.md` lists `LearningGameShell/ # (if present)` although it
    is present, and `ROADMAP.md` states "Remaining: none required".

## Suggested order

Fix items 1–5 first: they are cheap and item 3/4 stop the rest from regressing. Then the
registry (6, 7), because it unblocks lazy loading and removes the duplicated mode lists.
Then finish i18n (8), which is the change that touches the most files. Splitting the long
components (10) and unifying the learning shell (9) can follow independently per game.
