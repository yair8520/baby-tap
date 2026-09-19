import { useState, useRef, useEffect, useCallback } from 'react';
import {
  BOWL_R,
  SOURCE_R,
  MINI_R,
  MIX_TABLE,
  mixKey,
  COLORMIX_LEVELS,
  buildLevel,
} from './levels.js';
import { LearningGameShell, starsFromMistakes } from '../../components/LearningGameShell';
import { useGameBestStars, useGameLevel } from '../../hooks/useGameProgress.js';
import { useResponsiveGameViewport } from '../../hooks/useResponsiveGameViewport.js';
import './ColorMix.css';

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
  const { width: W, height: H } = useResponsiveGameViewport(containerRef);
  const [roundKey, setRoundKey] = useState(0);

  const [levelIdx,    setLevelIdx]    = useGameLevel('colormix', 0, {
    maxLevels: COLORMIX_LEVELS.length,
  });
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
  const { recordStars, totalStars } = useGameBestStars(
    'colormix',
    COLORMIX_LEVELS.length,
  );

  // Refs for pointer handlers
  const draggingRef  = useRef(null);
  const bowlsRef     = useRef([]);
  const targetsRef   = useRef([]);
  const mistakesRef  = useRef(0);
  const completeTimerRef = useRef(null);

  useEffect(() => { bowlsRef.current   = bowls;    }, [bowls]);
  useEffect(() => { targetsRef.current = targets;  }, [targets]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

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
    draggingRef.current = null;
    setDragging(null);
    return () => clearTimeout(completeTimerRef.current);
  }, [levelIdx, roundKey, W, H]);

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
        recordStars(levelIdx, starsFromMistakes(mistakesRef.current));
        completeTimerRef.current = setTimeout(() => setLevelDone(true), 700);
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
  }, [levelIdx, recordStars, vibrateOn]);

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

  const starCount = starsFromMistakes(mistakes);
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

      <LearningGameShell
        lang={lang}
        levelNum={levelNum}
        totalStars={totalStars}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={() => setLevelIdx(p => p + 1)}
        onReplay={() => setRoundKey(key => key + 1)}
        isLastLevel={levelIdx === COLORMIX_LEVELS.length - 1}
      >

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
      </LearningGameShell>
    </div>
  );
}
