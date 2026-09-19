import { useState, useRef, useEffect, useCallback } from 'react';
import { ShapeGeom } from '../../components/ShapeGeom';
import { LearningGameShell } from '../../components/LearningGameShell';
import {
  SHAPEMEMORY_LEVELS,
  getShapeMemoryLevel,
  buildSequence,
  buildPalette,
} from './levels.js';
import { useGameLevel } from '../../hooks/useGameProgress.js';
import './ShapeMemory.css';

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
  const [levelIdx, setLevelIdx]     = useGameLevel('shapememory', 0, {
    maxLevels: SHAPEMEMORY_LEVELS.length,
  });
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

  const cfg = getShapeMemoryLevel(levelIdx);
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

      <LearningGameShell
        lang={lang}
        levelNum={levelNum}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={() => setLevelIdx(p => p + 1)}
      >
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
      </LearningGameShell>
    </div>
  );
}
