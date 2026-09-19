import { useState, useEffect, useCallback, useRef } from "react";
import { IS_TOUCH, canVibrate } from "../../constants";
import { playSound } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { rand, randInt, nextId } from "../../utils/random.js";
import { getT } from "../../i18n/index.js";
import { getTargetLevelConfig } from "./levels.js";
import "./TargetsGame.css";

function vibrate(pattern, vibrateOn) {
  if (!vibrateOn) return;
  if (canVibrate) navigator.vibrate(pattern);
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: "vibrate", pattern }),
  );
}

/**
 * Targets mode – tap targets before the timer drains.
 */
export default function TargetsGame({
  lang = "he",
  activeEmojis = [],
  vibrateOn = true,
}) {
  const t = getT(lang);
  const [targets, setTargets] = useState([]);
  const [targetScore, setTargetScore] = useState(0);
  const [targetMissed, setTargetMissed] = useState(0);
  const [emojis, setEmojis] = useState([]);

  const targetsRef = useRef([]);
  const targetScoreRef = useRef(0);
  const activeEmojisRef = useRef(activeEmojis);
  const vibrateOnRef = useRef(vibrateOn);
  const mountedRef = useRef(true);
  const spawnTargetRef = useRef(null);

  const [targetHighScore, setTargetHighScore] = useLocalStorage(
    STORAGE_KEYS.targetHighScore,
    0,
  );

  useEffect(() => {
    vibrateOnRef.current = vibrateOn;
  }, [vibrateOn]);
  useEffect(() => {
    activeEmojisRef.current = activeEmojis;
  }, [activeEmojis]);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);
  useEffect(() => {
    targetScoreRef.current = targetScore;
  }, [targetScore]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
    };
  }, []);

  const doVibrate = useCallback((pattern) => {
    vibrate(pattern, vibrateOnRef.current);
  }, []);

  const spawnTarget = useCallback(() => {
    if (!mountedRef.current) return;
    const score = targetScoreRef.current;
    const cfg = getTargetLevelConfig(score);
    const duration = cfg.durationMs;
    const maxTargets = cfg.maxTargets;
    if (targetsRef.current.length >= maxTargets) return;

    const pool = activeEmojisRef.current;
    const size = randInt(cfg.minSize, cfg.maxSize + 1);
    const x = rand(80 + size / 2, window.innerWidth - 80 - size / 2);
    const y = rand(80 + size / 2, window.innerHeight - 80 - size / 2);
    const emoji = pool[randInt(0, pool.length)];
    const hue = randInt(0, 360);
    const id = nextId();

    const removeTimer = setTimeout(() => {
      setTargets((prev) => {
        const still = prev.find((t) => t.id === id && !t.popped);
        if (!still) return prev;
        setTargetMissed((m) => m + 1);
        return prev.filter((t) => t.id !== id);
      });
      setTimeout(() => {
        if (mountedRef.current) spawnTargetRef.current?.();
      }, 800);
    }, duration);

    const target = {
      id,
      x,
      y,
      size,
      emoji,
      hue,
      duration,
      removeTimer,
      popped: false,
    };
    setTargets((prev) => [...prev, target]);
  }, []);

  useEffect(() => {
    spawnTargetRef.current = spawnTarget;
  }, [spawnTarget]);

  useEffect(() => {
    spawnTarget();
    spawnTarget();
    return () => {
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
    };
  }, [spawnTarget]);

  const handleTargetTap = useCallback(
    (target, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (target.popped) return;

      clearTimeout(target.removeTimer);
      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, popped: true } : t)),
      );

      setTargetScore((s) => {
        const next = s + 1;
        setTargetHighScore((hs) => Math.max(hs, next));
        return next;
      });

      playSound("number");
      doVibrate([20]);

      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉"];
      const newEmojis = Array.from({ length: 5 }, () => {
        const id = nextId();
        const emoji = sparkles[randInt(0, sparkles.length)];
        const size = randInt(24, 44);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 110);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - rand(30, 60);
        const rotation = rand(-180, 180);
        const duration = rand(500, 800);
        setTimeout(
          () => setEmojis((prev) => prev.filter((em) => em.id !== id)),
          duration,
        );
        return { id, emoji, x: cx, y: cy, size, dx, dy, rotation, duration };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);

      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== target.id));
        setTimeout(() => {
          if (mountedRef.current) spawnTargetRef.current?.();
        }, 800);
      }, 280);
    },
    [doVibrate, setTargetHighScore],
  );

  return (
    <>
      <div className="target-score">
        {t("targets.score", { score: targetScore, missed: targetMissed })}
        {targetHighScore > 0 && (
          <span className="target-highscore">
            {" "}
            &nbsp;|&nbsp; 🏆 {targetHighScore}
          </span>
        )}
      </div>

      {targets.map((target) => {
        const circumference = 2 * Math.PI * ((target.size + 10) / 2 - 4);
        return (
          <div
            key={target.id}
            className={`target${target.popped ? " target-pop" : ""}`}
            style={{
              left: target.x,
              top: target.y,
              width: target.size,
              height: target.size,
              fontSize: Math.round(target.size * 0.65),
              background: `radial-gradient(circle at 35% 30%, hsl(${target.hue},100%,85%) 0%, hsl(${target.hue},80%,60%) 50%, hsl(${target.hue},70%,40%) 100%)`,
              boxShadow: `0 4px 20px hsl(${target.hue},70%,50%,0.6)`,
            }}
            onTouchEnd={
              IS_TOUCH ? (e) => handleTargetTap(target, e) : undefined
            }
            onMouseUp={
              IS_TOUCH ? undefined : (e) => handleTargetTap(target, e)
            }
          >
            {target.emoji}
            {!target.popped && (
              <svg
                className="target-ring"
                viewBox={`0 0 ${target.size + 10} ${target.size + 10}`}
                style={{
                  width: target.size + 10,
                  height: target.size + 10,
                }}
              >
                <circle
                  cx={(target.size + 10) / 2}
                  cy={(target.size + 10) / 2}
                  r={(target.size + 10) / 2 - 4}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset="0"
                  transform={`rotate(-90 ${(target.size + 10) / 2} ${(target.size + 10) / 2})`}
                  style={{
                    animation: `targetRingDrain ${target.duration}ms linear forwards`,
                    "--circ": circumference,
                  }}
                />
              </svg>
            )}
          </div>
        );
      })}

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
    </>
  );
}
