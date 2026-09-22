import { LULLABIES, lullabyBeatSeconds } from "./lullabies.js";

function makeNoiseBuffer(ctx, kind = "white") {
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "brown") {
      const brown = (lastOut + 0.02 * white) / 1.02;
      lastOut = brown;
      data[i] = brown;
    } else if (kind === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99586 * b1 + white * 0.0750759;
      b2 = 0.99332 * b2 + white * 0.153852;
      const pink = b0 + b1 + b2 + white * 0.3104856;
      data[i] = pink;
    } else {
      data[i] = white;
    }
  }
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const scale = peak > 0 ? 0.72 / peak : 1;
  for (let i = 0; i < length; i++) data[i] *= scale;
  return buffer;
}

/** Lightweight, codec-free ambience tuned for phone speakers. */
export function startAmbientNoise(ctx, master, mode) {
  const kind =
    mode === "ocean" || mode === "brown"
      ? "brown"
      : mode === "pink"
        ? "pink"
        : "white";
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, kind);
  src.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  const colorGain = ctx.createGain();
  const settings = {
    rain: [520, 7200, 0.95],
    ocean: [110, 1500, 1.15],
    wind: [180, 2400, 0.82],
    storm: [90, 3200, 1.0],
    waterfall: [280, 6500, 0.9],
    white: [90, 7600, 0.62],
    pink: [70, 5200, 0.78],
    brown: [70, 2600, 1.15],
  }[mode] || [80, 5000, 0.8];

  highpass.frequency.value = settings[0];
  lowpass.frequency.value = settings[1];
  colorGain.gain.value = settings[2];
  src.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(colorGain);
  colorGain.connect(master);

  const oscillators = [];
  const extra = [highpass, lowpass, colorGain];
  if (["ocean", "wind", "storm"].includes(mode)) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = mode === "ocean" ? 0.11 : mode === "wind" ? 0.07 : 0.045;
    lfoGain.gain.value = mode === "ocean" ? 0.24 : 0.16;
    colorGain.gain.value = settings[2] - lfoGain.gain.value;
    lfo.connect(lfoGain);
    lfoGain.connect(colorGain.gain);
    lfo.start();
    oscillators.push(lfo);
    extra.push(lfoGain);
  }

  src.start();
  return { master, sources: [src], oscillators, extra };
}

/**
 * One-shot oscillators per note (lookahead scheduler).
 * Avoids the shared-oscillator + LFO path that could cancel pitch updates.
 */
export function startLullaby(ctx, master, mode) {
  const song = LULLABIES[mode];
  if (!song?.notes?.length) return null;

  const beat = lullabyBeatSeconds(song);
  let noteIdx = 0;
  let nextTime = ctx.currentTime + 0.05;
  const live = new Set();

  const scheduleAhead = () => {
    const horizon = ctx.currentTime + 0.85;
    while (nextTime < horizon) {
      const entry = song.notes[noteIdx % song.notes.length];
      noteIdx += 1;
      const freq = entry[0];
      const beats = entry[1];
      const slot = Math.max(0.05, beats * beat);
      const dur = slot * 0.82;

      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(master);

        const t = nextTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(song.peakGain, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.06, dur));

        // Soft octave partial for presence on phone speakers
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.value = freq * 2;
        osc2.connect(gain2);
        gain2.connect(master);
        gain2.gain.setValueAtTime(0.0001, t);
        gain2.gain.linearRampToValueAtTime(song.peakGain * 0.22, t + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.05, dur * 0.55));

        osc.start(t);
        osc.stop(t + dur + 0.05);
        osc2.start(t);
        osc2.stop(t + dur * 0.55 + 0.05);
        live.add(osc);
        live.add(osc2);
        osc.onended = () => live.delete(osc);
        osc2.onended = () => live.delete(osc2);
      }

      nextTime += slot;
    }
  };

  scheduleAhead();
  const intervalId = window.setInterval(scheduleAhead, 200);

  return {
    master,
    intervalId,
    oscillators: [],
    sources: [],
    extra: [],
    cleanup: () => {
      live.forEach((node) => {
        try {
          node.stop?.();
          node.disconnect?.();
        } catch {
          // already stopped
        }
      });
      live.clear();
    },
  };
}

/** Audible lub-dub thump (phone-speaker friendly), soft breath bed. */
export function startHeartbeat(ctx, master) {
  const breathSrc = ctx.createBufferSource();
  breathSrc.buffer = makeNoiseBuffer(ctx, "pink");
  breathSrc.loop = true;
  const breathLP = ctx.createBiquadFilter();
  breathLP.type = "lowpass";
  breathLP.frequency.value = 420;
  breathLP.Q.value = 0.35;
  const breathGain = ctx.createGain();
  breathGain.gain.value = 0.004;
  breathSrc.connect(breathLP);
  breathLP.connect(breathGain);
  breathGain.connect(master);
  breathSrc.start();

  const live = new Set();

  const thump = (when, peak) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.16);
    osc.connect(gain);
    gain.connect(master);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
    osc.start(when);
    osc.stop(when + 0.22);
    live.add(osc);
    osc.onended = () => live.delete(osc);

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx, "brown");
    const np = ctx.createBiquadFilter();
    np.type = "lowpass";
    np.frequency.value = 180;
    const ng = ctx.createGain();
    noise.connect(np);
    np.connect(ng);
    ng.connect(master);
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.linearRampToValueAtTime(peak * 0.45, when + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
    noise.start(when);
    noise.stop(when + 0.1);
    live.add(noise);
    noise.onended = () => live.delete(noise);
  };

  const pulse = () => {
    const t = ctx.currentTime + 0.02;
    thump(t, 0.34);
    thump(t + 0.24, 0.22);
  };

  pulse();
  const intervalId = window.setInterval(pulse, 1050);

  return {
    master,
    sources: [breathSrc],
    oscillators: [],
    extra: [breathLP, breathGain],
    intervalId,
    cleanup: () => {
      live.forEach((node) => {
        try {
          node.stop?.();
          node.disconnect?.();
        } catch {
          // already stopped
        }
      });
      live.clear();
    },
  };
}

export { makeNoiseBuffer };
