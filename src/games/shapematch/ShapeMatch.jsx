import { useState, useRef, useEffect, useCallback } from 'react';
import { ShapeGeom } from '../../components/ShapeGeom';
import { LearningGameShell, starsFromMistakes } from '../../components/LearningGameShell';
import {
  PIECE_R,
  SLOT_R,
  SNAP,
  SHAPEMATCH_LEVELS,
  buildLevel,
} from './levels.js';
import { useGameBestStars, useGameLevel } from '../../hooks/useGameProgress.js';
import { useResponsiveGameViewport } from '../../hooks/useResponsiveGameViewport.js';
import { buzz } from '../../components/LearningGameShell/vibrate.js';
import './ShapeMatch.css';

// ─── Spark burst on correct match ─────────────────────────────────────────────

const SPARK_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 360;
  const distance = 50 + ((i * 19) % 36);
  return {
    dx: Math.cos((angle * Math.PI) / 180) * distance,
    dy: Math.sin((angle * Math.PI) / 180) * distance,
    size: 7 + ((i * 5) % 7),
    delay: i * 0.02,
  };
});

function SparkBurst({ x, y, color }) {
  return (
    <>
      {SPARK_PARTICLES.map((particle, i) => (
        <div
          key={i}
          className="shm-spark"
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

export default function ShapeMatch({ onExit, vibrateOn = true }) {
  const containerRef  = useRef(null);
  const { width: w, height: h } = useResponsiveGameViewport(containerRef);
  const [roundKey, setRoundKey] = useState(0);

  const [levelIdx,   setLevelIdx]   = useGameLevel('shapematch', 0, {
    maxLevels: SHAPEMATCH_LEVELS.length,
  });
  const [slots,      setSlots]      = useState([]);
  const [pieces,     setPieces]     = useState([]);
  const [dragging,   setDragging]   = useState(null); // {pieceId, offX, offY, cx, cy}

  const draggingRef  = useRef(null);
  const piecesRef    = useRef([]);
  const slotsRef     = useRef([]);
  const mistakesRef  = useRef(0);
  const completeTimerRef = useRef(null);
  const timeoutIdsRef = useRef(new Set());

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current.clear();
  }, []);

  const [wrongId,    setWrongId]    = useState(null);  // piece shake
  const [matchId,    setMatchId]    = useState(null);  // slot pop
  const [sparks,     setSparks]     = useState([]);    // {id, x, y, color}
  const [mistakes,   setMistakes]   = useState(0);
  const [levelDone,  setLevelDone]  = useState(false);
  const { recordStars, totalStars } = useGameBestStars(
    'shapematch',
    SHAPEMATCH_LEVELS.length,
  );

  // keep refs in sync
  useEffect(() => { piecesRef.current  = pieces;   }, [pieces]);
  useEffect(() => { slotsRef.current   = slots;    }, [slots]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  // build level whenever levelIdx or dimensions change
  useEffect(() => {
    if (!w || !h) return;
    const initializeTimer = scheduleTimeout(() => {
      const { slots: s, pieces: p } = buildLevel(levelIdx, w, h);
      setSlots(s);
      setPieces(p);
      setMistakes(0);
      mistakesRef.current = 0;
      setLevelDone(false);
      setSparks([]);
      draggingRef.current = null;
      setDragging(null);
    }, 0);
    return () => {
      clearTimeout(initializeTimer);
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts, levelIdx, roundKey, w, h, scheduleTimeout]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach(clearTimeout);
      timeoutIds.clear();
    };
  }, []);

  // ── drag handlers ──────────────────────────────────────────────────────────

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

    // find nearest unfilled slot
    let nearest = null, minDist = Infinity;
    for (const sl of slotsRef.current) {
      if (sl.filled) continue;
      const dist = Math.hypot(cx - sl.cx, cy - sl.cy);
      if (dist < minDist) { minDist = dist; nearest = sl; }
    }

    if (nearest && minDist < SNAP) {
      if (nearest.colorId === piece.colorId && nearest.shape === piece.shape) {
        // ✅ correct match
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
        scheduleTimeout(() => setMatchId(null), 700);

        // sparkles
        const sparkId = Date.now() + Math.random();
        setSparks(prev => [...prev, { id: sparkId, x: nearest.cx, y: nearest.cy, color: piece.fill }]);
        scheduleTimeout(() => setSparks(prev => prev.filter(s => s.id !== sparkId)), 900);

        // level complete?
        const matched = piecesRef.current.filter(p => p.matched).length + 1;
        if (matched >= piecesRef.current.length) {
          recordStars(levelIdx, starsFromMistakes(mistakesRef.current));
          completeTimerRef.current = scheduleTimeout(() => setLevelDone(true), 650);
        }
      } else {
        // ❌ wrong match — shake and return home
        buzz([80, 40, 80], vibrateOn);
        setWrongId(pieceId);
        scheduleTimeout(() => setWrongId(null), 520);
        setMistakes(m => m + 1);
        setPieces(prev => prev.map(pc =>
          pc.id === pieceId ? { ...pc, cx: pc.homeCx, cy: pc.homeCy } : pc
        ));
      }
    } else {
      // dropped nowhere — snap back home
      setPieces(prev => prev.map(pc =>
        pc.id === pieceId ? { ...pc, cx: pc.homeCx, cy: pc.homeCy } : pc
      ));
    }
  }, [levelIdx, recordStars, scheduleTimeout, vibrateOn]);

  // ── derived ────────────────────────────────────────────────────────────────

  const starCount = starsFromMistakes(mistakes);
  const levelNum  = levelIdx + 1;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="shm-root"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* animated background */}
      <div className="shm-bg" />

      <LearningGameShell
        levelNum={levelNum}
        totalStars={totalStars}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={() => setLevelIdx(p => p + 1)}
        onReplay={() => setRoundKey(key => key + 1)}
        isLastLevel={levelIdx === SHAPEMATCH_LEVELS.length - 1}
      >
        {/* slot outlines */}
        {slots.map(sl => (
          <div
            key={sl.id}
            className={`shm-slot${matchId === sl.id ? ' sm-slot-pop' : ''}`}
            style={{
              width:  SLOT_R * 2,
              height: SLOT_R * 2,
              left:   sl.cx - SLOT_R,
              top:    sl.cy - SLOT_R,
            }}
          >
            <ShapeGeom
              shape={sl.shape}
              size={SLOT_R * 2}
              fill={sl.filled ? sl.fill + '35' : sl.fill + '18'}
              stroke={sl.fill}
              strokeWidth={sl.filled ? 6 : 11}
            />
          </div>
        ))}

        {/* draggable pieces */}
        {pieces.map(pc => {
          const isDrag  = dragging?.pieceId === pc.id;
          const isWrong = wrongId === pc.id;
          const cx = isDrag ? dragging.cx : pc.cx;
          const cy = isDrag ? dragging.cy : pc.cy;

          return (
            <div
              key={pc.id}
              className={[
                'shm-piece',
                isDrag     ? 'shm-piece-drag'    : '',
                isWrong    ? 'shm-piece-wrong'   : '',
                pc.matched ? 'shm-piece-matched' : '',
              ].join(' ')}
              style={{
                width:      PIECE_R * 2,
                height:     PIECE_R * 2,
                left:       cx - PIECE_R,
                top:        cy - PIECE_R,
                '--glow':   pc.glow,
                transition: isDrag
                  ? 'none'
                  : 'left .38s cubic-bezier(.2,1.6,.4,1), top .38s cubic-bezier(.2,1.6,.4,1)',
              }}
              onPointerDown={e => {
                e.preventDefault();
                onPointerDown(e, pc.id);
              }}
            >
              <ShapeGeom
                shape={pc.shape}
                size={PIECE_R * 2}
                fill={pc.fill}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth={3.5}
              />
            </div>
          );
        })}

        {/* spark particles */}
        {sparks.map(s => (
          <SparkBurst key={s.id} x={s.x} y={s.y} color={s.color} />
        ))}
      </LearningGameShell>
    </div>
  );
}
