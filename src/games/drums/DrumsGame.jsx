import { useState, useCallback, useEffect, useRef } from "react";
import { playDrum } from "../../audio.js";
import { buzz } from "../../components/LearningGameShell/vibrate.js";
import { DRUM_PADS } from "./levels.js";
import { nextId } from "../../utils/random.js";
import "./DrumsGame.css";

/**
 * Drum pad grid mode.
 */
export default function DrumsGame({ vibrateOn = true }) {
  const [drumRipples, setDrumRipples] = useState([]);
  const timeoutIdsRef = useRef(new Set());

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach(clearTimeout);
      timeoutIds.clear();
    };
  }, []);

  const handleDrumTap = useCallback(
    (padType, e) => {
      e.preventDefault();
      e.stopPropagation();
      playDrum(padType);
      buzz([15], vibrateOn);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rippleId = nextId();
      setDrumRipples((prev) => [...prev, { id: rippleId, padType, x, y }]);
      scheduleTimeout(
        () => setDrumRipples((prev) => prev.filter((r) => r.id !== rippleId)),
        400,
      );
    },
    [scheduleTimeout, vibrateOn],
  );

  return (
    <div className="drum-grid">
      {DRUM_PADS.map((pad) => (
        <div
          key={pad.type}
          className="drum-pad"
          style={{ background: pad.bg }}
          onPointerDown={(e) => handleDrumTap(pad.type, e)}
        >
          <span className="drum-pad-emoji">{pad.emoji}</span>
          {drumRipples
            .filter((r) => r.padType === pad.type)
            .map((r) => (
              <div
                key={r.id}
                className="drum-pad-ripple"
                style={{ left: r.x, top: r.y }}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
