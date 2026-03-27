/**
 * Memory card game – level definitions.
 * Each level defines grid size and emoji pool.
 */
export const MEMORY_LEVELS = [
  {
    id: 1,
    cols: 2,
    rows: 2,
    pairs: 2,
    emojis: ["🐶", "🐱"],
    label: { he: "מתחיל", en: "Starter" },
  },
  {
    id: 2,
    cols: 3,
    rows: 2,
    pairs: 3,
    emojis: ["🐶", "🐱", "🐸"],
    label: { he: "קל", en: "Easy" },
  },
  {
    id: 3,
    cols: 4,
    rows: 2,
    pairs: 4,
    emojis: ["🦁", "🐼", "🦊", "🐯"],
    label: { he: "בינוני", en: "Medium" },
  },
  {
    id: 4,
    cols: 4,
    rows: 3,
    pairs: 6,
    emojis: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍋"],
    label: { he: "קשה", en: "Hard" },
  },
  {
    id: 5,
    cols: 4,
    rows: 4,
    pairs: 8,
    emojis: ["🚀", "🌙", "⭐", "🪐", "☄️", "🌟", "🛸", "✨"],
    label: { he: "מאתגר", en: "Challenging" },
  },
  {
    id: 6,
    cols: 5,
    rows: 4,
    pairs: 10,
    emojis: ["🐶", "🐱", "🐸", "🦁", "🐼", "🦊", "🐯", "🐨", "🐰", "🦄"],
    label: { he: "מומחה", en: "Expert" },
  },
  {
    id: 7,
    cols: 6,
    rows: 4,
    pairs: 12,
    emojis: ["🍕", "🌮", "🍦", "🍩", "🎂", "🍪", "🍫", "🍿", "🥨", "🧁", "🍭", "🍬"],
    label: { he: "אלוף", en: "Master" },
  },
];

/** Shuffle an array in-place (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the card deck for a given level */
export function buildDeck(level) {
  const pairs = level.emojis.slice(0, level.pairs);
  const doubled = pairs.flatMap((emoji, i) => [
    { id: `${i}-a`, pairId: i, emoji, flipped: false, matched: false },
    { id: `${i}-b`, pairId: i, emoji, flipped: false, matched: false },
  ]);
  return shuffle(doubled);
}
