import { useState, useEffect, useCallback, useRef } from "react";
import { IS_TOUCH, isWebView, PIANO_KEYS } from "../../constants.js";
import { playPianoNote } from "../../audio.js";
import { buzz } from "../../components/LearningGameShell/vibrate.js";
import "./PianoGame.css";

function getBlackKeyPos(bk, whiteKeys, wKeyWidth) {
  const noteChar = bk.id.slice(0, -1);
  const octave = bk.id.slice(-1);
  const leftWhiteId = noteChar[0] + octave;
  const leftIdx = whiteKeys.findIndex((k) => k.id === leftWhiteId);
  if (leftIdx < 0) return { left: 0, width: 0 };
  const bkWidth = wKeyWidth * 0.6;
  return {
    left: (leftIdx + 1) * wKeyWidth - bkWidth / 2,
    width: bkWidth,
  };
}

function findPianoKey(clientX, clientY, rect) {
  const whiteKeys = PIANO_KEYS.filter((k) => k.type === "white");
  const wKeyWidth = rect.width / whiteKeys.length;
  const wKeyHeight = rect.height;

  const blackKeys = PIANO_KEYS.filter((k) => k.type === "black");
  for (const bk of blackKeys) {
    const bkPos = getBlackKeyPos(bk, whiteKeys, wKeyWidth);
    if (
      clientX >= rect.left + bkPos.left &&
      clientX <= rect.left + bkPos.left + bkPos.width &&
      clientY >= rect.top &&
      clientY <= rect.top + wKeyHeight * 0.62
    )
      return bk;
  }

  const x = clientX - rect.left;
  const wIdx = Math.floor(x / wKeyWidth);
  if (wIdx >= 0 && wIdx < whiteKeys.length) return whiteKeys[wIdx];
  return null;
}

const PIANO_KEY_BY_ID = new Map(PIANO_KEYS.map((k) => [k.id, k]));

function findPianoKeyAtPoint(clientX, clientY, containerEl, rect) {
  const hitEl = document.elementFromPoint(clientX, clientY);
  const keyEl = hitEl?.closest?.(".piano-key");
  if (keyEl && containerEl?.contains(keyEl)) {
    const key = PIANO_KEY_BY_ID.get(keyEl.dataset.keyId);
    if (key) return key;
  }
  return findPianoKey(clientX, clientY, rect);
}

/**
 * Interactive piano keyboard mode.
 */
export default function PianoGame({ lang = "he", vibrateOn = true }) {
  const isHebrewUI = lang === "he";
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [displayedKeys, setDisplayedKeys] = useState(new Set());
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth,
  );
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => Math.min(window.innerWidth, window.innerHeight) <= 900,
  );

  const displayTimerRef = useRef(null);
  const displayDebounceRef = useRef(null);
  const pianoRef = useRef(null);
  const pressedKeysRef = useRef(new Set());

  useEffect(() => {
    pressedKeysRef.current = pressedKeys;
  }, [pressedKeys]);

  useEffect(() => {
    clearTimeout(displayTimerRef.current);
    clearTimeout(displayDebounceRef.current);

    if (pressedKeys.size > 0) {
      const next = new Set(pressedKeys);
      displayDebounceRef.current = setTimeout(() => {
        setDisplayedKeys(next);
      }, 90);
    } else {
      displayTimerRef.current = setTimeout(() => {
        setDisplayedKeys(new Set());
      }, 2000);
    }

    return () => {
      clearTimeout(displayTimerRef.current);
      clearTimeout(displayDebounceRef.current);
    };
  }, [pressedKeys]);

  // Orientation lock (mobile)
  useEffect(() => {
    if (!IS_TOUCH || isWebView) return;
    const orientation = window.screen?.orientation;
    if (!orientation?.lock) return;
    orientation.lock("landscape").catch(() => {});
    return () => {
      orientation?.unlock?.();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsMobileViewport(
        Math.min(window.innerWidth, window.innerHeight) <= 900,
      );
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const handlePianoTouch = useCallback(
    (e) => {
      e.preventDefault();
      if (!pianoRef.current) return;
      const containerEl = pianoRef.current;
      const rect = containerEl.getBoundingClientRect();
      const newPressed = new Set();
      const newDisplayed = new Set(displayedKeys);
      Array.from(e.touches).forEach((t) => {
        const key = findPianoKeyAtPoint(t.clientX, t.clientY, containerEl, rect);
        if (key) {
          newPressed.add(key.id);
          if (!pressedKeysRef.current.has(key.id)) {
            playPianoNote(key.freq);
            buzz([8], vibrateOn);
            newDisplayed.add(key.id);
          }
        }
      });
      if (newDisplayed.size !== displayedKeys.size) {
        clearTimeout(displayTimerRef.current);
        setDisplayedKeys(newDisplayed);
      }
      setPressedKeys(newPressed);
    },
    [displayedKeys, vibrateOn],
  );

  const handlePianoTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (!pianoRef.current) return;
    const containerEl = pianoRef.current;
    const rect = containerEl.getBoundingClientRect();
    const newPressed = new Set();
    Array.from(e.touches).forEach((t) => {
      const key = findPianoKeyAtPoint(t.clientX, t.clientY, containerEl, rect);
      if (key) newPressed.add(key.id);
    });
    setPressedKeys(newPressed);
  }, []);

  const handlePianoMouseDown = useCallback(
    (e) => {
      if (!pianoRef.current) return;
      const containerEl = pianoRef.current;
      const rect = containerEl.getBoundingClientRect();
      const key = findPianoKeyAtPoint(e.clientX, e.clientY, containerEl, rect);
      if (key) {
        playPianoNote(key.freq);
        buzz([8], vibrateOn);
        clearTimeout(displayTimerRef.current);
        setDisplayedKeys(new Set([key.id]));
        setPressedKeys(new Set([key.id]));
      }
    },
    [vibrateOn],
  );

  const handlePianoMouseUp = useCallback(() => {
    setPressedKeys(new Set());
  }, []);

  const shouldForcePianoLandscape =
    isMobileViewport && isPortrait;

  const SOLFEGE = isHebrewUI
    ? { C: "דו", D: "רה", E: "מי", F: "פה", G: "סול", A: "לה", B: "סי" }
    : { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

  return (
    <div
      className={`piano-mode-shell${shouldForcePianoLandscape ? " force-landscape" : ""}`}
    >
      {IS_TOUCH && isPortrait && !shouldForcePianoLandscape && (
        <div className="piano-rotate-hint">
          <div className="piano-rotate-icon">🔄</div>
          <div>
            {isHebrewUI
              ? "סובב את המכשיר לרוחב"
              : "Rotate device to landscape"}
          </div>
        </div>
      )}

      <div className="piano-display">
        {displayedKeys.size > 0 ? (
          Array.from(displayedKeys).map((kid) => {
            const k = PIANO_KEYS.find((p) => p.id === kid);
            if (!k) return null;
            const name =
              (SOLFEGE[k.label] ?? "?") + (k.type === "black" ? "♯" : "");
            return (
              <span key={kid} className="piano-note-label">
                {name}
              </span>
            );
          })
        ) : (
          <span className="piano-display-hint">🎹</span>
        )}
      </div>

      <div
        ref={pianoRef}
        className="piano-container"
        onTouchStart={IS_TOUCH ? handlePianoTouch : undefined}
        onTouchMove={IS_TOUCH ? handlePianoTouch : undefined}
        onTouchEnd={IS_TOUCH ? handlePianoTouchEnd : undefined}
        onMouseDown={IS_TOUCH ? undefined : handlePianoMouseDown}
        onMouseMove={
          IS_TOUCH
            ? undefined
            : (e) => {
                if (e.buttons === 1) handlePianoMouseDown(e);
              }
        }
        onMouseUp={IS_TOUCH ? undefined : handlePianoMouseUp}
        onMouseLeave={IS_TOUCH ? undefined : handlePianoMouseUp}
      >
        {PIANO_KEYS.filter((k) => k.type === "white").map((key, idx, arr) => (
          <div
            key={key.id}
            className={`piano-key white-key${pressedKeys.has(key.id) ? " pressed" : ""}`}
            data-key-id={key.id}
            style={{
              left: `${(idx / arr.length) * 100}%`,
              width: `${100 / arr.length}%`,
            }}
          >
            <span className="piano-key-label">{key.label}</span>
          </div>
        ))}
        {PIANO_KEYS.filter((k) => k.type === "black").map((key) => {
          const whites = PIANO_KEYS.filter((k) => k.type === "white");
          const ww = 100 / whites.length;
          const noteChar = key.id.slice(0, -1);
          const octave = key.id.slice(-1);
          const leftWhiteId = noteChar[0] + octave;
          const leftIdx = whites.findIndex((k) => k.id === leftWhiteId);
          if (leftIdx < 0) return null;
          const leftPct = (leftIdx + 1) * ww - ww * 0.3;
          return (
            <div
              key={key.id}
              className={`piano-key black-key${pressedKeys.has(key.id) ? " pressed" : ""}`}
              data-key-id={key.id}
              style={{ left: `${leftPct}%`, width: `${ww * 0.6}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
