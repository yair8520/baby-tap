import { useState } from "react";
import { useT } from "../../i18n";
import "./ResetProgressControl.css";

/** Confirm + reset gameplay progress (keeps preferences). */
export function ResetProgressControl({ onReset }) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();

  const reset = () => {
    onReset();
    setConfirming(false);
  };

  return (
    <div className="rpc-control">
      <div className="rpc-copy">
        <span className="rpc-title">{t("progress.title")}</span>
        <span className="rpc-description">{t("progress.description")}</span>
      </div>

      {confirming ? (
        <div className="rpc-confirm">
          <span className="rpc-warning">{t("progress.warning")}</span>
          <div className="rpc-actions">
            <button
              type="button"
              className="rpc-cancel"
              onClick={() => setConfirming(false)}
            >
              {t("progress.cancel")}
            </button>
            <button
              type="button"
              className="rpc-confirm-button"
              onClick={reset}
            >
              {t("progress.confirm")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="rpc-start"
          onClick={() => setConfirming(true)}
        >
          {t("progress.reset")}
        </button>
      )}
    </div>
  );
}
