import { useState, useRef, useEffect, useCallback } from 'react';
import './ColorMix.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: 'red',    fill: '#FF3B3B', glow: 'rgba(255,59,59,0.6)'   },
  { id: 'blue',   fill: '#2979FF', glow: 'rgba(41,121,255,0.6)'  },
  { id: 'yellow', fill: '#FFD600', glow: 'rgba(255,214,0,0.6)'   },
];

// Canonical mix table — key is sorted pair
const MIX_TABLE = {
  'blue+red':    { resultFill: '#9B34FF', resultName: { he: 'סגול',   en: 'Purple' }, glow: 'rgba(155,52,255,0.6)' },
  'red+yellow':  { resultFill: '#FF8800', resultName: { he: 'כתום',   en: 'Orange' }, glow: 'rgba(255,136,0,0.6)'  },
  'blue+yellow': { resultFill: '#00BB44', resultName: { he: 'ירוק',   en: 'Green'  }, glow: 'rgba(0,187,68,0.6)'   },
};

function mixKey(a, b) {
  return [a, b].sort().join('+');
}

// All 3 combos
const ALL_COMBOS = [
  { color1: 'red',  color2: 'blue',   key: mixKey('red',  'blue')   },
  { color1: 'red',  color2: 'yellow', key: mixKey('red',  'yellow') },
  { color1: 'blue', color2: 'yellow', key: mixKey('blue', 'yellow') },
];

// Level definitions: array of combo keys to mix
const LEVEL_DEFS = [
  [ALL_COMBOS[0]],                           // L1: red+blue=purple
  [ALL_COMBOS[1]],                           // L2: red+yellow=orange
  [ALL_COMBOS[2]],                           // L3: blue+yellow=green
  [ALL_COMBOS[0], ALL_COMBOS[1]],            // L4
  [ALL_COMBOS[1], ALL_COMBOS[2]],            // L5
  [ALL_COMBOS[0], ALL_COMBOS[2]],            // L6
  [ALL_COMBOS[0], ALL_COMBOS[1]],            // L7 repeated
  [ALL_COMBOS[0], ALL_COMBOS[1], ALL_COMBOS[2]], // L8
  [ALL_COMBOS[0], ALL_COMBOS[1], ALL_COMBOS[2]], // L9
  [ALL_COMBOS[0], ALL_COMBOS[1], ALL_COMBOS[2]], // L10
];

const BOWL_R   = 72;  // radius of mixing bowl circle
const SOURCE_R = 40;  // radius of source circle swatch
const MINI_R   = 28;  // radius of circle inside bowl

// ─── Build level ──────────────────────────────────────────────────────────────

function buildLevel(levelIdx, W, H) {
  const combos = LEVEL_DEFS[Math.min(levelIdx, LEVEL_DEFS.length - 1)];
  const numTargets = combos.length;
  const numBowls   = levelIdx >= 7 ? 2 : 1;

  // Targets (top 45% of screen)
  const targetY = H * 0.24;
  const targets = combos.map((combo, i) => {
    const mix = MIX_TABLE[combo.key];
    const xFrac = numTargets === 1
      ? 0.5
      : numTargets === 2
        ? (i === 0 ? 0.3 : 0.7)
        : [0.2, 0.5, 0.8][i];
    return {
      id:         `tgt-${i}`,
      color1:     combo.color1,
      color2:     combo.color2,
      resultFill: mix.resultFill,
      resultName: mix.resultName,
      glow:       mix.glow,
      cx:         W * xFrac,
      cy:         targetY,
      matched:    false,
    };
  });

  // Bowls (middle of screen, ~55% height)
  const bowlY = H * 0.58;
  const bowls = Array.from({ length: numBowls }, (_, i) => {
    const xFrac = numBowls === 1 ? 0.5 : (i === 0 ? 0.3 : 0.7);
    return {
      id:    `bowl-${i}`,
      cx:    W * xFrac,
      cy:    bowlY,
      slot1: null,
      slot2: null,
    };
  });

  // Sources — 3 swatches at bottom (6 total = 2 of each for visual variety, but we use 3)
  // Lay out 3 sources: red, blue, yellow
  const sourceY = H * 0.875;
  const sources = SOURCES.map((src, i) => ({
    ...src,
    homeCx: W * [0.25, 0.5, 0.75][i],
    homeCy: sourceY,
  }));

  return { targets, bowls, sources };
}

// ─── SparkBurst ───────────────────────────────────────────────────────────────

function SparkBurst({ x, y, color }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const dist  = 45 + Math.random() * 35;
        return (
          <div
            key={i}
            className="cm-spark"
            style={{
              left:           x,
              top:            y,
              '--dx':         `${Math.cos((angle * Math.PI) / 180) * dist}px`,
              '--dy':         `${Math.sin((angle * Math.PI) / 180) * dist}px`,
              background:     color,
              width:          `${6 + Math.random() * 7}px`,
              height:         `${6 + Math.random() * 7}px`,
              animationDelay: `${i * 0.018}s`,
            }}
          />
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ColorMix({ onExit, lang = 'he', vibrateOn = true }) {
  const containerRef = useRef(null);
  const [W, setW]    = useState(window.innerWidth);
  const [H, setH]    = useState(window.innerHeight);

  const [levelIdx,    setLevelIdx]    = useState(0);
  const [targets,     setTargets]     = useState([]);
  const [bowls,       setBowls]       = useState([]);
  const [sources,     setSources]     = useState([]);
  const [dragging,    setDragging]    = useState(null);
  // dragging = { srcId, fill, glow, cx, cy, offX, offY }

  const [wrongBowlId,   setWrongBowlId]   = useState(null);
  const [matchedTgtId,  setMatchedTgtId]  = useState(null);
  const [sparks,        setSparks]        = useState([]);
  const [levelDone,     setLevelDone]     = useState(false);
  const [mistakes,      setMistakes]      = useState(0);
  const [totalStars,    setTotalStars]    = useState(0);

  // Refs for pointer handlers
  const draggingRef  = useRef(null);
  const bowlsRef     = useRef([]);
  const targetsRef   = useRef([]);
  const mistakesRef  = useRef(0);

  useEffect(() => { bowlsRef.current   = bowls;    }, [bowls]);
  useEffect(() => { targetsRef.current = targets;  }, [targets]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  // Measure on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setW(r.width);
    setH(r.height);
  }, []);

  // Build level
  useEffect(() => {
    if (!W || !H) return;
    const { targets: t, bowls: b, sources: s } = buildLevel(levelIdx, W, H);
    setTargets(t);
    setBowls(b);
    setSources(s);
    setMistakes(0);
    mistakesRef.current = 0;
    setLevelDone(false);
    setSparks([]);
    setWrongBowlId(null);
    setMatchedTgtId(null);
  }, [levelIdx, W, H]);

  // ── Bowl logic ──────────────────────────────────────────────────────────────

  const checkBowl = useCallback((bowlId) => {
    const bowls = bowlsRef.current;
    const targets = targetsRef.current;
    const bowl = bowls.find(b => b.id === bowlId);
    if (!bowl || !bowl.slot1 || !bowl.slot2) return;

    const key = mixKey(bowl.slot1.srcId, bowl.slot2.srcId);
    // find unmatched target that matches this key
    const tgt = targets.find(t => !t.matched && mixKey(t.color1, t.color2) === key);

    if (tgt) {
      // Correct!
      if (vibrateOn) navigator.vibrate?.([40, 25, 90]);

      // Flash match on target
      setMatchedTgtId(tgt.id);
      setTimeout(() => setMatchedTgtId(null), 700);

      // Sparks
      const sparkId = Date.now() + Math.random();
      const mix = MIX_TABLE[key];
      setSparks(prev => [...prev, { id: sparkId, x: tgt.cx, y: tgt.cy, color: mix.resultFill }]);
      setTimeout(() => setSparks(prev => prev.filter(s => s.id !== sparkId)), 950);

      // Mark target matched, clear bowl
      setTargets(prev => prev.map(t => t.id === tgt.id ? { ...t, matched: true } : t));
      setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, slot1: null, slot2: null } : b));

      // Check level done
      const newMatched = targets.filter(t => t.matched).length + 1;
      if (newMatched >= targets.length) {
        const m = mistakesRef.current;
        const stars = m === 0 ? 3 : m <= 2 ? 2 : 1;
        setTotalStars(prev => prev + stars);
        setTimeout(() => setLevelDone(true), 700);
      }
    } else {
      // Wrong combo — shake bowl, return circles
      if (vibrateOn) navigator.vibrate?.([80, 40, 80]);
      setWrongBowlId(bowlId);
      setMistakes(m => m + 1);
      setTimeout(() => {
        setWrongBowlId(null);
        setBowls(prev => prev.map(b => b.id === bowlId ? { ...b, slot1: null, slot2: null } : b));
      }, 500);
    }
  }, [vibrateOn]);

  // ── Pointer handlers ────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e, srcId, fill, glow) => {
    e.preventDefault();
    e.stopPropagation();
    const src = sources.find(s => s.id === srcId);
    if (!src) return;
    const rect = containerRef.current.getBoundingClientRect();
    const d = {
      srcId,
      fill,
      glow,
      offX: 0,
      offY: 0,
      cx:   e.clientX - rect.left,
      cy:   e.clientY - rect.top,
    };
    draggingRef.current = d;
    setDragging(d);
  }, [sources]);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    draggingRef.current = { ...draggingRef.current, cx, cy };
    setDragging(prev => prev ? { ...prev, cx, cy } : null);
  }, []);

  const onPointerUp = useCallback(() => {
    const d = draggingRef.current;
    draggingRef.current = null;
    setDragging(null);
    if (!d) return;

    const { srcId, fill, glow, cx, cy } = d;

    // Find nearest bowl with a free slot
    const bwls = bowlsRef.current;
    let nearest = null, minDist = Infinity;
    for (const bowl of bwls) {
      if (bowl.slot1 && bowl.slot2) continue; // full
      const dist = Math.hypot(cx - bowl.cx, cy - bowl.cy);
      if (dist < minDist) { minDist = dist; nearest = bowl; }
    }

    const SNAP_DIST = BOWL_R + 40;
    if (nearest && minDist < SNAP_DIST) {
      // Drop into bowl
      setBowls(prev => prev.map(b => {
        if (b.id !== nearest.id) return b;
        if (!b.slot1) return { ...b, slot1: { srcId, fill, glow } };
        if (!b.slot2) return { ...b, slot2: { srcId, fill, glow } };
        return b;
      }));

      // Check after state update
      setTimeout(() => {
        const updated = bowlsRef.current.find(b => b.id === nearest.id);
        if (updated && updated.slot1 && updated.slot2) {
          checkBowl(nearest.id);
        }
      }, 50);
    }
    // else: just drop nowhere — circle vanishes (source respawns immediately anyway)
  }, [checkBowl]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const levelNum  = levelIdx + 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="cm-root"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Background */}
      <div className="cm-bg" />

      {/* Header */}
      <div className="cm-header">
        <button className="cm-btn-exit" onClick={onExit}>✕</button>
        <span className="cm-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="cm-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

      {/* Target circles */}
      <div className="cm-targets-label" style={{ top: H * 0.085 }}>
        <span>{lang === 'he' ? 'ערבב ל...' : 'Mix to...'}</span>
      </div>

      {targets.map(tgt => (
        <div
          key={tgt.id}
          className={[
            'cm-target',
            tgt.matched    ? 'cm-target-matched'  : '',
            matchedTgtId === tgt.id ? 'cm-target-glow' : '',
          ].join(' ')}
          style={{
            width:     BOWL_R * 2,
            height:    BOWL_R * 2,
            left:      tgt.cx - BOWL_R,
            top:       tgt.cy - BOWL_R,
            '--glow':  tgt.glow,
            background: tgt.resultFill,
          }}
        >
          {tgt.matched && <span className="cm-check">✓</span>}
          <span className="cm-target-name">
            {tgt.resultName[lang] ?? tgt.resultName.en}
          </span>
        </div>
      ))}

      {/* Mixing Bowls */}
      {bowls.map(bowl => {
        const slots = [bowl.slot1, bowl.slot2].filter(Boolean);
        return (
          <div
            key={bowl.id}
            className={[
              'cm-bowl',
              wrongBowlId === bowl.id ? 'cm-bowl-wrong' : '',
            ].join(' ')}
            style={{
              width:  BOWL_R * 2,
              height: BOWL_R * 2,
              left:   bowl.cx - BOWL_R,
              top:    bowl.cy - BOWL_R,
            }}
          >
            {slots.map((slot, si) => (
              <div
                key={si}
                className="cm-bowl-circle"
                style={{
                  width:      MINI_R * 2,
                  height:     MINI_R * 2,
                  background: slot.fill,
                  '--glow':   slot.glow,
                  left:       slots.length === 1
                    ? '50%'
                    : si === 0 ? '28%' : '72%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Bowl label */}
      <div
        className="cm-bowl-label"
        style={{ top: H * 0.47 }}
      >
        {lang === 'he' ? 'קערת הערבוב' : 'Mixing Bowl'}
      </div>

      {/* Source swatches at bottom */}
      <div className="cm-sources-label" style={{ top: H * 0.80 }}>
        {lang === 'he' ? 'גרור צבע' : 'Drag a color'}
      </div>

      {sources.map(src => {
        const isDrag = dragging?.srcId === src.id;
        return (
          <div
            key={src.id}
            className={['cm-source', isDrag ? 'cm-source-drag' : ''].join(' ')}
            style={{
              width:   SOURCE_R * 2,
              height:  SOURCE_R * 2,
              left:    src.homeCx - SOURCE_R,
              top:     src.homeCy - SOURCE_R,
              background: src.fill,
              '--glow':   src.glow,
            }}
            onPointerDown={e => onPointerDown(e, src.id, src.fill, src.glow)}
          />
        );
      })}

      {/* Dragging ghost */}
      {dragging && (
        <div
          className="cm-drag-ghost"
          style={{
            width:      SOURCE_R * 2,
            height:     SOURCE_R * 2,
            left:       dragging.cx - SOURCE_R,
            top:        dragging.cy - SOURCE_R,
            background: dragging.fill,
            '--glow':   dragging.glow,
          }}
        />
      )}

      {/* Sparks */}
      {sparks.map(s => (
        <SparkBurst key={s.id} x={s.x} y={s.y} color={s.color} />
      ))}

      {/* Level-complete overlay */}
      {levelDone && (
        <div
          className="cm-complete"
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          <div className="cm-complete-card">
            <span className="cm-complete-emoji">🎨</span>
            <div className="cm-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="cm-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`cm-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <div className="cm-total-score">
              {lang === 'he' ? `סה"כ ⭐ ${totalStars}` : `Total ⭐ ${totalStars}`}
            </div>
            <button
              className="cm-btn-next"
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
