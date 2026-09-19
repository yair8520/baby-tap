import { useState, useEffect, useCallback, useRef } from "react";
import {
  IS_TOUCH,
  NUMBER_EMOJIS,
  LETTER_EMOJIS,
  HEBREW_LETTER_EMOJIS,
  SPECIAL_KEY_EMOJIS,
  COMBO_HOT_EMOJIS,
  COMBO_ULTRA_EMOJIS,
} from "../../constants.js";
import { buzz } from "../../components/LearningGameShell/vibrate.js";
import {
  getAudioCtx,
  playMelodyNote,
  nextMelodyTime,
  MAX_MELODY_QUEUE,
  resetMelodyTimeline,
} from "../../audio.js";
import {
  getClassicLevelConfig,
  COMBO_GAP_MS,
  IDLE_TIMEOUT_MS,
  PARTICLE_LIFE_MS,
  TRAIL_LIFE_MS,
  SPAWN_THROTTLE_MS,
} from "./levels.js";
import { PIANO_SONGS } from "../piano/levels.js";
import { rand, randInt, nextId } from "../../utils/random.js";
import "./ClassicGame.css";

function songDisplayName(song, lang = "he") {
  if (!song?.name) return "";
  if (typeof song.name === "string") return song.name;
  return song.name[lang] || song.name.he || song.name.en || "";
}

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
  const [emojis, setEmojis] = useState([]);
  const [particles, setParticles] = useState([]);
  const [trail, setTrail] = useState([]);
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
  const touchStartRef = useRef({});
  const isSwipingRef = useRef({});
  const activeTouchPosRef = useRef({});
  const longPressTimerRef = useRef({});
  const longPressIntervalRef = useRef({});
  const mouseLongTimerRef = useRef(null);
  const mouseLongIntervalRef = useRef(null);
  const mousePosRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const comboTimerRef = useRef(null);
  const lastTapPosRef = useRef(null);
  const comboRef = useRef(0);
  const songIdxRef = useRef(0);
  const noteIdxRef = useRef(0);
  const songNameTimerRef = useRef(null);
  const spawnAtRef = useRef(null);
  const vibrateOnRef = useRef(vibrateOn);
  const activeEmojisRef = useRef(activeEmojis);
  const activeColorsRef = useRef(activeColors);
  const timeoutIdsRef = useRef(new Set());
  const intervalIdsRef = useRef(new Set());

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const clearScheduledTimeout = useCallback((id) => {
    if (id == null) return;
    clearTimeout(id);
    timeoutIdsRef.current.delete(id);
  }, []);

  const scheduleInterval = useCallback((callback, delay) => {
    const id = setInterval(callback, delay);
    intervalIdsRef.current.add(id);
    return id;
  }, []);

  const clearScheduledInterval = useCallback((id) => {
    if (id == null) return;
    clearInterval(id);
    intervalIdsRef.current.delete(id);
  }, []);

  useEffect(() => {
    vibrateOnRef.current = vibrateOn;
  }, [vibrateOn]);
  useEffect(() => {
    activeEmojisRef.current = activeEmojis;
  }, [activeEmojis]);
  useEffect(() => {
    activeColorsRef.current = activeColors;
  }, [activeColors]);

  const doVibrate = useCallback((pattern) => {
    buzz(pattern, vibrateOnRef.current);
  }, []);

  const resetIdle = useCallback(() => {
    setShowIdle(false);
    clearScheduledTimeout(idleTimerRef.current);
    idleTimerRef.current = scheduleTimeout(
      () => setShowIdle(true),
      IDLE_TIMEOUT_MS,
    );
  }, [clearScheduledTimeout, scheduleTimeout]);

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
    (
      x,
      y,
      emojiList = null,
      isNumber = false,
      comboScale = 1,
    ) => {
      const nowMs = Date.now();
      if (nowMs - lastSpawnRef.current < SPAWN_THROTTLE_MS) return;
      lastSpawnRef.current = nowMs;
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
      setEmojis((prev) => [...prev, ...newEmojis]);

      const burstCount = isNumber ? 10 : 7;
      const colors = activeColorsRef.current;
      const newParticles = Array.from({ length: burstCount }, () => {
        const id = nextId();
        const angle = rand(0, Math.PI * 2);
        const speed = rand(60, isNumber ? 220 : 170);
        scheduleTimeout(
          () => setParticles((prev) => prev.filter((p) => p.id !== id)),
          PARTICLE_LIFE_MS,
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
      setParticles((prev) => [...prev, ...newParticles]);

      const ctx = getAudioCtx();
      if (!ctx || nextMelodyTime - ctx.currentTime < MAX_MELODY_QUEUE) {
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
    comboRef.current = gap < COMBO_GAP_MS ? Math.min(comboRef.current + 1, 15) : 1;
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
      clearScheduledTimeout(comboTimerRef.current);
      comboTimerRef.current = scheduleTimeout(() => {
        setShowCombo(false);
        comboRef.current = 0;
      }, COMBO_GAP_MS + 250);
    }
    return c;
  }, [spawnAt, doVibrate, scheduleTimeout, clearScheduledTimeout]);

  // Shake detection
  useEffect(() => {
    let lastShake = 0;
    const onMotion = (e) => {
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

  // Mouse/touch trail
  useEffect(() => {
    const onTouchMove = (e) => {
      Array.from(e.touches).forEach((t) => {
        activeTouchPosRef.current[t.identifier] = {
          x: t.clientX,
          y: t.clientY,
        };
        const start = touchStartRef.current[t.identifier];
        if (start) {
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.sqrt(dx * dx + dy * dy) > 12) {
            isSwipingRef.current[t.identifier] = true;
            clearScheduledTimeout(longPressTimerRef.current[t.identifier]);
            clearScheduledInterval(longPressIntervalRef.current[t.identifier]);
            delete longPressTimerRef.current[t.identifier];
            delete longPressIntervalRef.current[t.identifier];
          }
        }
        if (isSwipingRef.current[t.identifier]) {
          const id = nextId();
          const colors = activeColorsRef.current;
          const color = colors[randInt(0, colors.length)];
          const size = rand(18, 42);
          setTrail((prev) => [
            ...prev,
            { id, x: t.clientX, y: t.clientY, color, size, swipe: true },
          ]);
          scheduleTimeout(
            () => setTrail((prev) => prev.filter((tr) => tr.id !== id)),
            TRAIL_LIFE_MS,
          );
        }
      });
    };

    let hue = 0;
    const onMove = (e) => {
      hue = (hue + 12) % 360;
      const id = nextId();
      const size = rand(28, 58);
      const color = `hsl(${hue},100%,62%)`;
      const sparkle = Math.random() < 0.25;
      setTrail((prev) => [
        ...prev.slice(-28),
        { id, x: e.clientX, y: e.clientY, color, size, sparkle },
      ]);
      scheduleTimeout(
        () => setTrail((prev) => prev.filter((t) => t.id !== id)),
        TRAIL_LIFE_MS,
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [scheduleTimeout, clearScheduledTimeout, clearScheduledInterval]);

  // Keyboard
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

  const isChromeTarget = (target) =>
    target?.closest?.(".corner-hold") ||
    target?.closest?.(".start-screen") ||
    target?.closest?.(".settings-wrap");

  const handleTouchStart = useCallback(
    (e) => {
      if (isChromeTarget(e.target)) return;
      Array.from(e.changedTouches).forEach((t) => {
        const pos = { x: t.clientX, y: t.clientY };
        touchStartRef.current[t.identifier] = pos;
        activeTouchPosRef.current[t.identifier] = pos;
        isSwipingRef.current[t.identifier] = false;

        longPressTimerRef.current[t.identifier] = scheduleTimeout(() => {
          if (!isSwipingRef.current[t.identifier]) {
            doVibrate([20]);
            longPressIntervalRef.current[t.identifier] = scheduleInterval(() => {
              const cur = activeTouchPosRef.current[t.identifier];
              if (cur) {
                spawnAtRef.current?.(cur.x, cur.y);
                doVibrate([12]);
              }
            }, 300);
          }
        }, 700);
      });
    },
    [doVibrate, scheduleInterval, scheduleTimeout],
  );

  const handleTouchMove = useCallback((e) => {
    Array.from(e.changedTouches).forEach((t) => {
      activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY };
    });
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (isChromeTarget(e.target)) return;
      Array.from(e.changedTouches).forEach((t) => {
        const wasLongPress = !!longPressIntervalRef.current[t.identifier];
        clearScheduledTimeout(longPressTimerRef.current[t.identifier]);
        clearScheduledInterval(longPressIntervalRef.current[t.identifier]);
        delete longPressTimerRef.current[t.identifier];
        delete longPressIntervalRef.current[t.identifier];

        if (!isSwipingRef.current[t.identifier] && !wasLongPress) {
          const now = Date.now();
          const lastPos = lastTapPosRef.current;
          const isDoubleTap =
            lastPos &&
            now - lastPos.time < 300 &&
            Math.abs(t.clientX - lastPos.x) < 60 &&
            Math.abs(t.clientY - lastPos.y) < 60;

          lastTapPosRef.current = { x: t.clientX, y: t.clientY, time: now };

          if (isDoubleTap) {
            lastTapPosRef.current = null;
            doVibrate([60, 30, 100]);
            for (let i = 0; i < 5; i++) {
              scheduleTimeout(
                () =>
                  spawnAt(
                    t.clientX + rand(-80, 80),
                    t.clientY + rand(-80, 80),
                    null,
                    false,
                    5,
                  ),
                i * 55,
              );
            }
          } else {
            const c = trackCombo();
            doVibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22]);
            const pool =
              c >= getClassicLevelConfig(c).comboThresholds.ultra
                ? COMBO_ULTRA_EMOJIS
                : c >= getClassicLevelConfig(c).comboThresholds.hot
                  ? COMBO_HOT_EMOJIS
                  : null;
            spawnAt(t.clientX, t.clientY, pool, false, c);
          }
        }

        delete touchStartRef.current[t.identifier];
        delete activeTouchPosRef.current[t.identifier];
        delete isSwipingRef.current[t.identifier];
      });
    },
    [
      doVibrate,
      spawnAt,
      trackCombo,
      scheduleTimeout,
      clearScheduledTimeout,
      clearScheduledInterval,
    ],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (isChromeTarget(e.target)) return;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      mouseLongTimerRef.current = scheduleTimeout(() => {
        doVibrate([20]);
        mouseLongIntervalRef.current = scheduleInterval(() => {
          const p = mousePosRef.current;
          if (p) {
            spawnAtRef.current?.(p.x, p.y);
            doVibrate([12]);
          }
        }, 300);
      }, 700);
    },
    [doVibrate, scheduleInterval, scheduleTimeout],
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (isChromeTarget(e.target)) return;
      const wasLong = !!mouseLongIntervalRef.current;
      clearScheduledTimeout(mouseLongTimerRef.current);
      clearScheduledInterval(mouseLongIntervalRef.current);
      mouseLongTimerRef.current = null;
      mouseLongIntervalRef.current = null;
      if (!wasLong && mousePosRef.current) {
        const now = Date.now();
        const last = lastTapPosRef.current;
        const isDouble =
          last &&
          now - last.time < 300 &&
          Math.abs(e.clientX - last.x) < 60 &&
          Math.abs(e.clientY - last.y) < 60;
        lastTapPosRef.current = { x: e.clientX, y: e.clientY, time: now };
        if (isDouble) {
          lastTapPosRef.current = null;
          doVibrate([60, 30, 100]);
          for (let i = 0; i < 5; i++) {
            scheduleTimeout(
              () =>
                spawnAt(
                  e.clientX + rand(-80, 80),
                  e.clientY + rand(-80, 80),
                  null,
                  false,
                  5,
                ),
              i * 55,
            );
          }
        } else {
          const c = trackCombo();
          doVibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22]);
          const pool =
            c >= getClassicLevelConfig(c).comboThresholds.ultra
              ? COMBO_ULTRA_EMOJIS
              : c >= getClassicLevelConfig(c).comboThresholds.hot
                ? COMBO_HOT_EMOJIS
                : null;
          spawnAt(e.clientX, e.clientY, pool, false, c);
        }
      }
      mousePosRef.current = null;
    },
    [
      doVibrate,
      spawnAt,
      trackCombo,
      scheduleTimeout,
      clearScheduledTimeout,
      clearScheduledInterval,
    ],
  );

  const handleMouseMoveLong = useCallback((e) => {
    if (mousePosRef.current)
      mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeaveLong = useCallback(() => {
    clearScheduledTimeout(mouseLongTimerRef.current);
    clearScheduledInterval(mouseLongIntervalRef.current);
    mouseLongTimerRef.current = null;
    mouseLongIntervalRef.current = null;
    mousePosRef.current = null;
  }, [clearScheduledTimeout, clearScheduledInterval]);

  // Attach pointer handlers on window so chrome siblings still receive events
  useEffect(() => {
    if (IS_TOUCH) {
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
      return () => {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMoveLong);
    window.addEventListener("mouseleave", handleMouseLeaveLong);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMoveLong);
      window.removeEventListener("mouseleave", handleMouseLeaveLong);
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseMoveLong,
    handleMouseLeaveLong,
  ]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    const intervalIds = intervalIdsRef.current;
    return () => {
      timeoutIds.forEach(clearTimeout);
      intervalIds.forEach(clearInterval);
      timeoutIds.clear();
      intervalIds.clear();
      resetMelodyTimeline();
    };
  }, []);

  return (
    <>
      {ultraFlash && <div className="ultra-flash" />}

      {showCombo &&
        combo >= 2 &&
        (() => {
          const { hot, fire, ultra } =
            getClassicLevelConfig(combo).comboThresholds;
          const tier =
            combo >= ultra
              ? "ultra"
              : combo >= fire
                ? "fire"
                : combo >= hot
                  ? "hot"
                  : "base";
          return (
            <div
              key={combo}
              className={`combo-display ${tier === "ultra" ? "combo-ultra" : tier === "fire" ? "combo-fire" : tier === "hot" ? "combo-hot" : ""}`}
            >
              {tier === "ultra"
                ? comboLabels.ultra
                : tier === "fire"
                  ? comboLabels.fire
                  : tier === "hot"
                    ? "⚡ ×"
                    : "✨ ×"}
              {combo}
            </div>
          );
        })()}

      {showSongName && <div className="song-banner">{songName}</div>}

      {showIdle && (
        <div className="idle-hint">
          <span>👆</span>
        </div>
      )}

      {keyFlash && (
        <div key={keyFlash.id} className="key-flash">
          {keyFlash.emoji}
        </div>
      )}

      {trail.map((t) => (
        <div
          key={t.id}
          className={`trail-dot${t.swipe ? " swipe-trail" : ""}`}
          style={{
            left: t.x,
            top: t.y,
            background: t.swipe
              ? t.color
              : `radial-gradient(circle at 35% 35%, white, ${t.color})`,
            width: t.size,
            height: t.size,
            boxShadow: `0 0 ${t.size * 0.6}px ${t.color}, 0 0 ${t.size * 1.4}px ${t.color}88, 0 0 ${t.size * 2.5}px ${t.color}33`,
          }}
        >
          {t.sparkle && (
            <span
              style={{
                fontSize: t.size * 0.7,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              ✨
            </span>
          )}
        </div>
      ))}

      {emojis.map((item) => (
        <div
          key={item.id}
          className="emoji-item"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            "--dx": `${item.dx}px`,
            "--dy": `${item.dy}px`,
            "--rot": `${item.rotation}deg`,
            "--dur": `${item.duration}ms`,
          }}
        >
          {item.emoji}
        </div>
      ))}

      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.shape}`}
          style={{
            left: p.x,
            top: p.y,
            background: p.color,
            width: p.size,
            height: p.size,
            "--px": `${p.px}px`,
            "--py": `${p.py}px`,
          }}
        />
      ))}
    </>
  );
}
