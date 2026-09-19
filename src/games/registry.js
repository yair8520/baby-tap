import { lazy } from "react";

export const PLAY = "play";
export const LEARNING = "learning";

/** Lazily load a named export from a game package barrel. */
const lazyGame = (loader, name) =>
  lazy(() => loader().then((mod) => ({ default: mod[name] })));

/**
 * Single source of truth for game modes.
 *
 * `App` renders the active entry and `SettingsMenu` builds its grids from this
 * list — add a mode here and both pick it up. Components are lazy so a mode's
 * code (and its CSS) only loads when it is first opened.
 *
 * Every game reads the active language from `LangProvider` via `useT` / `useLang`,
 * so no entry passes a `lang` prop. `props` adapts the shell context to whatever
 * else a game needs:
 *   { activeEmojis, activeColors, vibrateOn, muteOn, canVibrate, onExit }
 */
export const GAMES = [
  {
    id: "classic",
    category: PLAY,
    emoji: "🎮",
    i18nKey: "games.classic",
    Component: lazyGame(() => import("./classic/index.js"), "ClassicGame"),
    props: (ctx) => ({
      activeEmojis: ctx.activeEmojis,
      activeColors: ctx.activeColors,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "balloons",
    category: PLAY,
    emoji: "🎈",
    i18nKey: "games.balloons",
    Component: lazyGame(() => import("./balloons/index.js"), "BalloonsGame"),
    props: (ctx) => ({ vibrateOn: ctx.vibrateOn }),
  },
  {
    id: "drums",
    category: PLAY,
    emoji: "🥁",
    i18nKey: "games.drums",
    Component: lazyGame(() => import("./drums/index.js"), "DrumsGame"),
    props: (ctx) => ({ vibrateOn: ctx.vibrateOn }),
  },
  {
    id: "targets",
    category: PLAY,
    emoji: "🎯",
    i18nKey: "games.targets",
    Component: lazyGame(() => import("./targets/index.js"), "TargetsGame"),
    props: (ctx) => ({
      activeEmojis: ctx.activeEmojis,
      vibrateOn: ctx.vibrateOn,
    }),
  },
  {
    id: "autoshow",
    category: PLAY,
    emoji: "🌙",
    i18nKey: "games.sleep",
    Component: lazyGame(() => import("./sleep/index.js"), "SleepGame"),
    props: (ctx) => ({ muteOn: ctx.muteOn }),
  },
  {
    id: "piano",
    category: LEARNING,
    emoji: "🎹",
    i18nKey: "learning.piano",
    Component: lazyGame(() => import("./piano/index.js"), "PianoGame"),
    props: (ctx) => ({ vibrateOn: ctx.vibrateOn }),
  },
  {
    id: "memory",
    category: LEARNING,
    emoji: "🧠",
    i18nKey: "learning.memory",
    Component: lazyGame(() => import("./memory/index.js"), "MemoryGame"),
    props: (ctx) => ({ onExit: ctx.onExit }),
  },
  {
    id: "shapes",
    category: LEARNING,
    emoji: "🎨",
    i18nKey: "learning.shapes",
    Component: lazyGame(() => import("./shapes/index.js"), "ShapesGame"),
    props: (ctx) => ({ onExit: ctx.onExit }),
  },
  {
    id: "shapematch",
    category: LEARNING,
    emoji: "🔵",
    i18nKey: "learning.shapematch",
    Component: lazyGame(() => import("./shapematch/index.js"), "ShapeMatch"),
    props: (ctx) => ({ onExit: ctx.onExit, vibrateOn: ctx.canVibrate }),
  },
  {
    id: "colormix",
    category: LEARNING,
    emoji: "🧪",
    i18nKey: "learning.colormix",
    Component: lazyGame(() => import("./colormix/index.js"), "ColorMix"),
    props: (ctx) => ({ onExit: ctx.onExit, vibrateOn: ctx.canVibrate }),
  },
  {
    id: "sizesort",
    category: LEARNING,
    emoji: "📏",
    i18nKey: "learning.sizesort",
    Component: lazyGame(() => import("./sizesort/index.js"), "SizeSort"),
    props: (ctx) => ({ onExit: ctx.onExit, vibrateOn: ctx.canVibrate }),
  },
  {
    id: "shapememory",
    category: LEARNING,
    emoji: "🃏",
    i18nKey: "learning.shapememory",
    Component: lazyGame(() => import("./shapememory/index.js"), "ShapeMemory"),
    props: (ctx) => ({ onExit: ctx.onExit, vibrateOn: ctx.canVibrate }),
  },
  {
    id: "pattern",
    category: LEARNING,
    emoji: "🔷",
    i18nKey: "learning.pattern",
    Component: lazyGame(() => import("./pattern/index.js"), "PatternGame"),
    props: (ctx) => ({ onExit: ctx.onExit, vibrateOn: ctx.canVibrate }),
  },
];

export const DEFAULT_GAME_ID = "classic";

const BY_ID = new Map(GAMES.map((g) => [g.id, g]));

/** Registry entry for a mode id, falling back to the default mode. */
export function getGame(id) {
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_GAME_ID);
}

/** All modes in a category, in menu order. */
export function gamesByCategory(category) {
  return GAMES.filter((g) => g.category === category);
}
