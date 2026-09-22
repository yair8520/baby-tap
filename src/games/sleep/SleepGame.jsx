import { useState, useEffect, useRef } from "react";
import { useT } from "../../i18n";
import { useSleepAudio } from "./useSleepAudio.js";
import { SleepPanel } from "./SleepPanel";
import { SleepScene } from "./SleepScene";
import "./SleepGame.css";

/** Sleep / autoshow ambient mode. */
export default function SleepGame({ muteOn = false }) {
  const t = useT();
  const {
    sleepSoundMode,
    setSleepSoundMode,
    sleepVolume,
    setSleepVolume,
    sleepEnabled,
    setSleepEnabled,
    ensureSleepAudio,
  } = useSleepAudio(muteOn);

  const [sleepMenuOpen, setSleepMenuOpen] = useState(true);
  const [sleepMelodiesOpen, setSleepMelodiesOpen] = useState(false);
  const sleepPanelRef = useRef(null);

  useEffect(() => {
    if (!sleepMenuOpen) return;
    const handler = (e) => {
      const target = e.target;
      if (!sleepPanelRef.current) return;
      if (!sleepPanelRef.current.contains(target)) {
        if (target?.closest?.(".sleep-menu-toggle")) return;
        setSleepMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
    };
  }, [sleepMenuOpen]);

  const sceneClass = [
    "sleep-scene",
    `sleep-mode-${sleepSoundMode}`,
    sleepSoundMode === "heartbeat" ? "heartbeat-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sceneClass} onPointerDownCapture={ensureSleepAudio}>
      <SleepScene soundMode={sleepSoundMode} />

      <button
        type="button"
        className="sleep-menu-toggle"
        onPointerUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSleepMenuOpen((v) => !v);
        }}
      >
        {sleepMenuOpen ? t("sleep.hide") : t("sleep.open")}
      </button>

      <SleepPanel
        open={sleepMenuOpen}
        panelRef={sleepPanelRef}
        sleepSoundMode={sleepSoundMode}
        sleepVolume={sleepVolume}
        sleepEnabled={sleepEnabled}
        melodiesOpen={sleepMelodiesOpen}
        onSoundModeChange={(id) => {
          setSleepSoundMode(id);
          if (id.startsWith("lullaby")) setSleepMelodiesOpen(true);
        }}
        onVolumeChange={setSleepVolume}
        onEnabledChange={setSleepEnabled}
        onMelodiesOpenChange={setSleepMelodiesOpen}
        onClose={() => setSleepMenuOpen(false)}
      />
    </div>
  );
}
