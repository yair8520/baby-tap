import { useState, useEffect, useCallback, useRef } from "react";
import {
  NUMBER_EMOJIS,
  LETTER_EMOJIS,
  HEBREW_LETTER_EMOJIS,
  SPECIAL_KEY_EMOJIS,
  COMBO_ULTRA_EMOJIS,
} from "../../constants";
import {
  getAudioCtx,
  playMelodyNote,
  getNextMelodyTime,
} from "../../audio.js";
import { PIANO_SONGS } from "../piano/levels.js";
import { rand, randInt, nextId } from "../../utils/random.js";
import { songDisplayName } from "./songUtils.js";

/**
 * Spawn bursts, combo tracking, shake + keyboard → spawn.
 * Pointer handlers live in `useClassicPointers`.
 */
export function useClassicSpawn({
  lang,
  activeEmojis,
  activeColors,
  scheduleTimeout,
  doVibrate,
}) {
  const [emojis, setEmojis] = useState([]);
  const [particles, setParticles] = useState([]);
  const [keyFlash, setKeyFlash] = useState(null);
  const [showIdle, setShowIdle] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [ultraFlash, setUltraFlash] = useState(false);
  const [songName, setSongName] = useState(() =>
    songDisplayName(PIANO_SONGS[0], lang),
  );
  const [showSongName, setShowSongName] = useState(false);

  const idleTimerRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const comboTimerRef = useRef(null);
  const comboRef = useRef(0);
  const songIdxRef = useRef(0);
  const noteIdxRef = useRef(0);
  const songNameTimerRef = useRef(null);
  const spawnAtRef = useRef(null);
  const activeEmojisRef = useRef(activeEmojis);
  const activeColorsRef = useRef(activeColors);

  useEffect(() => {
    activeEmojisRef.current = activeEmojis;
  }, [activeEmojis]);
  useEffect(() => {
    activeColorsRef.current = activeColors;
  }, [activeColors]);

  const resetIdle = useCallback(() => {
    setShowIdle(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = scheduleTimeout(() => setShowIdle(true), 4000);
  }, [scheduleTimeout]);

  useEffect(() => {
    const initializeTimer = scheduleTimeout(resetIdle, 0);
    return () => clearTimeout(initializeTimer);
  }, [resetIdle, scheduleTimeout]);

  const playMelody = useCallback(() => {
    playMelodyNote(
      noteIdxRef,
      songIdxRef,
      setSongName,
      setShowSongName,
      songNameTimerRef,
      lang,
      scheduleTimeout,
    );
  }, [lang, scheduleTimeout]);

  const spawnAt = useCallback(
    (x, y, emojiList = null, isNumber = false, comboScale = 1) => {
      lastSpawnRef.current = Date.now();
      resetIdle();

      const bonus = Math.min(Math.floor((comboScale - 1) * 0.8), 2);
      const count = isNumber ? randInt(2, 3) : randInt(2, 4) + bonus;
      const pool = emojiList || activeEmojisRef.current;
      const baseSize = isNumber ? randInt(85, 130) : randInt(45, 90);

      const newEmojis = Array.from({ length: count }, () => {
        const id = nextId();
        const emoji = pool[randInt(0, pool.length)];
        const size = baseSize + randInt(-8, 12);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(60, 200);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - rand(40, 90);
        const rotation = rand(-270, 270);
        const duration = rand(650, 950);
        scheduleTimeout(
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return { id, emoji, x, y, size, dx, dy, rotation, duration };
      });
      setEmojis((prev) => [...prev.slice(-20), ...newEmojis].slice(-28));

      const burstCount = isNumber ? 10 : 7;
      const colors = activeColorsRef.current;
      const newParticles = Array.from({ length: burstCount }, () => {
        const id = nextId();
        const angle = rand(0, Math.PI * 2);
        const speed = rand(60, isNumber ? 220 : 170);
        scheduleTimeout(
          () => setParticles((prev) => prev.filter((p) => p.id !== id)),
          600,
        );
        return {
          id,
          x,
          y,
          color: colors[randInt(0, colors.length)],
          px: Math.cos(angle) * speed,
          py: Math.sin(angle) * speed,
          size: rand(8, isNumber ? 30 : 24),
          shape: Math.random() > 0.5 ? "circle" : "square",
        };
      });
      setParticles((prev) => [...prev.slice(-28), ...newParticles].slice(-36));

      const ctx = getAudioCtx();
      if (!ctx || getNextMelodyTime() - ctx.currentTime < 0.9) {
        playMelody();
      }
    },
    [resetIdle, playMelody, scheduleTimeout],
  );

  useEffect(() => {
    spawnAtRef.current = spawnAt;
  }, [spawnAt]);

  const trackCombo = useCallback(() => {
    const now = Date.now();
    const gap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;
    comboRef.current = gap < 650 ? Math.min(comboRef.current + 1, 15) : 1;
    const c = comboRef.current;

    if (c === 10) {
      doVibrate([100, 40, 100, 40, 200]);
      setUltraFlash(true);
      scheduleTimeout(() => setUltraFlash(false), 800);
      for (let i = 0; i < 8; i++) {
        scheduleTimeout(
          () =>
            spawnAt(
              rand(60, window.innerWidth - 60),
              rand(60, window.innerHeight - 60),
              COMBO_ULTRA_EMOJIS,
              false,
              8,
            ),
          i * 60,
        );
      }
    }

    if (c >= 2) {
      setCombo(c);
      setShowCombo(true);
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = scheduleTimeout(() => {
        setShowCombo(false);
        comboRef.current = 0;
      }, 900);
    }
    return c;
  }, [spawnAt, doVibrate, scheduleTimeout]);

  useEffect(() => {
    let lastShake = 0;
    const onMotion = (e) => {
      if (document.visibilityState === "hidden") return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2,
      );
      if (mag > 28 && Date.now() - lastShake > 1200) {
        lastShake = Date.now();
        doVibrate([80, 40, 80, 40, 120]);
        for (let i = 0; i < 10; i++) {
          scheduleTimeout(
            () =>
              spawnAt(
                rand(80, window.innerWidth - 80),
                rand(80, window.innerHeight - 80),
                null,
                false,
              ),
            i * 70,
          );
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [spawnAt, doVibrate, scheduleTimeout]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;

      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      const isFKey =
        e.key.startsWith("F") && e.key.length <= 3 && !isNaN(e.key.slice(1));
      const isNav = [
        "Tab",
        "Escape",
        "Backspace",
        "Delete",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
      ].includes(e.key);

      if (hasModifier || isFKey || isNav) {
        e.preventDefault();
        spawnAt(
          rand(120, window.innerWidth - 120),
          rand(120, window.innerHeight - 120),
        );
        return;
      }

      const x = rand(120, window.innerWidth - 120);
      const y = rand(120, window.innerHeight - 120);
      const key = e.key;
      const pool = activeEmojisRef.current;

      if (/^[0-9]$/.test(key)) {
        const num = parseInt(key);
        const emoji = NUMBER_EMOJIS[num];
        const flashId = nextId();
        setKeyFlash({ emoji, id: flashId });
        scheduleTimeout(
          () => setKeyFlash((f) => (f?.id === flashId ? null : f)),
          1100,
        );
        spawnAt(x, y, [emoji], true);
      } else if (HEBREW_LETTER_EMOJIS[key]) {
        spawnAt(x, y, HEBREW_LETTER_EMOJIS[key], false);
      } else if (/^[a-zA-Z]$/.test(key)) {
        const letterEmojis = LETTER_EMOJIS[key.toLowerCase()] || pool;
        spawnAt(x, y, letterEmojis, false);
      } else if (SPECIAL_KEY_EMOJIS[key]) {
        spawnAt(x, y, SPECIAL_KEY_EMOJIS[key], false);
      } else {
        spawnAt(x, y);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [spawnAt, scheduleTimeout]);

  return {
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
  };
}
