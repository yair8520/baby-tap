import { useCallback, useEffect, useRef } from "react";
import { getAudioCtx } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { usePageVisible } from "../../hooks/usePageVisible.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isBoolean } from "../../storage/validation.js";
import {
  LULLABIES,
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_OPUS_URLS,
  SLEEP_SOUND_MODES,
} from "./sleepCatalog.js";
import {
  makeNoiseBuffer,
  startHeartbeat,
  startLullaby,
} from "./sleepToneEngine.js";

export {
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_OPUS_URLS,
  SLEEP_SOUND_MODES,
};

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
  const pageVisible = usePageVisible();
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
      nodes.cleanup?.();
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
      const stillCurrent = () =>
        myVersion === sleepAudioVersionRef.current && !muteRef.current;

      const master = ctx.createGain();
      master.gain.value = Math.max(0, Math.min(0.55, volume));
      master.connect(ctx.destination);

      const abandonMaster = () => {
        try {
          master.disconnect();
        } catch {
          // ignore
        }
      };

      const sleepOpusUrl = SLEEP_OPUS_URLS[mode];
      if (sleepOpusUrl) {
        try {
          const buffer = await getSleepOpusBuffer(ctx, sleepOpusUrl);
          if (!stillCurrent()) {
            abandonMaster();
            return;
          }
          if (buffer) {
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            src.connect(master);
            src.start();
            sleepAudioRef.current = { master, sources: [src] };
            return;
          }
        } catch {
          // Fall back to generated ambience when the recording cannot load.
        }
      }

      if (!stillCurrent()) {
        abandonMaster();
        return;
      }

      if (LULLABIES[mode]) {
        const nodes = startLullaby(ctx, master, mode);
        if (nodes) sleepAudioRef.current = nodes;
        else abandonMaster();
        return;
      }

      if (mode === "heartbeat") {
        const nodes = startHeartbeat(ctx, master);
        if (nodes) sleepAudioRef.current = nodes;
        else abandonMaster();
        return;
      }

      if (mode === "wind") {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, "white");
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
      src.buffer = makeNoiseBuffer(ctx, noiseKind);
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
      } else if (mode === "storm") {
        filter1.type = "bandpass";
        filter1.frequency.value = 900;
        filter1.Q.value = 0.55;
        filter2.type = "lowpass";
        filter2.frequency.value = 1400;
        filter2.Q.value = 0.5;
      } else if (mode === "waterfall") {
        filter1.type = "bandpass";
        filter1.frequency.value = 1200;
        filter1.Q.value = 0.45;
        filter2.type = "lowpass";
        filter2.frequency.value = 2400;
        filter2.Q.value = 0.5;
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
      sleepAudioRef.current = {
        master,
        sources: [src],
        extra: [filter1, filter2],
      };
    },
    [stopSleepAudio],
  );

  useEffect(() => {
    if (muteOn || !sleepEnabled || !pageVisible) {
      stopSleepAudio();
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        await startSleepAudio(sleepSoundMode, sleepVolume);
      } catch {
        if (!cancelled) stopSleepAudio();
      }
    })();
    return () => {
      cancelled = true;
      stopSleepAudio();
    };
  }, [
    muteOn,
    sleepEnabled,
    pageVisible,
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
