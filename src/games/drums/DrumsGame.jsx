import { useState, useCallback } from "react";
import { canVibrate } from "../../constants";
import { playDrum } from "../../audio.js";
import { DRUM_PADS } from "./levels.js";
import { nextId } from "../../utils/random.js";
import "./DrumsGame.css";

function vibrate(pattern, vibrateOn) {
  if (!vibrateOn) return;
  if (canVibrate) navigator.vibrate(pattern);
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: "vibrate", pattern }),
  );
}

/**
 * Drum pad grid mode.
 */
export default function DrumsGame({ vibrateOn = true }) {
  const [drumRipples, setDrumRipples] = useState([]);

  const handleDrumTap = useCallback(
    (padType, e) => {
      e.preventDefault();
      e.stopPropagation();
      playDrum(padType);
      vibrate([15], vibrateOn);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      const rippleId = nextId();
      setDrumRipples((prev) => [...prev, { id: rippleId, padType, x, y }]);
      setTimeout(
        () => setDrumRipples((prev) => prev.filter((r) => r.id !== rippleId)),
        400,
      );
    },
    [vibrateOn],
  );

  return (
    <div className="drum-grid">
      {DRUM_PADS.map((pad) => (
        <div
          key={pad.type}
          className="drum-pad"
          style={{ background: pad.bg }}
          onTouchStart={(e) => handleDrumTap(pad.type, e)}
          onMouseDown={(e) => handleDrumTap(pad.type, e)}
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
