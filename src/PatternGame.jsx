import { useState, useRef, useEffect, useCallback } from 'react';
import './PatternGame.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  { id: 'red',    fill: '#FF3B3B' },
  { id: 'blue',   fill: '#2979FF' },
  { id: 'yellow', fill: '#FFD600' },
  { id: 'green',  fill: '#00C853' },
  { id: 'purple', fill: '#BB44FF' },
  { id: 'orange', fill: '#FF7700' },
];

const ALL_SHAPES = ['circle', 'square', 'triangle', 'star'];

// Pattern templates: arrays of slot indices into [A, B, C, ...]
// Last item is what the player must guess (always the last element)
const PATTERN_TYPES = {
  ABAB:   { slots: [0, 1, 0, 1, 0], answer: 0 },  // A B A B ? → A
  ABCABC: { slots: [0, 1, 2, 0, 1, 2], answer: 2 }, // A B C A B ? → C
  AABB:   { slots: [0, 0, 1, 1, 0, 0], answer: 0 }, // A A B B A ? → A
  ABBA:   { slots: [0, 1, 1, 0, 0, 1], answer: 1 }, // A B B A A ? → B
  AAAB:   { slots: [0, 0, 0, 1, 0, 0], answer: 0 }, // A A A B A ? → A
};

// Level → pattern type(s)
function getPatternType(levelIdx) {
  if (levelIdx < 3)  return 'ABAB';
  if (levelIdx < 6)  return 'ABCABC';
  if (levelIdx < 9)  return levelIdx % 2 === 0 ? 'AABB' : 'ABBA';
  // Level 10+: random
  const types = Object.keys(PATTERN_TYPES);
  return types[Math.floor(Math.random() * types.length)];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistinct(n, excludeSet) {
  // Pick n unique shape+color combos not in excludeSet
  const all = [];
  for (const shape of ALL_SHAPES) {
    for (const color of PALETTE) {
      const key = `${shape}|${color.id}`;
      if (!excludeSet.has(key)) {
        all.push({ shape, colorId: color.id, fill: color.fill, id: key });
      }
    }
  }
  return shuffle(all).slice(0, n);
}

function buildLevel(levelIdx) {
  const typeName = getPatternType(levelIdx);
  const type = PATTERN_TYPES[typeName];

  // How many unique items (A, B, C...) do we need?
  const maxSlot = Math.max(...type.slots);
  const numUnique = maxSlot + 1;

  // Pick unique shape+color combos for A, B, C...
  const items = [];
  const usedKeys = new Set();
  for (let i = 0; i < numUnique; i++) {
    let candidate;
    let attempts = 0;
    do {
      const shape = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)];
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const key = `${shape}|${color.id}`;
      candidate = { shape, colorId: color.id, fill: color.fill, id: key };
      attempts++;
    } while (usedKeys.has(candidate.id) && attempts < 100);
    usedKeys.add(candidate.id);
    items.push(candidate);
  }

  // Build pattern array (full, including answer)
  const fullPattern = type.slots.map(idx => ({ ...items[idx] }));

  // displayPattern = all but last
  const displayPattern = fullPattern.slice(0, fullPattern.length - 1);

  // Answer
  const answer = { ...items[type.answer] };

  // Choices: answer + distractors
  const distractors = pickDistinct(3, usedKeys).slice(0, 3);
  const choices = shuffle([
    { ...answer, id: `choice-correct-${answer.id}` },
    ...distractors.map((d, i) => ({ ...d, id: `choice-dist-${i}-${d.id}` })),
  ]).slice(0, 4);

  // Make sure correct choice is always in list (might have been sliced out if fewer than 4 distractors)
  const hasCorrect = choices.some(c => c.shape === answer.shape && c.colorId === answer.colorId);
  if (!hasCorrect) {
    choices[0] = { ...answer, id: `choice-correct-${answer.id}` };
  }

  return { fullPattern, displayPattern, answer, choices };
}

// ─── SVG Shape ───────────────────────────────────────────────────────────────

function ShapeGeom({ shape, size, fill, stroke, strokeWidth }) {
  const p = {
    fill: fill ?? 'none',
    stroke: stroke ?? 'none',
    strokeWidth: strokeWidth ?? 0,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      {shape === 'circle'   && <circle cx="50" cy="50" r="43" {...p} />}
      {shape === 'square'   && <rect x="8" y="8" width="84" height="84" rx="12" {...p} />}
      {shape === 'triangle' && <polygon points="50,7 93,89 7,89" {...p} />}
      {shape === 'star'     && <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" {...p} />}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatternGame({ onExit, lang = 'he', vibrateOn = true }) {
  const [levelIdx, setLevelIdx]   = useState(0);
  const [pattern, setPattern]     = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [mistakes, setMistakes]   = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [answered, setAnswered]   = useState(false);
  const [disabledIds, setDisabledIds] = useState(new Set());
  const [revealed, setRevealed]   = useState(false); // show answer in ? slot

  const levelDoneRef = useRef(false);
  const advanceTimer = useRef(null);
  const disableTimer = useRef(null);

  // ── Build level ──────────────────────────────────────────────────────────

  useEffect(() => {
    levelDoneRef.current = false;
    const data = buildLevel(levelIdx);
    setPattern(data);
    setSelectedId(null);
    setIsCorrect(null);
    setMistakes(0);
    setLevelDone(false);
    setAnswered(false);
    setDisabledIds(new Set());
    setRevealed(false);
  }, [levelIdx]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(advanceTimer.current);
      clearTimeout(disableTimer.current);
    };
  }, []);

  // ── Handle choice tap ────────────────────────────────────────────────────

  const handleChoice = useCallback((choice) => {
    if (!pattern) return;
    if (answered) return;
    if (levelDoneRef.current) return;
    if (disabledIds.has(choice.id)) return;

    const correct = choice.shape === pattern.answer.shape && choice.colorId === pattern.answer.colorId;

    setSelectedId(choice.id);
    setIsCorrect(correct);

    if (correct) {
      if (vibrateOn) navigator.vibrate?.([40, 30, 80, 30, 120]);
      setAnswered(true);
      setRevealed(true);
      levelDoneRef.current = true;

      advanceTimer.current = setTimeout(() => {
        setLevelDone(true);
      }, 1200);
    } else {
      if (vibrateOn) navigator.vibrate?.([80, 40, 80]);
      setMistakes(m => m + 1);

      // disable wrong choice for 1s
      setDisabledIds(prev => new Set([...prev, choice.id]));
      disableTimer.current = setTimeout(() => {
        setDisabledIds(prev => {
          const next = new Set(prev);
          next.delete(choice.id);
          return next;
        });
        setSelectedId(null);
        setIsCorrect(null);
      }, 1000);
    }
  }, [pattern, answered, disabledIds, vibrateOn]);

  if (!pattern) return null;

  const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const levelNum  = levelIdx + 1;

  const { displayPattern, answer, choices } = pattern;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pg-root">
      <div className="pg-bg">
        <div className="pg-blob pg-blob1" />
        <div className="pg-blob pg-blob2" />
        <div className="pg-blob pg-blob3" />
      </div>

      {/* Header */}
      <div className="pg-header">
        <button className="pg-btn-exit" onClick={onExit}>✕</button>
        <span className="pg-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="pg-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

      {/* Pattern display */}
      <div className="pg-content">
        <div className="pg-instruction">
          {lang === 'he' ? 'מה הבא בסדרה?' : 'What comes next?'}
        </div>

        <div className="pg-pattern-row">
          {displayPattern.map((item, i) => (
            <div key={i} className="pg-pattern-item" style={{ '--delay': `${i * 0.08}s` }}>
              <ShapeGeom shape={item.shape} size={75} fill={item.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
            </div>
          ))}

          {/* Question tile */}
          <div className={`pg-question-tile${revealed ? ' pg-question-revealed' : ''}`}>
            {revealed ? (
              <div className="pg-question-answer-shape">
                <ShapeGeom shape={answer.shape} size={75} fill={answer.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
              </div>
            ) : (
              <span className="pg-question-mark">?</span>
            )}
          </div>
        </div>

        {/* Choices */}
        <div className="pg-choices-row">
          {choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const isWrongSelected = isSelected && isCorrect === false;
            const isRightSelected = isSelected && isCorrect === true;
            const isDisabled = disabledIds.has(choice.id);

            return (
              <button
                key={choice.id}
                className={[
                  'pg-choice',
                  isWrongSelected ? 'pg-choice-wrong'   : '',
                  isRightSelected ? 'pg-choice-correct' : '',
                  isDisabled      ? 'pg-choice-disabled': '',
                ].join(' ')}
                onPointerDown={() => handleChoice(choice)}
                disabled={isDisabled || answered}
              >
                <ShapeGeom shape={choice.shape} size={80} fill={choice.fill} stroke="rgba(255,255,255,0.45)" strokeWidth={3} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Level complete overlay */}
      {levelDone && (
        <div className="pg-complete">
          <div className="pg-complete-card">
            <span className="pg-complete-emoji">🎉</span>
            <div className="pg-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="pg-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`pg-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <button
              className="pg-btn-next"
              onClick={() => setLevelIdx(p => p + 1)}
            >
              {lang === 'he' ? 'שלב הבא ➜' : 'Next Level ➜'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
