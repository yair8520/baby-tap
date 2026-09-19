import { useState, useRef, useEffect, useCallback } from 'react';
import { ShapeGeom } from '../../components/ShapeGeom';
import {
  PIECE_R,
  SLOT_R,
  SNAP,
  buildLevel,
} from './levels.js';
import { useGameLevel, useGameStars } from '../../hooks/useGameProgress.js';
import './ShapeMatch.css';

// ─── Spark burst on correct match ─────────────────────────────────────────────

function SparkBurst({ x, y, color }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const dist  = 50 + Math.random() * 35;
        return (
          <div
            key={i}
            className="shm-spark"
            style={{
              left:       x,
              top:        y,
              '--dx':     `${Math.cos((angle * Math.PI) / 180) * dist}px`,
              '--dy':     `${Math.sin((angle * Math.PI) / 180) * dist}px`,
              background: color,
              width:      `${7 + Math.random() * 6}px`,
              height:     `${7 + Math.random() * 6}px`,
              animationDelay: `${i * 0.02}s`,
            }}
          />
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShapeMatch({ onExit, lang = 'he', vibrateOn = true }) {
  const containerRef  = useRef(null);
  const [w, setW]     = useState(window.innerWidth);
  const [h, setH]     = useState(window.innerHeight);

  const [levelIdx,   setLevelIdx]   = useGameLevel('shapematch', 0);
  const [slots,      setSlots]      = useState([]);
  const [pieces,     setPieces]     = useState([]);
  const [dragging,   setDragging]   = useState(null); // {pieceId, offX, offY, cx, cy}

  const draggingRef  = useRef(null);
  const piecesRef    = useRef([]);
  const slotsRef     = useRef([]);
  const mistakesRef  = useRef(0);

  const [wrongId,    setWrongId]    = useState(null);  // piece shake
  const [matchId,    setMatchId]    = useState(null);  // slot pop
  const [sparks,     setSparks]     = useState([]);    // {id, x, y, color}
  const [mistakes,   setMistakes]   = useState(0);
  const [levelDone,  setLevelDone]  = useState(false);
  const [totalStars, setTotalStars] = useGameStars('shapematch', 0);

  // keep refs in sync
  useEffect(() => { piecesRef.current  = pieces;   }, [pieces]);
  useEffect(() => { slotsRef.current   = slots;    }, [slots]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  // measure container once mounted
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setW(r.width);
    setH(r.height);
  }, []);

  // build level whenever levelIdx or dimensions change
  useEffect(() => {
    if (!w || !h) return;
    const { slots: s, pieces: p } = buildLevel(levelIdx, w, h);
    setSlots(s);
    setPieces(p);
    setMistakes(0);
    mistakesRef.current = 0;
    setLevelDone(false);
    setSparks([]);
  }, [levelIdx, w, h]);

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
        if (vibrateOn) navigator.vibrate?.([40, 25, 90]);

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

        // sparkles
        const sparkId = Date.now() + Math.random();
        setSparks(prev => [...prev, { id: sparkId, x: nearest.cx, y: nearest.cy, color: piece.fill }]);
        setTimeout(() => setSparks(prev => prev.filter(s => s.id !== sparkId)), 900);

        // level complete?
        const matched = piecesRef.current.filter(p => p.matched).length + 1;
        if (matched >= piecesRef.current.length) {
          const m = mistakesRef.current;
          const stars = m === 0 ? 3 : m <= 2 ? 2 : 1;
          setTotalStars(prev => prev + stars);
          setTimeout(() => setLevelDone(true), 650);
        }
      } else {
        // ❌ wrong match — shake and return home
        if (vibrateOn) navigator.vibrate?.([80, 40, 80]);
        setWrongId(pieceId);
        setTimeout(() => setWrongId(null), 520);
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
  }, [vibrateOn]);

  // ── derived ────────────────────────────────────────────────────────────────

  const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
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

      {/* header */}
      <div className="shm-header">
        <button className="shm-btn-exit" onClick={onExit}>✕</button>
        <span className="shm-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="shm-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

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

      {/* level complete overlay */}
      {levelDone && (
        <div
          className="shm-complete"
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          <div className="shm-complete-card">
            <span className="shm-complete-emoji">🎉</span>
            <div className="shm-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="shm-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`shm-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <div className="shm-total-score">
              {lang === 'he'
                ? `סה"כ ⭐ ${totalStars}`
                : `Total ⭐ ${totalStars}`}
            </div>
            <button
              className="shm-btn-next"
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
