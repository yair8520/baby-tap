import { lazy } from "react";

export const PLAY = "play";
export const LEARNING = "learning";

/** Lazily load a named export from a game package barrel. */
const lazyNamed = (loader, name) =>
  lazy(() => loader().then((mod) => ({ default: mod[name] })));

/** Lazily load a default export from a game package barrel. */
const lazyDefault = (loader) =>
  lazy(() => loader().then((mod) => ({ default: mod.default })));

/**
 * Single source of truth for game modes.
 *
 * `App` renders the active entry and `SettingsMenu` builds its grids from this
 * list — add a mode here and both pick it up. Components are lazy so a mode's
 * code (and its CSS) only loads when it is first opened.
 *
 * `hideAppChrome`: the game draws its own exit control (LearningGameShell), so
 * App hides the corner-hold and settings gear while it is active.
 *
 * `props` adapts the shell context to whatever a game needs.
 */
export const GAMES = [
  {
    id: "classic",
    category: PLAY,
    emoji: "🎮",
    i18nKey: "games.classic",
    Component: lazyDefault(() => import("./classic/index.js")),
    props: (ctx) => ({
      lang: ctx.lang,
      activeEmojis: ctx.activeEmojis,
      activeColors: ctx.activeColors,
      vibrateOn: ctx.vibrateOn,
      comboLabels: ctx.comboLabels,
    }),
  },
  {
    id: "balloons",
    category: PLAY,
    emoji: "🎈",
    i18nKey: "games.balloons",
    Component: lazyNamed(() => import("./balloons/index.js"), "Balloons"),
    props: (ctx) => ({ t: ctx.t, vibrate: ctx.vibrate }),
  },
  {
    id: "drums",
    category: PLAY,
    emoji: "🥁",
    i18nKey: "games.drums",
    Component: lazyDefault(() => import("./drums/index.js")),
    props: (ctx) => ({ vibrateOn: ctx.vibrateOn }),
  },
  {
    id: "targets",
    category: PLAY,
    emoji: "🎯",
    i18nKey: "games.targets",
    Component: lazyNamed(() => import("./targets/index.js"), "Targets"),
    props: (ctx) => ({
      activeEmojis: ctx.activeEmojis,
      t: ctx.t,
      vibrate: ctx.vibrate,
    }),
  },
  {
    id: "autoshow",
    category: PLAY,
    emoji: "🌙",
    i18nKey: "games.sleep",
    Component: lazyDefault(() => import("./sleep/index.js")),
    props: (ctx) => ({ lang: ctx.lang, muteOn: ctx.muteOn }),
  },
  {
    id: "piano",
    category: LEARNING,
    emoji: "🎹",
    i18nKey: "games.piano",
    Component: lazyDefault(() => import("./piano/index.js")),
    props: (ctx) => ({ lang: ctx.lang, vibrateOn: ctx.vibrateOn }),
  },
  {
    id: "memory",
    category: LEARNING,
    emoji: "🧠",
    i18nKey: "games.memory",
    Component: lazyDefault(() => import("./memory/index.js")),
    props: (ctx) => ({ lang: ctx.lang, onSound: ctx.onSound }),
  },
  {
    id: "shapes",
    category: LEARNING,
    emoji: "🎨",
    i18nKey: "games.shapes",
    Component: lazyDefault(() => import("./shapes/index.js")),
    props: (ctx) => ({ lang: ctx.lang, onSound: ctx.onSound }),
  },
  {
    id: "shapematch",
    category: LEARNING,
    emoji: "🔵",
    i18nKey: "games.shapematch",
    hideAppChrome: true,
    Component: lazyDefault(() => import("./shapematch/index.js")),
    props: (ctx) => ({
      onExit: ctx.onExit,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "colormix",
    category: LEARNING,
    emoji: "🧪",
    i18nKey: "games.colormix",
    hideAppChrome: true,
    Component: lazyDefault(() => import("./colormix/index.js")),
    props: (ctx) => ({
      onExit: ctx.onExit,
      lang: ctx.lang,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "sizesort",
    category: LEARNING,
    emoji: "📏",
    i18nKey: "games.sizesort",
    hideAppChrome: true,
    Component: lazyDefault(() => import("./sizesort/index.js")),
    props: (ctx) => ({
      onExit: ctx.onExit,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "shapememory",
    category: LEARNING,
    emoji: "🃏",
    i18nKey: "games.shapememory",
    hideAppChrome: true,
    Component: lazyDefault(() => import("./shapememory/index.js")),
    props: (ctx) => ({
      onExit: ctx.onExit,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "pattern",
    category: LEARNING,
    emoji: "🔷",
    i18nKey: "games.pattern",
    hideAppChrome: true,
    Component: lazyDefault(() => import("./pattern/index.js")),
    props: (ctx) => ({
      onExit: ctx.onExit,
      vibrateOn: ctx.vibrateOn,
    }),
  },
];

export const DEFAULT_GAME_ID = "classic";

export const GAME_MODE_IDS = GAMES.map((g) => g.id);

const BY_ID = new Map(GAMES.map((g) => [g.id, g]));

/** Registry entry for a mode id, falling back to the default mode. */
export function getGame(id) {
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_GAME_ID);
}

/** All modes in a category, in menu order. */
export function gamesByCategory(category) {
  return GAMES.filter((g) => g.category === category);
}
