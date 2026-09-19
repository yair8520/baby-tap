import { useState } from "react";
import { getT } from "../../i18n/index.js";
import "./ResetProgressControl.css";

/** @import { ResetProgressControlProps } from "./ResetProgressControl.props.js" */

/** @param {ResetProgressControlProps} props */
export function ResetProgressControl({ lang, onReset }) {
  const [confirming, setConfirming] = useState(false);
  const t = getT(lang);

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
            <button type="button" className="rpc-cancel" onClick={() => setConfirming(false)}>
              {t("progress.cancel")}
            </button>
            <button type="button" className="rpc-confirm-button" onClick={reset}>
              {t("progress.confirm")}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="rpc-start" onClick={() => setConfirming(true)}>
          {t("progress.reset")}
        </button>
      )}
    </div>
  );
}
