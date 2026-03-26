import { useState, useRef, useEffect, useCallback } from 'react';
import './ShapeMemory.css';

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

const LEVELS = [
  { seqLen: 2, showMs: 3000, shapes: 1, colors: 2 },  // L1
  { seqLen: 2, showMs: 3000, shapes: 2, colors: 3 },  // L2
  { seqLen: 3, showMs: 2500, shapes: 3, colors: 3 },  // L3
  { seqLen: 3, showMs: 2500, shapes: 4, colors: 4 },  // L4
  { seqLen: 4, showMs: 2000, shapes: 4, colors: 5 },  // L5
  { seqLen: 4, showMs: 2000, shapes: 4, colors: 6 },  // L6+
];

function getLevelCfg(levelIdx) {
  return LEVELS[Math.min(levelIdx, LEVELS.length - 1)];
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

function buildSequence(cfg) {
  const shapes = ALL_SHAPES.slice(0, cfg.shapes);
  const colors = shuffle(PALETTE).slice(0, cfg.colors);
  const seq = [];
  for (let i = 0; i < cfg.seqLen; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    seq.push({ shape, colorId: color.id, fill: color.fill });
  }
  return seq;
}

function buildPalette(sequence, cfg) {
  // collect all combos already in sequence as Set strings
  const inSeq = new Set(sequence.map(s => `${s.shape}|${s.colorId}`));

  const shapes = ALL_SHAPES.slice(0, cfg.shapes);
  const colors = shuffle(PALETTE).slice(0, cfg.colors);

  // all unique items from sequence (deduplicated)
  const uniqueItems = [];
  const seen = new Set();
  for (const item of sequence) {
    const key = `${item.shape}|${item.colorId}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push({ ...item, id: key });
    }
  }

  // distractors: combos not in sequence
  const distractors = [];
  for (const shape of shapes) {
    for (const color of colors) {
      const key = `${shape}|${color.id}`;
      if (!inSeq.has(key)) {
        distractors.push({ shape, colorId: color.id, fill: color.fill, id: key });
      }
    }
  }

  const numDistractors = Math.min(shuffle(distractors).length, 2 + Math.floor(Math.random() * 3));
  const extras = shuffle(distractors).slice(0, numDistractors);

  return shuffle([...uniqueItems, ...extras]);
}

// ─── SVG Shape ───────────────────────────────────────────────────────────────

function ShapeGeom({ shape, size, fill, stroke, strokeWidth, strokeDash, opacity }) {
  const p = {
    fill: fill ?? 'none',
    stroke: stroke ?? 'none',
    strokeWidth: strokeWidth ?? 0,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    opacity: opacity ?? 1,
    ...(strokeDash ? { strokeDasharray: strokeDash } : {}),
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

// ─── Countdown Ring ──────────────────────────────────────────────────────────

function CountdownRing({ remaining, total }) {
  const R = 30;
  const circ = 2 * Math.PI * R;
  const progress = Math.max(0, remaining / total);
  const dash = circ * progress;
  return (
    <div className="mem-countdown-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={R}
          fill="none"
          stroke="#00E5FF"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 0.9s linear' }}
        />
        <text x="40" y="46" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
          {Math.ceil(remaining)}
        </text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShapeMemory({ onExit, lang = 'he', vibrateOn = true }) {
  const [levelIdx, setLevelIdx]     = useState(0);
  const [phase, setPhase]           = useState('show'); // 'show' | 'recall'
  const [sequence, setSequence]     = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [countdown, setCountdown]   = useState(3);
  const [wrongSlot, setWrongSlot]   = useState(null);
  const [mistakes, setMistakes]     = useState(0);
  const [levelDone, setLevelDone]   = useState(false);
  const [palette, setPalette]       = useState([]);
  const [fading, setFading]         = useState(false);
  const [slotGlow, setSlotGlow]     = useState(null); // index of correct slot

  const levelDoneRef  = useRef(false);
  const intervalRef   = useRef(null);
  const wrongTimerRef = useRef(null);

  const cfg = getLevelCfg(levelIdx);
  const totalShowSec = cfg.showMs / 1000;

  // ── Build level ──────────────────────────────────────────────────────────

  useEffect(() => {
    levelDoneRef.current = false;
    const seq = buildSequence(cfg);
    const pal = buildPalette(seq, cfg);
    setSequence(seq);
    setPalette(pal);
    setUserAnswers([]);
    setMistakes(0);
    setWrongSlot(null);
    setSlotGlow(null);
    setLevelDone(false);
    setPhase('show');
    setCountdown(totalShowSec);
    setFading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  // ── Countdown interval (SHOW phase) ──────────────────────────────────────

  useEffect(() => {
    if (phase !== 'show') return;

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 0.1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          setFading(true);
          setTimeout(() => {
            setPhase('recall');
            setFading(false);
          }, 500);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [phase]);

  // ── Tap palette item ──────────────────────────────────────────────────────

  const handlePaletteTap = useCallback((item) => {
    if (levelDoneRef.current) return;

    const currentIdx = userAnswers.length;
    if (currentIdx >= sequence.length) return;

    const correct = sequence[currentIdx];

    if (item.shape === correct.shape && item.colorId === correct.colorId) {
      // Correct
      if (vibrateOn) navigator.vibrate?.([30, 20, 60]);

      const nextAnswers = [...userAnswers, item];
      setSlotGlow(currentIdx);
      setTimeout(() => setSlotGlow(null), 500);

      if (nextAnswers.length === sequence.length) {
        // Sequence complete!
        levelDoneRef.current = true;
        setUserAnswers(nextAnswers);
        if (vibrateOn) navigator.vibrate?.([40, 30, 80, 30, 120]);
        setTimeout(() => setLevelDone(true), 600);
      } else {
        setUserAnswers(nextAnswers);
      }
    } else {
      // Wrong
      if (vibrateOn) navigator.vibrate?.([80, 40, 80]);

      setWrongSlot(currentIdx);
      setMistakes(m => m + 1);

      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        setWrongSlot(null);
        setUserAnswers([]);
      }, 600);
    }
  }, [userAnswers, sequence, vibrateOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const levelNum  = levelIdx + 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mem-root">
      <div className="mem-bg">
        <div className="mem-blob mem-blob1" />
        <div className="mem-blob mem-blob2" />
        <div className="mem-blob mem-blob3" />
      </div>

      {/* Header */}
      <div className="mem-header">
        <button className="mem-btn-exit" onClick={onExit}>✕</button>
        <span className="mem-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="mem-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

      {/* SHOW phase */}
      {phase === 'show' && (
        <div className={`mem-show-area${fading ? ' mem-fade-out' : ''}`}>
          <div className="mem-phase-label">
            {lang === 'he' ? 'זכור את הסדר!' : 'Memorize the order!'}
          </div>
          <div className="mem-sequence-row">
            {sequence.map((item, i) => (
              <div key={i} className="mem-show-item" style={{ '--item-delay': `${i * 0.1}s` }}>
                <ShapeGeom shape={item.shape} size={80} fill={item.fill} stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
              </div>
            ))}
          </div>
          <CountdownRing remaining={countdown} total={totalShowSec} />
        </div>
      )}

      {/* RECALL phase */}
      {phase === 'recall' && (
        <div className="mem-recall-area">
          <div className="mem-phase-label">
            {lang === 'he' ? 'בחר בסדר הנכון!' : 'Tap in the right order!'}
          </div>

          {/* Answer slots */}
          <div className="mem-slots-row">
            {sequence.map((item, i) => {
              const filled = userAnswers[i];
              const isCurrent = i === userAnswers.length;
              const isWrong   = wrongSlot === i;
              const isGlow    = slotGlow === i;
              return (
                <div
                  key={i}
                  className={[
                    'mem-slot',
                    isCurrent && !filled ? 'mem-slot-current' : '',
                    isWrong ? 'mem-slot-wrong' : '',
                    isGlow  ? 'mem-slot-glow'  : '',
                  ].join(' ')}
                >
                  {filled ? (
                    <ShapeGeom shape={filled.shape} size={70} fill={filled.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
                  ) : (
                    <div className="mem-slot-empty">
                      {isCurrent && <span className="mem-slot-pointer">▼</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Palette */}
          <div className="mem-palette-grid">
            {palette.map((item) => (
              <button
                key={item.id}
                className="mem-palette-item"
                onPointerDown={() => handlePaletteTap(item)}
              >
                <ShapeGeom shape={item.shape} size={72} fill={item.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level complete overlay */}
      {levelDone && (
        <div className="mem-complete">
          <div className="mem-complete-card">
            <span className="mem-complete-emoji">🎉</span>
            <div className="mem-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="mem-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`mem-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <button
              className="mem-btn-next"
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
