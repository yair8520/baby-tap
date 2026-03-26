import { useState, useRef, useEffect, useCallback } from 'react';
import './ShapeMatch.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  { id: 'red',    fill: '#FF3B3B', glow: 'rgba(255,59,59,0.55)'   },
  { id: 'blue',   fill: '#2979FF', glow: 'rgba(41,121,255,0.55)'  },
  { id: 'yellow', fill: '#FFD600', glow: 'rgba(255,214,0,0.55)'   },
  { id: 'green',  fill: '#00C853', glow: 'rgba(0,200,83,0.55)'    },
  { id: 'purple', fill: '#BB44FF', glow: 'rgba(187,68,255,0.55)'  },
  { id: 'orange', fill: '#FF7700', glow: 'rgba(255,119,0,0.55)'   },
];

const SHAPES = ['circle', 'square', 'triangle', 'star', 'hexagon'];

const PIECE_R = 55;  // half-size of draggable piece (px)
const SLOT_R  = 72;  // half-size of slot outline (px)
const SNAP    = 80;  // snap distance (px)

// Fractional [x, y] slot positions per count (as fraction of W / H)
const SLOT_GRIDS = {
  2: [[0.25, 0.38], [0.75, 0.38]],
  3: [[0.2,  0.3 ], [0.8,  0.3 ], [0.5,  0.54]],
  4: [[0.22, 0.24], [0.78, 0.24], [0.22, 0.54], [0.78, 0.54]],
  5: [[0.15, 0.2 ], [0.5,  0.17], [0.85, 0.2 ], [0.28, 0.5 ], [0.72, 0.5 ]],
};

// Fractional [x, y] piece home row positions per count
const PIECE_ROWS = {
  2: [[0.27, 0.83], [0.73, 0.83]],
  3: [[0.2,  0.83], [0.5,  0.83], [0.8,  0.83]],
  4: [[0.15, 0.83], [0.38, 0.83], [0.62, 0.83], [0.85, 0.83]],
  5: [[0.12, 0.83], [0.31, 0.83], [0.5,  0.83], [0.69, 0.83], [0.88, 0.83]],
};

// Level definitions: count = number of pairs, variety = how many shape types allowed
const LEVELS = [
  { count: 2, variety: 1 }, // L1 : 2 circles
  { count: 3, variety: 1 }, // L2 : 3 circles
  { count: 4, variety: 1 }, // L3 : 4 circles
  { count: 2, variety: 2 }, // L4 : 2 — circle + square
  { count: 3, variety: 2 }, // L5 : 3 mixed circle/square
  { count: 4, variety: 2 }, // L6 : 4 mixed
  { count: 3, variety: 3 }, // L7 : + triangle
  { count: 4, variety: 3 }, // L8 : 4 with triangles
  { count: 4, variety: 4 }, // L9 : + star
  { count: 5, variety: 5 }, // L10: all shapes
];

// ─── Shape SVG renderer ───────────────────────────────────────────────────────

function ShapeGeom({ shape, size, fill, stroke, strokeWidth, dash }) {
  const p = {
    fill:           fill        ?? 'none',
    stroke:         stroke      ?? 'none',
    strokeWidth:    strokeWidth ?? 0,
    strokeLinejoin: 'round',
    strokeLinecap:  'round',
    ...(dash ? { strokeDasharray: dash } : {}),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {shape === 'circle'   && <circle cx="50" cy="50" r="43" {...p} />}
      {shape === 'square'   && <rect x="8" y="8" width="84" height="84" rx="12" {...p} />}
      {shape === 'triangle' && <polygon points="50,7 93,89 7,89" {...p} />}
      {shape === 'star'     && <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" {...p} />}
      {shape === 'hexagon'  && <polygon points="50,5 92,27 92,73 50,95 8,73 8,27" {...p} />}
    </svg>
  );
}

// ─── Level builder ────────────────────────────────────────────────────────────

function buildLevel(levelIdx, W, H) {
  const cfg = LEVELS[Math.min(levelIdx, LEVELS.length - 1)];
  const { count, variety } = cfg;
  const availShapes = SHAPES.slice(0, variety);

  // pick random distinct colors
  const colors = [...PALETTE].sort(() => Math.random() - 0.5).slice(0, count);

  // assign shape+color pairs
  const items = colors.map((c, i) => ({
    shape:   availShapes[i % availShapes.length],
    colorId: c.id,
    fill:    c.fill,
    glow:    c.glow,
  }));

  // slots at shuffled grid positions
  const slotGrid  = SLOT_GRIDS[count]  || SLOT_GRIDS[5];
  const pieceGrid = PIECE_ROWS[count]  || PIECE_ROWS[5];

  // shuffle which slot position each item gets
  const slotIdxPerm = [...Array(count).keys()].sort(() => Math.random() - 0.5);

  const slots = items.map((item, i) => ({
    id:     `sl-${i}`,
    ...item,
    cx:     slotGrid[slotIdxPerm[i]][0] * W,
    cy:     slotGrid[slotIdxPerm[i]][1] * H,
    filled: false,
  }));

  // pieces at shuffled piece row positions
  const pieceOrder = [...items].sort(() => Math.random() - 0.5);
  const pieces = pieceOrder.map((item, i) => ({
    id:      `pc-${i}`,
    ...item,
    homeCx:  pieceGrid[i][0] * W,
    homeCy:  pieceGrid[i][1] * H,
    cx:      pieceGrid[i][0] * W,
    cy:      pieceGrid[i][1] * H,
    matched: false,
  }));

  return { slots, pieces };
}

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
            className="sm-spark"
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

  const [levelIdx,   setLevelIdx]   = useState(0);
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
  const [totalStars, setTotalStars] = useState(0);

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
      className="sm-root"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* animated background */}
      <div className="sm-bg" />

      {/* header */}
      <div className="sm-header">
        <button className="sm-btn-exit" onClick={onExit}>✕</button>
        <span className="sm-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="sm-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

      {/* slot outlines */}
      {slots.map(sl => (
        <div
          key={sl.id}
          className={`sm-slot${matchId === sl.id ? ' sm-slot-pop' : ''}`}
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
              'sm-piece',
              isDrag     ? 'sm-piece-drag'    : '',
              isWrong    ? 'sm-piece-wrong'   : '',
              pc.matched ? 'sm-piece-matched' : '',
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
          className="sm-complete"
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          <div className="sm-complete-card">
            <span className="sm-complete-emoji">🎉</span>
            <div className="sm-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="sm-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`sm-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <div className="sm-total-score">
              {lang === 'he'
                ? `סה"כ ⭐ ${totalStars}`
                : `Total ⭐ ${totalStars}`}
            </div>
            <button
              className="sm-btn-next"
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
