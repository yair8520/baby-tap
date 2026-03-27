/**
 * Shapes / Colors game – level definitions.
 * Each level adds more shapes and/or colors to identify.
 */

export const SHAPE_COLORS = {
  red:    { hex: "#EF4444", he: "אדום",  en: "red" },
  blue:   { hex: "#3B82F6", he: "כחול",  en: "blue" },
  green:  { hex: "#22C55E", he: "ירוק",  en: "green" },
  yellow: { hex: "#EAB308", he: "צהוב",  en: "yellow" },
  purple: { hex: "#A855F7", he: "סגול",  en: "purple" },
  orange: { hex: "#F97316", he: "כתום",  en: "orange" },
  pink:   { hex: "#EC4899", he: "ורוד",  en: "pink" },
};

export const SHAPE_TYPES = {
  circle:   { he: "עיגול",   en: "circle" },
  square:   { he: "ריבוע",   en: "square" },
  triangle: { he: "משולש",   en: "triangle" },
  star:     { he: "כוכב",    en: "star" },
  heart:    { he: "לב",      en: "heart" },
};

export const SHAPES_LEVELS = [
  {
    id: 1,
    numShapes: 2,
    colors: ["red", "blue"],
    shapes: ["circle"],
    label: { he: "מתחיל", en: "Starter" },
    scoreToAdvance: 5,
  },
  {
    id: 2,
    numShapes: 3,
    colors: ["red", "blue", "green"],
    shapes: ["circle"],
    label: { he: "קל", en: "Easy" },
    scoreToAdvance: 10,
  },
  {
    id: 3,
    numShapes: 3,
    colors: ["red", "blue", "green"],
    shapes: ["circle", "square"],
    label: { he: "בינוני", en: "Medium" },
    scoreToAdvance: 20,
  },
  {
    id: 4,
    numShapes: 4,
    colors: ["red", "blue", "green", "yellow"],
    shapes: ["circle", "square"],
    label: { he: "קשה", en: "Hard" },
    scoreToAdvance: 35,
  },
  {
    id: 5,
    numShapes: 4,
    colors: ["red", "blue", "green", "yellow", "purple"],
    shapes: ["circle", "square", "triangle"],
    label: { he: "מאתגר", en: "Challenging" },
    scoreToAdvance: 55,
  },
  {
    id: 6,
    numShapes: 5,
    colors: ["red", "blue", "green", "yellow", "purple", "orange"],
    shapes: ["circle", "square", "triangle", "star"],
    label: { he: "מומחה", en: "Expert" },
    scoreToAdvance: 80,
  },
  {
    id: 7,
    numShapes: 6,
    colors: Object.keys(SHAPE_COLORS),
    shapes: Object.keys(SHAPE_TYPES),
    label: { he: "אלוף", en: "Master" },
    scoreToAdvance: Infinity,
  },
];

export function getShapesLevelConfig(score) {
  let config = SHAPES_LEVELS[0];
  for (const lvl of SHAPES_LEVELS) {
    if (score >= (SHAPES_LEVELS[SHAPES_LEVELS.indexOf(lvl) - 1]?.scoreToAdvance ?? 0)) {
      config = lvl;
    }
  }
  return config;
}

/** Generate a random shapes challenge for a given level config */
export function generateChallenge(levelConfig) {
  const { numShapes, colors, shapes } = levelConfig;

  // Pick distinct color+shape combos for the shapes shown
  const pool = [];
  for (const color of colors) {
    for (const shape of shapes) {
      pool.push({ color, shape });
    }
  }
  // Shuffle and take numShapes
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, numShapes);

  // Pick which one the player needs to tap
  const targetIdx = Math.floor(Math.random() * shuffled.length);
  const target = shuffled[targetIdx];

  return {
    shapes: shuffled.map((s, i) => ({ ...s, id: i })),
    targetColor: target.color,
    targetShape: target.shape,
  };
}
