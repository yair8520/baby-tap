import { useCallback, useEffect, useRef } from "react";
import { getAudioCtx } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isBoolean } from "../../storage/validation.js";

export const SLEEP_OPUS_URLS = {
  rain: new URL("../../assets/sounds/small_42-Rain-10min.opus", import.meta.url).href,
  ocean: new URL("../../assets/sounds/small_47-Waves-10min.opus", import.meta.url).href,
  wind: new URL("../../assets/sounds/small_24-Storm-10min.opus", import.meta.url).href,
};

export const SLEEP_SOUND_MODES = [
  "rain", "ocean", "wind", "white", "pink", "brown", "heartbeat",
  "lullaby", "lullaby2", "lullaby3",
];

export const NOISE_SOUNDS = [
  { id: "rain", emoji: "🌧️", i18nKey: "sleep.sounds.rain" },
  { id: "ocean", emoji: "🌊", i18nKey: "sleep.sounds.ocean" },
  { id: "wind", emoji: "🍃", i18nKey: "sleep.sounds.wind" },
  { id: "white", emoji: "🌫️", i18nKey: "sleep.sounds.white" },
  { id: "pink", emoji: "🩵", i18nKey: "sleep.sounds.pink" },
  { id: "brown", emoji: "🌲", i18nKey: "sleep.sounds.brown" },
  { id: "heartbeat", emoji: "💗", i18nKey: "sleep.sounds.heartbeat" },
];

export const MELODY_SOUNDS = [
  { id: "lullaby", emoji: "🎵", i18nKey: "sleep.sounds.lullaby" },
  { id: "lullaby2", emoji: "🎶", i18nKey: "sleep.sounds.lullaby2" },
  { id: "lullaby3", emoji: "🎼", i18nKey: "sleep.sounds.lullaby3" },
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



/** Persisted sleep prefs + Web Audio engine for ambient modes. */
export function useSleepAudio(muteOn = false) {
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

  return {
    sleepSoundMode,
    setSleepSoundMode,
    sleepVolume,
    setSleepVolume,
    sleepEnabled,
    setSleepEnabled,
  };
}
