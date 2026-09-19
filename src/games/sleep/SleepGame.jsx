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

  return (
    <div className="sleep-scene">
      <SleepScene />

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
        onSoundModeChange={setSleepSoundMode}
        onVolumeChange={setSleepVolume}
        onEnabledChange={setSleepEnabled}
        onMelodiesOpenChange={setSleepMelodiesOpen}
        onClose={() => setSleepMenuOpen(false)}
      />
    </div>
  );
}
