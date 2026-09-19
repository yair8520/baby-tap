import { useState, useRef, useEffect, useCallback } from 'react';
import { SIZESORT_LEVELS, buildLevel } from './levels.js';
import { LearningGameShell, starsFromMistakes } from '../../components/LearningGameShell';
import { useGameBestStars, useGameLevel } from '../../hooks/useGameProgress.js';
import { useResponsiveGameViewport } from '../../hooks/useResponsiveGameViewport.js';
import { buzz } from '../../components/LearningGameShell/vibrate.js';
import './SizeSort.css';

// ─── SparkBurst ───────────────────────────────────────────────────────────────

const SPARK_PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 360;
  const distance = 40 + ((i * 17) % 36);
  return {
    dx: Math.cos((angle * Math.PI) / 180) * distance,
    dy: Math.sin((angle * Math.PI) / 180) * distance,
    size: 6 + ((i * 5) % 7),
    delay: i * 0.02,
  };
});

function SparkBurst({ x, y, color }) {
  return (
    <>
      {SPARK_PARTICLES.map((particle, i) => (
        <div
          key={i}
          className="ss-spark"
          style={{
            left: x,
            top: y,
            '--dx': `${particle.dx}px`,
            '--dy': `${particle.dy}px`,
            background: color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SizeSort({ onExit, lang = 'he', vibrateOn = true }) {
  const containerRef = useRef(null);
  const { width: W, height: H } = useResponsiveGameViewport(containerRef);
  const [roundKey, setRoundKey] = useState(0);

  const [levelIdx,  setLevelIdx]  = useGameLevel('sizesort', 0, {
    maxLevels: SIZESORT_LEVELS.length,
  });
  const [slots,     setSlots]     = useState([]);
  const [pieces,    setPieces]    = useState([]);
  const [dragging,  setDragging]  = useState(null);
  // dragging = { pieceId, offX, offY, cx, cy }

  const [wrongId,   setWrongId]   = useState(null);
  const [matchId,   setMatchId]   = useState(null);
  const [sparks,    setSparks]    = useState([]);
  const [mistakes,  setMistakes]  = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const { recordStars, totalStars } = useGameBestStars(
    'sizesort',
    SIZESORT_LEVELS.length,
  );

  const draggingRef  = useRef(null);
  const piecesRef    = useRef([]);
  const slotsRef     = useRef([]);
  const mistakesRef  = useRef(0);
  const completeTimerRef = useRef(null);

  useEffect(() => { piecesRef.current   = pieces;   }, [pieces]);
  useEffect(() => { slotsRef.current    = slots;    }, [slots]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  // Build level
  useEffect(() => {
    if (!W || !H) return;
    const initializeTimer = setTimeout(() => {
      const { slots: s, pieces: p } = buildLevel(levelIdx, W, H);
      setSlots(s);
      setPieces(p);
      setMistakes(0);
      mistakesRef.current = 0;
      setLevelDone(false);
      setSparks([]);
      setWrongId(null);
      setMatchId(null);
      draggingRef.current = null;
      setDragging(null);
    }, 0);
    return () => {
      clearTimeout(initializeTimer);
      clearTimeout(completeTimerRef.current);
    };
  }, [levelIdx, roundKey, W, H]);

  // ── Pointer handlers ────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e, pieceId) => {
    e.preventDefault();
    e.stopPropagation();
    const piece = piecesRef.current.find(p => p.id === pieceId);
    if (!piece || piece.matched) return;

    const rect = containerRef.current.getBoundingClientRect();
    const d = {
      pieceId,
      offX: e.clientX - rect.left - piece.cx,
      offY: e.clientY - rect.top  - piece.cy,
      cx:   piece.cx,
      cy:   piece.cy,
    };
    draggingRef.current = d;
    setDragging(d);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left - draggingRef.current.offX;
    const cy = e.clientY - rect.top  - draggingRef.current.offY;
    draggingRef.current = { ...draggingRef.current, cx, cy };
    setDragging(prev => prev ? { ...prev, cx, cy } : null);
  }, []);

  const onPointerUp = useCallback(() => {
    const d = draggingRef.current;
    draggingRef.current = null;
    setDragging(null);
    if (!d) return;

    const { pieceId, cx, cy } = d;
    const piece = piecesRef.current.find(p => p.id === pieceId);
    if (!piece) return;

    // Find nearest unfilled slot
    let nearest = null, minDist = Infinity;
    for (const sl of slotsRef.current) {
      if (sl.filled) continue;
      const dist = Math.hypot(cx - sl.cx, cy - sl.cy);
      if (dist < minDist) { minDist = dist; nearest = sl; }
    }

    const SNAP = (nearest ? nearest.slotD / 2 + 30 : 0);

    if (nearest && minDist < SNAP) {
      if (nearest.rank === piece.rank) {
        // Correct!
        buzz([40, 25, 90], vibrateOn);

        setSlots(prev => prev.map(sl =>
          sl.id === nearest.id ? { ...sl, filled: true } : sl
        ));
        setPieces(prev => prev.map(pc =>
          pc.id === pieceId
            ? { ...pc, cx: nearest.cx, cy: nearest.cy, matched: true }
            : pc
        ));

        setMatchId(nearest.id);
        setTimeout(() => setMatchId(null), 700);

        const sparkId = Date.now() + Math.random();
        setSparks(prev => [...prev, { id: sparkId, x: nearest.cx, y: nearest.cy, color: piece.color }]);
        setTimeout(() => setSparks(prev => prev.filter(s => s.id !== sparkId)), 950);

        const matched = piecesRef.current.filter(p => p.matched).length + 1;
        if (matched >= piecesRef.current.length) {
          recordStars(levelIdx, starsFromMistakes(mistakesRef.current));
          completeTimerRef.current = setTimeout(() => setLevelDone(true), 650);
        }
      } else {
        // Wrong slot
        buzz([80, 40, 80], vibrateOn);
        setWrongId(pieceId);
        setMistakes(m => m + 1);
        setTimeout(() => setWrongId(null), 520);
        setPieces(prev => prev.map(pc =>
          pc.id === pieceId ? { ...pc, cx: pc.homeCx, cy: pc.homeCy } : pc
        ));
      }
    } else {
      // Dropped nowhere — return home
      setPieces(prev => prev.map(pc =>
        pc.id === pieceId ? { ...pc, cx: pc.homeCx, cy: pc.homeCy } : pc
      ));
    }
  }, [levelIdx, recordStars, vibrateOn]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const starCount = starsFromMistakes(mistakes);
  const levelNum  = levelIdx + 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="ss-root"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Background */}
      <div className="ss-bg" />

      <LearningGameShell
        lang={lang}
        levelNum={levelNum}
        totalStars={totalStars}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={() => setLevelIdx(p => p + 1)}
        onReplay={() => setRoundKey(key => key + 1)}
        isLastLevel={levelIdx === SIZESORT_LEVELS.length - 1}
      >

      {/* Direction label */}
      <div className="ss-direction-label" style={{ top: 66 }}>
        {lang === 'he' ? 'מהקטן לגדול →' : 'Smallest → Largest'}
      </div>

      {/* Slots */}
      {slots.map(sl => (
        <div
          key={sl.id}
          className={[
            'ss-slot',
            matchId === sl.id ? 'ss-slot-pop' : '',
            sl.filled          ? 'ss-slot-filled' : '',
          ].join(' ')}
          style={{
            width:       sl.slotD,
            height:      sl.slotD,
            left:        sl.cx - sl.slotD / 2,
            top:         sl.cy - sl.slotD / 2,
            '--slot-color': sl.color,
            '--glow':       sl.glow,
          }}
        />
      ))}

      {/* Rank arrows between slots */}
      {slots.length > 1 && slots.slice(0, -1).map((sl, i) => {
        const nextSl = slots[i + 1];
        const midX   = (sl.cx + nextSl.cx) / 2;
        const midY   = sl.cy;
        return (
          <div
            key={`arr-${i}`}
            className="ss-arrow"
            style={{ left: midX - 10, top: midY - 10 }}
          >
            →
          </div>
        );
      })}

      {/* Draggable pieces */}
      {pieces.map(pc => {
        const isDrag  = dragging?.pieceId === pc.id;
        const isWrong = wrongId === pc.id;
        const cx = isDrag ? dragging.cx : pc.cx;
        const cy = isDrag ? dragging.cy : pc.cy;
        const r  = pc.size / 2;

        return (
          <div
            key={pc.id}
            className={[
              'ss-piece',
              isDrag     ? 'ss-piece-drag'    : '',
              isWrong    ? 'ss-piece-wrong'   : '',
              pc.matched ? 'ss-piece-matched' : '',
            ].join(' ')}
            style={{
              width:      pc.size,
              height:     pc.size,
              left:       cx - r,
              top:        cy - r,
              background: pc.color,
              '--glow':   pc.glow,
              transition: isDrag
                ? 'none'
                : 'left .38s cubic-bezier(.2,1.6,.4,1), top .38s cubic-bezier(.2,1.6,.4,1)',
            }}
            onPointerDown={e => {
              e.preventDefault();
              onPointerDown(e, pc.id);
            }}
          />
        );
      })}

      {/* Sparks */}
      {sparks.map(s => (
        <SparkBurst key={s.id} x={s.x} y={s.y} color={s.color} />
      ))}
      </LearningGameShell>
    </div>
  );
}
