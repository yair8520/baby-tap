import { useState } from "react";
import "./ResetProgressControl.css";

/** @import { ResetProgressControlProps } from "./ResetProgressControl.props.js" */

/** @param {ResetProgressControlProps} props */
export function ResetProgressControl({ lang, onReset }) {
  const [confirming, setConfirming] = useState(false);
  const isHe = lang === "he";

  const reset = () => {
    onReset();
    setConfirming(false);
  };

  return (
    <div className="rpc-control">
      <div className="rpc-copy">
        <span className="rpc-title">
          {isHe ? "איפוס התקדמות" : "Reset progress"}
        </span>
        <span className="rpc-description">
          {isHe
            ? "השפה, העיצוב והצלילים יישמרו"
            : "Language, theme and audio settings will be kept"}
        </span>
      </div>

      {confirming ? (
        <div className="rpc-confirm">
          <span className="rpc-warning">
            {isHe ? "למחוק את כל ההתקדמות?" : "Delete all game progress?"}
          </span>
          <div className="rpc-actions">
            <button type="button" className="rpc-cancel" onClick={() => setConfirming(false)}>
              {isHe ? "ביטול" : "Cancel"}
            </button>
            <button type="button" className="rpc-confirm-button" onClick={reset}>
              {isHe ? "כן, לאפס" : "Yes, reset"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="rpc-start" onClick={() => setConfirming(true)}>
          {isHe ? "איפוס…" : "Reset…"}
        </button>
      )}
    </div>
  );
}
