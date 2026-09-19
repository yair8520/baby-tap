import { useState, useEffect, useCallback, useRef } from "react";
import {
  IS_TOUCH,
  COMBO_HOT_EMOJIS,
  COMBO_ULTRA_EMOJIS,
} from "../../constants";
import { rand, randInt, nextId } from "../../utils/random.js";
import { getClassicLevelConfig } from "./levels.js";

function isChromeTarget(target) {
  return (
    target?.closest?.(".corner-hold") ||
    target?.closest?.(".start-screen") ||
    target?.closest?.(".settings-wrap")
  );
}

/**
 * Window-level pointer handlers + mouse/touch trail for classic mode.
 */
export function useClassicPointers({
  spawnAt,
  spawnAtRef,
  trackCombo,
  doVibrate,
  scheduleTimeout,
  scheduleInterval,
  activeColorsRef,
}) {
  const [trail, setTrail] = useState([]);

  const touchStartRef = useRef({});
  const isSwipingRef = useRef({});
  const activeTouchPosRef = useRef({});
  const longPressTimerRef = useRef({});
  const longPressIntervalRef = useRef({});
  const mouseLongTimerRef = useRef(null);
  const mouseLongIntervalRef = useRef(null);
  const mousePosRef = useRef(null);
  const lastTapPosRef = useRef(null);

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
            clearTimeout(longPressTimerRef.current[t.identifier]);
            clearInterval(longPressIntervalRef.current[t.identifier]);
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
            750,
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
        700,
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [scheduleTimeout, activeColorsRef]);

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
            longPressIntervalRef.current[t.identifier] = scheduleInterval(
              () => {
                const cur = activeTouchPosRef.current[t.identifier];
                if (cur) {
                  spawnAtRef.current?.(cur.x, cur.y);
                  doVibrate([12]);
                }
              },
              300,
            );
          }
        }, 700);
      });
    },
    [doVibrate, scheduleInterval, scheduleTimeout, spawnAtRef],
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
        clearTimeout(longPressTimerRef.current[t.identifier]);
        clearInterval(longPressIntervalRef.current[t.identifier]);
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
    [doVibrate, spawnAt, trackCombo, scheduleTimeout],
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
    [doVibrate, scheduleInterval, scheduleTimeout, spawnAtRef],
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (isChromeTarget(e.target)) return;
      const wasLong = !!mouseLongIntervalRef.current;
      clearTimeout(mouseLongTimerRef.current);
      clearInterval(mouseLongIntervalRef.current);
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
    [doVibrate, spawnAt, trackCombo, scheduleTimeout],
  );

  const handleMouseMoveLong = useCallback((e) => {
    if (mousePosRef.current)
      mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeaveLong = useCallback(() => {
    clearTimeout(mouseLongTimerRef.current);
    clearInterval(mouseLongIntervalRef.current);
    mouseLongTimerRef.current = null;
    mouseLongIntervalRef.current = null;
    mousePosRef.current = null;
  }, []);

  useEffect(() => {
    if (IS_TOUCH) {
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
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

  return { trail };
}
