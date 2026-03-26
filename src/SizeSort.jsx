import { useState, useRef, useEffect, useCallback } from 'react';
import './SizeSort.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  { id: 'coral',   fill: '#FF6B6B', glow: 'rgba(255,107,107,0.6)' },
  { id: 'sky',     fill: '#38BDF8', glow: 'rgba(56,189,248,0.6)'  },
  { id: 'lime',    fill: '#84CC16', glow: 'rgba(132,204,22,0.6)'  },
  { id: 'amber',   fill: '#FBBF24', glow: 'rgba(251,191,36,0.6)'  },
  { id: 'violet',  fill: '#A78BFA', glow: 'rgba(167,139,250,0.6)' },
  { id: 'rose',    fill: '#FB7185', glow: 'rgba(251,113,133,0.6)' },
  { id: 'cyan',    fill: '#22D3EE', glow: 'rgba(34,211,238,0.6)'  },
  { id: 'emerald', fill: '#34D399', glow: 'rgba(52,211,153,0.6)'  },
  { id: 'orange',  fill: '#FF9500', glow: 'rgba(255,149,0,0.6)'   },
  { id: 'pink',    fill: '#EC4899', glow: 'rgba(236,72,153,0.6)'  },
];

// Sizes per count
const SIZES = {
  3: [50, 80, 110],
  4: [45, 68, 90, 112],
  5: [40, 60, 80, 100, 120],
};

// Level definitions: count of circles
const LEVEL_COUNTS = [3, 3, 3, 4, 4, 4, 5, 5, 5, 5];

const SLOT_PAD = 20; // extra px on each side of slot

// ─── Build level ──────────────────────────────────────────────────────────────

function buildLevel(levelIdx, W, H) {
  const count = LEVEL_COUNTS[Math.min(levelIdx, LEVEL_COUNTS.length - 1)];
  const sizes = SIZES[count];
  const color = PALETTE[levelIdx % PALETTE.length];

  // Slot area: top 55% of screen, below header
  const slotAreaTop    = 80;
  const slotAreaBottom = H * 0.55;
  const slotAreaCy     = (slotAreaTop + slotAreaBottom) / 2;

  // Total width needed for slots
  const maxSlotD = sizes[sizes.length - 1] + SLOT_PAD * 2;
  const gap      = 14;
  const totalW   = count * maxSlotD + (count - 1) * gap;
  const startX   = (W - totalW) / 2 + maxSlotD / 2;

  const slots = sizes.map((sz, i) => ({
    id:           `sl-${i}`,
    rank:         i,           // 0 = smallest
    cx:           startX + i * (maxSlotD + gap),
    cy:           slotAreaCy,
    expectedSize: sz,
    slotD:        sz + SLOT_PAD * 2,
    filled:       false,
    color:        color.fill,
    glow:         color.glow,
  }));

  // Pieces — shuffled in bottom area
  const pieceAreaY = H * 0.78;
  const pieceTotalW = sizes.reduce((a, s) => a + s, 0) + (count - 1) * 24;
  const pieceStartX = (W - pieceTotalW) / 2;

  // Calculate piece x positions (left-align within their size)
  const pieceXPositions = [];
  let xCursor = pieceStartX;
  for (let i = 0; i < count; i++) {
    pieceXPositions.push(xCursor + sizes[i] / 2);
    xCursor += sizes[i] + 24;
  }

  // Shuffle piece order
  const shuffledRanks = [...Array(count).keys()].sort(() => Math.random() - 0.5);

  const pieces = shuffledRanks.map((rank, posIdx) => ({
    id:     `pc-${rank}`,
    rank,
    size:   sizes[rank],
    fill:   color.fill,
    glow:   color.glow,
    homeCx: pieceXPositions[posIdx],
    homeCy: pieceAreaY,
    cx:     pieceXPositions[posIdx],
    cy:     pieceAreaY,
    matched: false,
  }));

  return { slots, pieces };
}

// ─── SparkBurst ───────────────────────────────────────────────────────────────

function SparkBurst({ x, y, color }) {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * 360;
        const dist  = 40 + Math.random() * 35;
        return (
          <div
            key={i}
            className="ss-spark"
            style={{
              left:           x,
              top:            y,
              '--dx':         `${Math.cos((angle * Math.PI) / 180) * dist}px`,
              '--dy':         `${Math.sin((angle * Math.PI) / 180) * dist}px`,
              background:     color,
              width:          `${6 + Math.random() * 6}px`,
              height:         `${6 + Math.random() * 6}px`,
              animationDelay: `${i * 0.02}s`,
            }}
          />
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SizeSort({ onExit, lang = 'he', vibrateOn = true }) {
  const containerRef = useRef(null);
  const [W, setW]    = useState(window.innerWidth);
  const [H, setH]    = useState(window.innerHeight);

  const [levelIdx,  setLevelIdx]  = useState(0);
  const [slots,     setSlots]     = useState([]);
  const [pieces,    setPieces]    = useState([]);
  const [dragging,  setDragging]  = useState(null);
  // dragging = { pieceId, offX, offY, cx, cy }

  const [wrongId,   setWrongId]   = useState(null);
  const [matchId,   setMatchId]   = useState(null);
  const [sparks,    setSparks]    = useState([]);
  const [mistakes,  setMistakes]  = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [totalStars,setTotalStars]= useState(0);

  const draggingRef  = useRef(null);
  const piecesRef    = useRef([]);
  const slotsRef     = useRef([]);
  const mistakesRef  = useRef(0);

  useEffect(() => { piecesRef.current   = pieces;   }, [pieces]);
  useEffect(() => { slotsRef.current    = slots;    }, [slots]);
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
    const { slots: s, pieces: p } = buildLevel(levelIdx, W, H);
    setSlots(s);
    setPieces(p);
    setMistakes(0);
    mistakesRef.current = 0;
    setLevelDone(false);
    setSparks([]);
    setWrongId(null);
    setMatchId(null);
  }, [levelIdx, W, H]);

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

        const sparkId = Date.now() + Math.random();
        setSparks(prev => [...prev, { id: sparkId, x: nearest.cx, y: nearest.cy, color: piece.fill }]);
        setTimeout(() => setSparks(prev => prev.filter(s => s.id !== sparkId)), 950);

        const matched = piecesRef.current.filter(p => p.matched).length + 1;
        if (matched >= piecesRef.current.length) {
          const m = mistakesRef.current;
          const stars = m === 0 ? 3 : m <= 2 ? 2 : 1;
          setTotalStars(prev => prev + stars);
          setTimeout(() => setLevelDone(true), 650);
        }
      } else {
        // Wrong slot
        if (vibrateOn) navigator.vibrate?.([80, 40, 80]);
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
  }, [vibrateOn]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
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

      {/* Header */}
      <div className="ss-header">
        <button className="ss-btn-exit" onClick={onExit}>✕</button>
        <span className="ss-level-label">
          {lang === 'he' ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="ss-hdr-stars">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < starCount ? 1 : 0.22 }}>⭐</span>
          ))}
        </span>
      </div>

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
              background: pc.fill,
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

      {/* Level-complete overlay */}
      {levelDone && (
        <div
          className="ss-complete"
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          <div className="ss-complete-card">
            <span className="ss-complete-emoji">🏆</span>
            <div className="ss-complete-title">
              {lang === 'he' ? 'כל הכבוד!' : 'Great job!'}
            </div>
            <div className="ss-complete-stars">
              {[0, 1, 2].map(i => (
                <span key={i} className={`ss-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            <div className="ss-total-score">
              {lang === 'he' ? `סה"כ ⭐ ${totalStars}` : `Total ⭐ ${totalStars}`}
            </div>
            <button
              className="ss-btn-next"
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
