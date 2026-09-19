import { Suspense } from "react";
import { getGame } from "../../games/registry.js";
import { useT } from "../../i18n";
import "./ActiveGame.css";

/** Renders the lazily-loaded game for the current mode. */
export function ActiveGame({ gameMode, progressEpoch, ctx }) {
  const t = useT();
  const entry = getGame(gameMode);
  const { Component } = entry;
  const props = entry.props(ctx);

  return (
    <Suspense
      fallback={
        <div className="active-game-loading" role="status" aria-live="polite">
          {t("common.loading")}
        </div>
      }
    >
      <Component key={`${entry.id}-${progressEpoch}`} {...props} />
    </Suspense>
  );
}
