import { useEffect, useCallback, useRef } from "react";
import { buzz } from "../../components/LearningGameShell/vibrate.js";
import { ClassicEffects } from "./ClassicEffects";
import { useClassicSpawn } from "./useClassicSpawn.js";
import { useClassicPointers } from "./useClassicPointers.js";
import "./ClassicGame.css";

/**
 * Classic tap mode – emoji bursts, combo, trail, keyboard & shake.
 */
export default function ClassicGame({
  lang = "he",
  activeEmojis = [],
  activeColors = [],
  vibrateOn = true,
  comboLabels = { ultra: "👑 ULTRA ×", fire: "🔥 HOT ×" },
}) {
  const vibrateOnRef = useRef(vibrateOn);
  const timeoutIdsRef = useRef(new Set());
  const intervalIdsRef = useRef(new Set());

  useEffect(() => {
    vibrateOnRef.current = vibrateOn;
  }, [vibrateOn]);

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const scheduleInterval = useCallback((callback, delay) => {
    const id = setInterval(callback, delay);
    intervalIdsRef.current.add(id);
    return id;
  }, []);

  const doVibrate = useCallback((pattern) => {
    buzz(pattern, vibrateOnRef.current);
  }, []);

  const {
    emojis,
    particles,
    keyFlash,
    showIdle,
    combo,
    showCombo,
    ultraFlash,
    songName,
    showSongName,
    spawnAt,
    spawnAtRef,
    trackCombo,
    activeColorsRef,
  } = useClassicSpawn({
    lang,
    activeEmojis,
    activeColors,
    scheduleTimeout,
    doVibrate,
  });

  const { trail } = useClassicPointers({
    spawnAt,
    spawnAtRef,
    trackCombo,
    doVibrate,
    scheduleTimeout,
    scheduleInterval,
    activeColorsRef,
  });

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    const intervalIds = intervalIdsRef.current;
    return () => {
      timeoutIds.forEach(clearTimeout);
      intervalIds.forEach(clearInterval);
      timeoutIds.clear();
      intervalIds.clear();
    };
  }, []);

  return (
    <ClassicEffects
      ultraFlash={ultraFlash}
      showCombo={showCombo}
      combo={combo}
      comboLabels={comboLabels}
      showSongName={showSongName}
      songName={songName}
      showIdle={showIdle}
      keyFlash={keyFlash}
      trail={trail}
      emojis={emojis}
      particles={particles}
    />
  );
}
