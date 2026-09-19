import { useState, useEffect, useCallback, useRef } from "react";
import { getAudioCtx } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isBoolean } from "../../storage/validation.js";
import "./SleepGame.css";

const SLEEP_OPUS_URLS = {
  rain: new URL("../../assets/sounds/small_42-Rain-10min.opus", import.meta.url)
    .href,
  ocean: new URL(
    "../../assets/sounds/small_47-Waves-10min.opus",
    import.meta.url,
  ).href,
  wind: new URL(
    "../../assets/sounds/small_24-Storm-10min.opus",
    import.meta.url,
  ).href,
};

const SLEEP_SOUND_MODES = [
  "rain",
  "ocean",
  "wind",
  "white",
  "pink",
  "brown",
  "heartbeat",
  "lullaby",
  "lullaby2",
  "lullaby3",
];

const isSleepVolume = (value) =>
  Number.isFinite(value) && value >= 0 && value <= 0.9;

const sleepOpusBufferCache = new Map();

async function getSleepOpusBuffer(ctx, url) {
  if (!url) return null;
  if (!sleepOpusBufferCache.has(url)) {
    sleepOpusBufferCache.set(
      url,
      (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
        const ab = await res.arrayBuffer();
        return await ctx.decodeAudioData(ab);
      })(),
    );
  }
  return sleepOpusBufferCache.get(url);
}

/**
 * Sleep / autoshow ambient mode.
 */
export default function SleepGame({ lang = "he", muteOn = false }) {
  const isHebrewUI = lang === "he";
  const [sleepSoundMode, setSleepSoundMode] = useLocalStorage(
    STORAGE_KEYS.sleepSoundMode,
    "rain",
    SLEEP_SOUND_MODES,
  );
  const [sleepVolume, setSleepVolume] = useLocalStorage(
    STORAGE_KEYS.sleepVolume,
    0.5,
    isSleepVolume,
  );
  const [sleepEnabled, setSleepEnabled] = useLocalStorage(
    STORAGE_KEYS.sleepEnabled,
    true,
    isBoolean,
  );
  const [sleepMenuOpen, setSleepMenuOpen] = useState(true);
  const [sleepMelodiesOpen, setSleepMelodiesOpen] = useState(false);

  const sleepPanelRef = useRef(null);
  const sleepAudioRef = useRef(null);
  const sleepAudioVersionRef = useRef(0);
  const muteRef = useRef(muteOn);

  useEffect(() => {
    muteRef.current = muteOn;
  }, [muteOn]);

  const stopSleepAudio = useCallback(() => {
    sleepAudioVersionRef.current += 1;
    const nodes = sleepAudioRef.current;
    if (!nodes) return;
    try {
      if (nodes.intervalId) window.clearInterval(nodes.intervalId);
      nodes.sources?.forEach((s) => {
        try {
          s.stop?.();
          s.disconnect?.();
        } catch {
          // Nodes may already have stopped or disconnected.
        }
      });
      nodes.oscillators?.forEach((o) => {
        try {
          o.stop?.();
          o.disconnect?.();
        } catch {
          // Nodes may already have stopped or disconnected.
        }
      });
      nodes.master?.disconnect?.();
      nodes.extra?.forEach((n) => n.disconnect?.());
    } catch {
      // Cleanup is best-effort because Web Audio node state varies by browser.
    }
    sleepAudioRef.current = null;
  }, []);

  const startSleepAudio = useCallback(
    async (mode, volume) => {
      if (muteRef.current) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();
      stopSleepAudio();

      const myVersion = sleepAudioVersionRef.current;

      const master = ctx.createGain();
      master.gain.value = Math.max(0, Math.min(0.45, volume));
      master.connect(ctx.destination);

      const sleepOpusUrl = SLEEP_OPUS_URLS[mode];
      if (sleepOpusUrl) {
        try {
          const buffer = await getSleepOpusBuffer(ctx, sleepOpusUrl);
          if (!buffer) return;
          if (myVersion !== sleepAudioVersionRef.current) return;
          if (muteRef.current) return;

          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(master);
          src.start();

          sleepAudioRef.current = { master, sources: [src] };
          return;
        } catch {
          // Fall back to generated ambience when the recording cannot load.
        }
      }

      const makeNoiseBuffer = (kind = "white") => {
        const length = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          if (kind === "brown") {
            const brown = (lastOut + 0.02 * white) / 1.02;
            lastOut = brown;
            data[i] = brown * 3.5;
          } else if (kind === "pink") {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99586 * b1 + white * 0.0750759;
            b2 = 0.99332 * b2 + white * 0.153852;
            const pink = b0 + b1 + b2 + white * 0.3104856;
            data[i] = pink * 3.5;
          } else {
            data[i] = white;
          }
        }
        return buffer;
      };

      if (mode === "lullaby" || mode === "lullaby2" || mode === "lullaby3") {
        const sequences = {
          lullaby: [261.63, 293.66, 329.63, 349.23, 329.63, 293.66, 261.63],
          lullaby2: [220.0, 246.94, 261.63, 293.66, 261.63, 246.94, 220.0],
          lullaby3: [196.0, 220.0, 246.94, 261.63, 246.94, 220.0, 196.0],
        };
        const notes = sequences[mode];
        const noteDur = 0.42;

        const osc = ctx.createOscillator();
        osc.type = "sine";
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        const toneLP = ctx.createBiquadFilter();
        toneLP.type = "lowpass";
        toneLP.frequency.value = 850;
        toneLP.Q.value = 0.7;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 4.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 1.6;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(toneLP);
        toneLP.connect(master);

        let idx = 0;
        const scheduleNote = () => {
          const t = ctx.currentTime;
          const f = notes[idx % notes.length];
          idx++;
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.9);
          osc.frequency.setTargetAtTime(f, t + 0.02);
        };

        osc.start();
        lfo.start();
        scheduleNote();
        const iv = window.setInterval(
          scheduleNote,
          Math.max(250, Math.round(noteDur * 1000)),
        );
        sleepAudioRef.current = {
          master,
          oscillators: [osc, lfo],
          extra: [gain, toneLP, lfoGain],
          intervalId: iv,
        };
        return;
      }

      if (mode === "heartbeat") {
        const heartOsc = ctx.createOscillator();
        const heartGain = ctx.createGain();
        const heartLP = ctx.createBiquadFilter();
        heartLP.type = "lowpass";
        heartLP.frequency.value = 280;
        heartLP.Q.value = 0.65;
        heartOsc.type = "sine";
        heartOsc.frequency.value = 62;
        heartGain.gain.value = 0.0001;
        heartOsc.connect(heartGain);
        heartGain.connect(heartLP);
        heartLP.connect(master);
        heartOsc.start();

        const breathSrc = ctx.createBufferSource();
        breathSrc.buffer = makeNoiseBuffer("pink");
        breathSrc.loop = true;
        const breathLP = ctx.createBiquadFilter();
        breathLP.type = "lowpass";
        breathLP.frequency.value = 520;
        breathLP.Q.value = 0.3;
        const breathGain = ctx.createGain();
        breathGain.gain.value = 0.006;
        const breathLFO = ctx.createOscillator();
        breathLFO.type = "sine";
        breathLFO.frequency.value = 0.09;
        const breathLFOGain = ctx.createGain();
        breathLFOGain.gain.value = 0.012;
        breathLFO.connect(breathLFOGain);
        breathLFOGain.connect(breathGain.gain);
        breathSrc.connect(breathLP);
        breathLP.connect(breathGain);
        breathGain.connect(master);
        breathSrc.start();
        breathLFO.start();

        const pulse = () => {
          const t = ctx.currentTime;
          heartGain.gain.cancelScheduledValues(t);
          heartGain.gain.setValueAtTime(0.001, t);
          heartGain.gain.linearRampToValueAtTime(0.22, t + 0.04);
          heartGain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
          heartGain.gain.linearRampToValueAtTime(0.12, t + 0.23);
          heartGain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
        };
        pulse();
        const iv = window.setInterval(pulse, 980);
        sleepAudioRef.current = {
          master,
          sources: [breathSrc],
          oscillators: [heartOsc, breathLFO],
          extra: [heartGain, heartLP, breathLP, breathGain, breathLFOGain],
          intervalId: iv,
        };
        return;
      }

      if (mode === "wind") {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer("white");
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 450;
        bp.Q.value = 0.6;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 260;
        lfo.connect(lfoGain);
        lfoGain.connect(bp.frequency);
        src.connect(bp);
        bp.connect(master);
        src.start();
        lfo.start();
        sleepAudioRef.current = {
          master,
          sources: [src],
          oscillators: [lfo],
          extra: [bp, lfoGain],
        };
        return;
      }

      const noiseKind =
        mode === "ocean" || mode === "brown"
          ? "brown"
          : mode === "pink"
            ? "pink"
            : "white";

      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(noiseKind);
      src.loop = true;
      const filter1 = ctx.createBiquadFilter();
      const filter2 = ctx.createBiquadFilter();

      if (mode === "rain") {
        filter1.type = "bandpass";
        filter1.frequency.value = 1700;
        filter1.Q.value = 0.75;
        filter2.type = "lowpass";
        filter2.frequency.value = 800;
        filter2.Q.value = 0.6;
      } else if (mode === "ocean") {
        filter1.type = "bandpass";
        filter1.frequency.value = 260;
        filter1.Q.value = 0.5;
        filter2.type = "lowpass";
        filter2.frequency.value = 520;
        filter2.Q.value = 0.6;
      } else if (mode === "white") {
        filter1.type = "lowpass";
        filter1.frequency.value = 1100;
        filter1.Q.value = 0.6;
        filter2.type = "highpass";
        filter2.frequency.value = 80;
        filter2.Q.value = 0.5;
      } else if (mode === "pink") {
        filter1.type = "lowpass";
        filter1.frequency.value = 900;
        filter1.Q.value = 0.7;
        filter2.type = "highpass";
        filter2.frequency.value = 60;
        filter2.Q.value = 0.5;
      } else if (mode === "brown") {
        filter1.type = "lowpass";
        filter1.frequency.value = 650;
        filter1.Q.value = 0.8;
        filter2.type = "highpass";
        filter2.frequency.value = 40;
        filter2.Q.value = 0.5;
      } else {
        filter1.type = "lowpass";
        filter1.frequency.value = 850;
        filter1.Q.value = 0.7;
        filter2.type = "highpass";
        filter2.frequency.value = 70;
        filter2.Q.value = 0.5;
      }

      src.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(master);
      src.start();
      sleepAudioRef.current = { master, sources: [src], extra: [filter1, filter2] };
    },
    [stopSleepAudio],
  );

  useEffect(() => {
    if (muteOn || !sleepEnabled) {
      stopSleepAudio();
      return;
    }
    startSleepAudio(sleepSoundMode, sleepVolume);
    return () => stopSleepAudio();
  }, [
    muteOn,
    sleepEnabled,
    sleepSoundMode,
    sleepVolume,
    startSleepAudio,
    stopSleepAudio,
  ]);

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
      <div className="sleep-gradient" />
      <div className="sleep-moon" />
      <div className="sleep-stars" />
      <div className="sleep-falling-stars" aria-hidden="true">
        {[
          { emoji: "⭐", dx: -18 },
          { emoji: "🌟", dx: 22 },
          { emoji: "✨", dx: -14 },
          { emoji: "⭐", dx: 18 },
          { emoji: "🌟", dx: -10 },
        ].map((s, i) => {
          const left = 10 + i * 18;
          const delay = i * 2.6;
          const dur = 10.5 + (i % 3) * 1.6;
          return (
            <div
              key={i}
              className="sleep-falling-star"
              style={{
                left: `${left}%`,
                top: "-12%",
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
                "--dx-mid": `${s.dx * 0.5}vw`,
                "--dx-end": `${s.dx}vw`,
              }}
            >
              {s.emoji}
            </div>
          );
        })}
      </div>
      <div className="sleep-cloud sleep-cloud-1" />
      <div className="sleep-cloud sleep-cloud-2" />
      <div className="sleep-cloud sleep-cloud-3" />

      <div className="sleep-falling-sheep" aria-hidden="true">
        {[
          {
            emoji: "🐑",
            left: 18,
            delay: 0.8,
            dur: 12.5,
            dxMid: -12,
            dxEnd: -22,
            shuf: true,
          },
          {
            emoji: "🐏",
            left: 42,
            delay: 3.4,
            dur: 13.5,
            dxMid: 10,
            dxEnd: 24,
            shuf: false,
          },
          {
            emoji: "🐑",
            left: 64,
            delay: 6.2,
            dur: 12.8,
            dxMid: -8,
            dxEnd: -18,
            shuf: true,
          },
          {
            emoji: "🐑",
            left: 82,
            delay: 9.1,
            dur: 14.2,
            dxMid: 14,
            dxEnd: 30,
            shuf: false,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`sleep-falling-sheep-emoji${s.shuf ? " shuf" : ""}`}
            style={{
              left: `${s.left}%`,
              top: "-12%",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              "--dx-mid": `${s.dxMid}vw`,
              "--dx-end": `${s.dxEnd}vw`,
            }}
          >
            {s.emoji}
          </div>
        ))}
      </div>

      <button
        className="sleep-menu-toggle"
        onPointerUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSleepMenuOpen((v) => !v);
        }}
      >
        {sleepMenuOpen
          ? isHebrewUI
            ? "סגור 🌙"
            : "Hide 🌙"
          : isHebrewUI
            ? "פתח 🌙"
            : "Open 🌙"}
      </button>

      {sleepMenuOpen && (
        <div
          className="sleep-panel"
          ref={sleepPanelRef}
          dir={isHebrewUI ? "rtl" : "ltr"}
        >
          <div className="sleep-title">
            {isHebrewUI ? "מצב שינה" : "Sleep mode"}
          </div>
          <div className="sleep-subtitle">
            {isHebrewUI
              ? "רקע עדין להרגעת תינוק"
              : "Gentle night ambience for baby"}
          </div>

          <div className="sleep-control-row">
            <button
              className={`sleep-action-btn${sleepEnabled ? " active" : ""}`}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSleepEnabled((v) => !v);
              }}
            >
              {sleepEnabled
                ? isHebrewUI
                  ? "⏸ עצור"
                  : "⏸ Pause"
                : isHebrewUI
                  ? "▶️ נגן"
                  : "▶️ Play"}
            </button>
            <button
              className="sleep-action-btn"
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSleepEnabled(false);
                setSleepMenuOpen(false);
              }}
            >
              {isHebrewUI ? "⏹ כבה" : "⏹ Off"}
            </button>
          </div>

          <div className="sleep-section-label">
            {isHebrewUI ? "רעש לבן" : "White noise"}
          </div>
          <div className="sleep-noise-grid">
            {[
              {
                id: "rain",
                emoji: "🌧️",
                label: isHebrewUI ? "גשם עדין" : "Soft rain",
              },
              {
                id: "ocean",
                emoji: "🌊",
                label: isHebrewUI ? "גלי ים" : "Ocean waves",
              },
              {
                id: "wind",
                emoji: "🍃",
                label: isHebrewUI ? "רוח לילה" : "Night wind",
              },
              {
                id: "white",
                emoji: "🌫️",
                label: isHebrewUI ? "לבן רך" : "Soft white",
              },
              {
                id: "pink",
                emoji: "🩵",
                label: isHebrewUI ? "ורוד רך" : "Pink soft",
              },
              {
                id: "brown",
                emoji: "🌲",
                label: isHebrewUI ? "חום עמוק" : "Deep brown",
              },
              {
                id: "heartbeat",
                emoji: "💗",
                label: isHebrewUI ? "דופק רגוע" : "Heartbeat",
              },
            ].map((s) => (
              <button
                key={s.id}
                className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
                onPointerUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSleepSoundMode(s.id);
                  setSleepEnabled(true);
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <div className="sleep-melodies-toggle-row">
            <button
              className="sleep-melodies-toggle"
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSleepMelodiesOpen((v) => !v);
              }}
            >
              {sleepMelodiesOpen
                ? isHebrewUI
                  ? "מנגינות - פתוח ✅"
                  : "Melodies - Open ✅"
                : isHebrewUI
                  ? "מנגינות +"
                  : "Melodies +"}
            </button>
          </div>

          {sleepMelodiesOpen && (
            <div className="sleep-noise-grid sleep-melodies-grid">
              {[
                {
                  id: "lullaby",
                  emoji: "🎵",
                  label: isHebrewUI ? "מנגינה 1" : "Melody 1",
                },
                {
                  id: "lullaby2",
                  emoji: "🎶",
                  label: isHebrewUI ? "מנגינה 2" : "Melody 2",
                },
                {
                  id: "lullaby3",
                  emoji: "🎼",
                  label: isHebrewUI ? "מנגינה 3" : "Melody 3",
                },
              ].map((s) => (
                <button
                  key={s.id}
                  className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSleepSoundMode(s.id);
                    setSleepEnabled(true);
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="sleep-volume-row">
            <span>{isHebrewUI ? "עוצמה" : "Volume"}</span>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={sleepVolume}
              onChange={(e) => setSleepVolume(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
