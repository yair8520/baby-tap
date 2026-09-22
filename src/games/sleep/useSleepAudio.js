import { useCallback, useEffect, useRef } from "react";
import { getAudioCtx, unlockAudio } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { usePageVisible } from "../../hooks/usePageVisible.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isBoolean } from "../../storage/validation.js";
import {
  LULLABIES,
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_RECORDINGS,
  SLEEP_SOUND_MODES,
} from "./sleepCatalog.js";
import {
  startAmbientNoise,
  startHeartbeat,
  startLullaby,
} from "./sleepToneEngine.js";

export {
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_SOUND_MODES,
};

const isSleepVolume = (value) =>
  Number.isFinite(value) && value >= 0 && value <= 0.9;

const recordingCache = new Map();

function getRecording(ctx, url) {
  if (!recordingCache.has(url)) {
    const pending = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes))
      .catch((error) => {
        recordingCache.delete(url);
        throw error;
      });
    recordingCache.set(url, pending);
  }
  return recordingCache.get(url);
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

      if (!stillCurrent()) {
        abandonMaster();
        return;
      }

      const recordingUrl = SLEEP_RECORDINGS[mode];
      if (recordingUrl) {
        try {
          const buffer = await getRecording(ctx, recordingUrl);
          if (!stillCurrent()) {
            abandonMaster();
            return;
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(master);
          src.start();
          sleepAudioRef.current = { master, sources: [src] };
          return;
        } catch {
          // Keep the mode audible if offline or audio decoding fails.
        }
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

      sleepAudioRef.current = startAmbientNoise(ctx, master, mode);
    },
    [stopSleepAudio],
  );

  const ensureSleepAudio = useCallback(async () => {
    if (muteRef.current || !sleepEnabled || !pageVisible) return;
    const unlocked = await unlockAudio();
    if (unlocked && !sleepAudioRef.current) {
      await startSleepAudio(sleepSoundMode, sleepVolume);
    }
  }, [pageVisible, sleepEnabled, sleepSoundMode, sleepVolume, startSleepAudio]);

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
    ensureSleepAudio,
  };
}
