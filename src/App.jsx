import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import appIcon from "./assets/icon-192.png";
import appIconLarge from "./assets/icon-512.png";
import ShapeMatch from "./ShapeMatch.jsx";
import ColorMix from "./ColorMix.jsx";
import SizeSort from "./SizeSort.jsx";
import ShapeMemory from "./ShapeMemory.jsx";
import PatternGame from "./PatternGame.jsx";

import {
  IS_TOUCH,
  isHebrew as defaultHebrew,
  isWebView,
  canVibrate,
  EMOJIS,
  COLORS,
  SONGS,
  NUMBER_EMOJIS,
  LETTER_EMOJIS,
  HEBREW_LETTER_EMOJIS,
  SPECIAL_KEY_EMOJIS,
  COMBO_HOT_EMOJIS,
  COMBO_ULTRA_EMOJIS,
  DRUM_PADS,
  PIANO_KEYS,
} from "./constants.js";

import {
  getAudioCtx,
  setGlobalMute,
  playSound,
  playMelodyNote,
  playBalloonPop,
  playDrum,
  playPianoNote,
  nextMelodyTime,
} from "./audio.js";

import { useLocalStorage } from "./hooks/useLocalStorage.js";
import SettingsMenu from "./components/SettingsMenu/index.jsx";
import MemoryGame from "./games/memory/MemoryGame.jsx";
import ShapesGame from "./games/shapes/ShapesGame.jsx";

const UI_TEXT = {
  he: {
    emojiRow: "👶🏻 🎉 🌈",
    title: "Baby Tap Game",
    subtitle: "תנו לתינוק ללחוץ על המסך\nולראות קסם צבעוני! ✨",
    btn: "🚀 התחל מסך מלא",
    hint: "ליציאה: לחיצה בפינה הימנית העליונה",
    ultra: "👑 עוצמה ×",
    fire: "🔥 לוהט ×",
  },
  en: {
    emojiRow: "👶🏻 🎉 🌈",
    title: "Baby Tap Game",
    subtitle: "Let the baby tap the screen\nand see colorful magic! ✨",
    btn: "🚀 Start Fullscreen",
    hint: "To exit: tap top-right corner",
    ultra: "👑 ULTRA ×",
    fire: "🔥 HOT ×",
  },
};

// ── Sleep mode: use ONLY uploaded opus tracks ───────────────────────────────
const SLEEP_OPUS_URLS = {
  // Ambient noise modes
  rain: new URL("./assets/sounds/small_42-Rain-10min.opus", import.meta.url).href,
  ocean: new URL("./assets/sounds/small_47-Waves-10min.opus", import.meta.url).href,
  wind: new URL("./assets/sounds/small_24-Storm-10min.opus", import.meta.url).href,
  white: new URL("./assets/sounds/small_32-Waterfall-10min.opus", import.meta.url).href,
  pink: new URL("./assets/sounds/small_32-Waterfall-10min.opus", import.meta.url).href,
  brown: new URL("./assets/sounds/small_32-Waterfall-10min.opus", import.meta.url).href,

  // Melody modes (lullaby buttons) - reuse the same tracks
  lullaby: new URL("./assets/sounds/small_42-Rain-10min.opus", import.meta.url).href,
  lullaby2: new URL("./assets/sounds/small_47-Waves-10min.opus", import.meta.url).href,
  lullaby3: new URL("./assets/sounds/small_32-Waterfall-10min.opus", import.meta.url).href,
};

const sleepOpusBufferCache = new Map(); // url -> Promise<AudioBuffer>

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

const THEME_PRESETS = {
  space: {
    id: "space",
    label: { he: "חלל", en: "Space" },
    emoji: "🚀",
    heroRow: "🚀 🪐 🌙 ✨",
    emojis: ["🚀", "🛸", "🪐", "🌙", "☄️", "⭐", "🌟", "✨", "💫", "🌌", "👨‍🚀", "🛰️"],
    colors: ["#7B2FF7", "#3A86FF", "#00C2FF", "#B5179E", "#8338EC", "#5E60CE", "#4CC9F0"],
  },
  animals: {
    id: "animals",
    label: { he: "חיות", en: "Animals" },
    emoji: "🦁",
    heroRow: "🦁 🐼 🐶 🦋",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐸", "🦁", "🐮", "🐵", "🦋", "🐢", "🦄", "🌈", "⭐"],
    colors: ["#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#A0E7E5"],
  },
  ocean: {
    id: "ocean",
    label: { he: "ים", en: "Ocean" },
    emoji: "🐬",
    heroRow: "🐬 🐠 🌊 🫧",
    emojis: ["🐠", "🐟", "🐬", "🐳", "🐙", "🦀", "🐚", "🌊", "🫧", "⭐", "✨", "💧"],
    colors: ["#00B4D8", "#0077B6", "#48CAE4", "#90E0EF", "#0096C7", "#5E60CE", "#80ED99"],
  },
  farm: {
    id: "farm",
    label: { he: "חווה", en: "Farm" },
    emoji: "🐮",
    heroRow: "🐮 🚜 🌾 🐔",
    emojis: ["🐮", "🐷", "🐔", "🐥", "🐴", "🐑", "🦆", "🌾", "🚜", "🍎", "🍓", "🌻"],
    colors: ["#FFD166", "#EF476F", "#06D6A0", "#118AB2", "#8ECAE6", "#90BE6D", "#F3722C"],
  },
};

// ── Piano helpers (module-level, no React state needed) ───────────────────────
function getBlackKeyPos(bk, whiteKeys, wKeyWidth) {
  const noteChar = bk.id.slice(0, -1);
  const octave = bk.id.slice(-1);
  const leftWhiteId = noteChar[0] + octave;
  const leftIdx = whiteKeys.findIndex((k) => k.id === leftWhiteId);
  if (leftIdx < 0) return { left: 0, width: 0 };
  const bkWidth = wKeyWidth * 0.6;
  return {
    left: (leftIdx + 1) * wKeyWidth - bkWidth / 2,
    width: bkWidth,
  };
}

function findPianoKey(clientX, clientY, rect) {
  const whiteKeys = PIANO_KEYS.filter((k) => k.type === "white");
  const wKeyWidth = rect.width / whiteKeys.length;
  const wKeyHeight = rect.height;

  // First check black keys (they're on top)
  const blackKeys = PIANO_KEYS.filter((k) => k.type === "black");
  for (const bk of blackKeys) {
    const bkPos = getBlackKeyPos(bk, whiteKeys, wKeyWidth);
    if (
      clientX >= rect.left + bkPos.left &&
      clientX <= rect.left + bkPos.left + bkPos.width &&
      clientY >= rect.top &&
      clientY <= rect.top + wKeyHeight * 0.62
    )
      return bk;
  }

  // Then white keys
  const x = clientX - rect.left;
  const wIdx = Math.floor(x / wKeyWidth);
  if (wIdx >= 0 && wIdx < whiteKeys.length) return whiteKeys[wIdx];
  return null;
}

const PIANO_KEY_BY_ID = new Map(PIANO_KEYS.map((k) => [k.id, k]));

function findPianoKeyAtPoint(clientX, clientY, containerEl, rect) {
  const hitEl = document.elementFromPoint(clientX, clientY);
  const keyEl = hitEl?.closest?.(".piano-key");
  if (keyEl && containerEl?.contains(keyEl)) {
    const key = PIANO_KEY_BY_ID.get(keyEl.dataset.keyId);
    if (key) return key;
  }
  // Fallback for edge-cases where elementFromPoint returns null/overlay
  return findPianoKey(clientX, clientY, rect);
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function randInt(a, b) {
  return Math.floor(rand(a, b));
}

let uid = 0;
const nextId = () => ++uid;

// ── Balloon helpers ────────────────────────────────────────────────────────────
// speedFactor: 1 = normal, 2 = twice as fast, etc.
function makeBalloon(speedFactor = 1) {
  const size = randInt(65, 106);
  const hue = randInt(0, 360);
  const sway = rand(-60, 60);
  const rise = rand(6000 / speedFactor, 11000 / speedFactor);
  const floatD = rand(2000, 4000);
  return {
    id: nextId(),
    x: rand(size, window.innerWidth - size),
    y: window.innerHeight + size,
    size,
    color: `hsl(${hue}, 80%, 70%)`,
    colorDark: `hsl(${hue}, 70%, 50%)`,
    sway,
    rise,
    floatD,
    born: Date.now(),
  };
}

// Every LEVEL_STEP pops = one level up; speedFactor grows by 0.3 per level
const BALLOON_LEVEL_STEP = 5;
const getBalloonLevel = (pops) =>
  Math.min(Math.floor(pops / BALLOON_LEVEL_STEP) + 1, 10);
const getBalloonSpeed = (lvl) => 1 + (lvl - 1) * 0.3; // 1.0 → 1.3 → 1.6 …
const getBalloonInterval = (lvl) => Math.max(600, 1200 - (lvl - 1) * 70); // 1200 → 1130 → …

// ── Main component ─────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useLocalStorage("lang", defaultHebrew ? "he" : "en");
  const isHebrewUI = lang === "he";
  const ui = UI_TEXT[lang];
  const [theme, setTheme] = useLocalStorage("theme", "space");
  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.space;
  const activeEmojis = activeTheme.emojis;
  const activeColors = activeTheme.colors;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth,
  );
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => Math.min(window.innerWidth, window.innerHeight) <= 900,
  );
  const [holdProgress, setHoldProgress] = useState(0);
  const [vibrateOn, setVibrateOn] = useLocalStorage("vibrateOn", true);
  const [muteOn, setMuteOn] = useLocalStorage("muteOn", false);
  const [gameMode, setGameMode] = useLocalStorage("gameMode", "classic"); // 'classic' | 'balloons' | 'drums' | 'targets' | 'piano' | 'autoshow' | 'memory' | 'shapes'
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [sleepSoundMode, setSleepSoundMode] = useState("rain");
  const [sleepVolume, setSleepVolume] = useState(0.5);
  const [sleepMenuOpen, setSleepMenuOpen] = useState(true);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [sleepMelodiesOpen, setSleepMelodiesOpen] = useState(false);

  // ── Classic mode state ───────────────────────────────────────────────────────
  const [emojis, setEmojis] = useState([]);
  const [particles, setParticles] = useState([]);
  const [trail, setTrail] = useState([]);
  const [keyFlash, setKeyFlash] = useState(null);
  const [showIdle, setShowIdle] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [ultraFlash, setUltraFlash] = useState(false);
  const [songName, setSongName] = useState(SONGS[0].name);
  const [showSongName, setShowSongName] = useState(false);

  // ── Balloon mode state ───────────────────────────────────────────────────────
  const [balloons, setBalloons] = useState([]);
  const [balloonHint, setBalloonHint] = useState(false);
  const [popCount, setPopCount] = useState(0);
  const [balloonMissed, setBalloonMissed] = useState(0);
  const [balloonLevel, setBalloonLevel] = useState(1);
  const [balloonLevelUp, setBalloonLevelUp] = useState(null); // { level } when flashing
  const balloonLevelRef = useRef(1);
  const balloonsRef = useRef([]);
  // Persist balloon level progress across sessions
  const [balloonSavedLevel, setBalloonSavedLevel] = useLocalStorage("balloonLevel", 1);
  // Persist target high score across sessions
  const [targetHighScore, setTargetHighScore] = useLocalStorage("targetHighScore", 0);

  // ── Drum mode state ──────────────────────────────────────────────────────────
  const [drumRipples, setDrumRipples] = useState([]);

  // ── Piano mode state ──────────────────────────────────────────────────────────
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [displayedKeys, setDisplayedKeys] = useState(new Set());
  const displayTimerRef = useRef(null);
  const displayDebounceRef = useRef(null);

  // ── Target mode state ─────────────────────────────────────────────────────────
  const [targets, setTargets] = useState([]);
  const [targetScore, setTargetScore] = useState(0);
  const [targetMissed, setTargetMissed] = useState(0);
  const targetsRef = useRef([]);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdIntervalRef = useRef(null);
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
  const vibrateRef = useRef(true);
  const muteRef = useRef(false);
  const comboRef = useRef(0);
  const songIdxRef = useRef(0);
  const noteIdxRef = useRef(0);
  const songNameTimerRef = useRef(null);
  const balloonTimerRef = useRef(null);
  const balloonHintTimerRef = useRef(null);
  const lastBalloonPopRef = useRef(Date.now());
  const gameModeRef = useRef("classic");
  const settingsRef = useRef(null);
  const sleepPanelRef = useRef(null);
  const pianoRef = useRef(null);
  const spawnAtRef = useRef(null);
  const targetScoreRef = useRef(0);
  const sleepAudioRef = useRef(null);
  const sleepAudioVersionRef = useRef(0);

  // ── Sync refs ────────────────────────────────────────────────────────────────
  useEffect(() => {
    vibrateRef.current = vibrateOn;
  }, [vibrateOn]);
  useEffect(() => {
    muteRef.current = muteOn;
    setGlobalMute(muteOn);
  }, [muteOn]);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);
  useEffect(() => {
    targetScoreRef.current = targetScore;
  }, [targetScore]);

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
        } catch (_e) {}
      });
      nodes.oscillators?.forEach((o) => {
        try {
          o.stop?.();
          o.disconnect?.();
        } catch (_e) {}
      });
      nodes.master?.disconnect?.();
      nodes.extra?.forEach((n) => n.disconnect?.());
    } catch (_e) {}
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
      // Keep sleep sounds gentle (even if UI slider goes up)
      master.gain.value = Math.max(0, Math.min(0.45, volume));
      master.connect(ctx.destination);

      // Use uploaded opus tracks for ALL sleep modes.
      // If opus decoding fails, fall back to the previous synth logic.
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
        } catch (_e) {}
      }

      const makeNoiseBuffer = (kind = "white") => {
        const length = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        // Pink noise filter states (Paul Kellet-style)
        let b0 = 0, b1 = 0, b2 = 0;
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
        const noteDur = 0.42; // seconds

        const osc = ctx.createOscillator();
        osc.type = "sine";

        const gain = ctx.createGain();
        gain.gain.value = 0.0001;

        // Gentle tone shaping
        const toneLP = ctx.createBiquadFilter();
        toneLP.type = "lowpass";
        toneLP.frequency.value = 850;
        toneLP.Q.value = 0.7;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 4.2;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 1.6; // subtle vibrato

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

          // Fast attack + slow decay = baby-soft envelope
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.9);
          osc.frequency.setTargetAtTime(f, t + 0.02);
        };

        osc.start();
        lfo.start();

        scheduleNote();
        const iv = window.setInterval(scheduleNote, Math.max(250, Math.round(noteDur * 1000)));
        sleepAudioRef.current = {
          master,
          oscillators: [osc, lfo],
          extra: [gain, toneLP, lfoGain],
          intervalId: iv,
        };
        return;
      }

      if (mode === "heartbeat") {
        // Heartbeat: "thump" + gentle breathing noise.
        // This mode is intentionally custom (not opus tracks).
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

        // Breathing: filtered noise modulated by a slow LFO.
        const breathSrc = ctx.createBufferSource();
        breathSrc.buffer = makeNoiseBuffer("pink");
        breathSrc.loop = true;

        const breathLP = ctx.createBiquadFilter();
        breathLP.type = "lowpass";
        breathLP.frequency.value = 520;
        breathLP.Q.value = 0.3;

        const breathGain = ctx.createGain();
        breathGain.gain.value = 0.006; // base breath level

        const breathLFO = ctx.createOscillator();
        breathLFO.type = "sine";
        breathLFO.frequency.value = 0.09; // slow ~ 1 breath every ~11s

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
          // Main thump
          heartGain.gain.linearRampToValueAtTime(0.22, t + 0.04);
          heartGain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
          // Small second beat (so it feels like a "lub-dub")
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
        sleepAudioRef.current = { master, sources: [src], oscillators: [lfo], extra: [bp, lfoGain] };
        return;
      }

      // Default ambient noise modes (white / pink / brown / rain / ocean)
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

      // Keep everything softer by limiting highs.
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
        // Fallback
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

  // Use uploaded app images for site/browser icons.
  useEffect(() => {
    const setHeadIcon = (selector, rel, href, type) => {
      let link = document.head.querySelector(selector);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      if (type) link.setAttribute("type", type);
      link.setAttribute("href", href);
    };

    setHeadIcon('link[rel="icon"]', "icon", appIcon, "image/png");
    setHeadIcon(
      'link[rel="apple-touch-icon"]',
      "apple-touch-icon",
      appIconLarge,
    );
  }, []);

  // ── Piano: pressedKeys ref (avoid stale closures in handlers) ────────────────
  const pressedKeysRef = useRef(new Set());
  useEffect(() => {
    pressedKeysRef.current = pressedKeys;
  }, [pressedKeys]);

  // Keep displayed note for 2s after finger lifts.
  // Also debounce updates to avoid flicker when pressing very fast.
  useEffect(() => {
    clearTimeout(displayTimerRef.current);
    clearTimeout(displayDebounceRef.current);

    if (pressedKeys.size > 0) {
      const next = new Set(pressedKeys);
      displayDebounceRef.current = setTimeout(() => {
        setDisplayedKeys(next);
      }, 90);
    } else {
      displayTimerRef.current = setTimeout(() => {
        setDisplayedKeys(new Set());
      }, 2000);
    }

    return () => {
      clearTimeout(displayTimerRef.current);
      clearTimeout(displayDebounceRef.current);
    };
  }, [pressedKeys]);

  // ── Piano: clear pressed keys when leaving piano mode ────────────────────────
  useEffect(() => {
    if (gameMode !== "piano") setPressedKeys(new Set());
  }, [gameMode]);

  // ── Piano: mobile orientation lock (piano only) ───────────────────────────────
  useEffect(() => {
    if (!isFullscreen || !IS_TOUCH || gameMode !== "piano") return;
    const orientation = window.screen?.orientation;
    if (!orientation?.lock) return;

    orientation.lock("landscape").catch(() => {});
  }, [gameMode, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen || !IS_TOUCH) return;
    if (gameMode === "piano") return;
    const orientation = window.screen?.orientation;
    orientation?.unlock?.();
  }, [gameMode, isFullscreen]);

  // ── Vibrate helper ───────────────────────────────────────────────────────────
  const vibrate = useCallback((pattern) => {
    if (!vibrateRef.current) return;
    if (canVibrate) navigator.vibrate(pattern);
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "vibrate", pattern }),
    );
  }, []);

  // ── Idle timer ───────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    setShowIdle(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setShowIdle(true), 4000);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      clearTimeout(idleTimerRef.current);
      setShowIdle(false);
      setShowSettingsHint(false);
      return;
    }
    resetIdle();
    // Show settings hint 2s after entering fullscreen for first time
    const hintTimer = setTimeout(() => setShowSettingsHint(true), 2000);
    const hideTimer = setTimeout(() => setShowSettingsHint(false), 7000);
    return () => {
      clearTimeout(idleTimerRef.current);
      clearTimeout(hintTimer);
      clearTimeout(hideTimer);
    };
  }, [isFullscreen, resetIdle]);

  // ── Settings panel close-on-outside-click ────────────────────────────────────
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [settingsOpen]);

  // Close sleep (music) menu on outside click/tap
  useEffect(() => {
    if (!sleepMenuOpen) return;
    const handler = (e) => {
      const target = e.target;
      if (!sleepPanelRef.current) return;
      if (!sleepPanelRef.current.contains(target)) {
        // Avoid closing immediately when user taps the toggle itself.
        if (target?.closest?.(".sleep-menu-toggle")) return;
        setSleepMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [sleepMenuOpen]);

  // ── Melody player wrapper ────────────────────────────────────────────────────
  const playMelody = useCallback(() => {
    playMelodyNote(
      noteIdxRef,
      songIdxRef,
      setSongName,
      setShowSongName,
      songNameTimerRef,
    );
  }, []);

  // ── Classic: spawnAt ─────────────────────────────────────────────────────────
  const spawnAt = useCallback(
    (
      x,
      y,
      emojiList = null,
      soundType = "normal",
      isNumber = false,
      comboScale = 1,
    ) => {
      lastSpawnRef.current = Date.now();
      resetIdle();

      const bonus = Math.min(Math.floor((comboScale - 1) * 0.8), 2);
      const count = isNumber ? randInt(2, 3) : randInt(2, 4) + bonus;
      const pool = emojiList || activeEmojis;
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
        setTimeout(
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return { id, emoji, x, y, size, dx, dy, rotation, duration };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);

      const burstCount = isNumber ? 10 : 7;
      const newParticles = Array.from({ length: burstCount }, () => {
        const id = nextId();
        const angle = rand(0, Math.PI * 2);
        const speed = rand(60, isNumber ? 220 : 170);
        setTimeout(
          () => setParticles((prev) => prev.filter((p) => p.id !== id)),
          600,
        );
        return {
          id,
          x,
          y,
          color: activeColors[randInt(0, activeColors.length)],
          px: Math.cos(angle) * speed,
          py: Math.sin(angle) * speed,
          size: rand(8, isNumber ? 30 : 24),
          shape: Math.random() > 0.5 ? "circle" : "square",
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);

      // Only the melody plays — no separate tap beep
      const ctx = getAudioCtx();
      if (!ctx || nextMelodyTime - ctx.currentTime < 0.9) {
        playMelody();
      }
    },
    [resetIdle, playMelody],
  );

  // Keep spawnAtRef in sync for use in intervals/effects without stale closures
  useEffect(() => {
    spawnAtRef.current = spawnAt;
  }, [spawnAt]);

  // ── Classic: combo tracking ──────────────────────────────────────────────────
  const trackCombo = useCallback(() => {
    const now = Date.now();
    const gap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;
    comboRef.current = gap < 650 ? Math.min(comboRef.current + 1, 15) : 1;
    const c = comboRef.current;

    if (c === 10) {
      vibrate([100, 40, 100, 40, 200]);
      setUltraFlash(true);
      setTimeout(() => setUltraFlash(false), 800);
      for (let i = 0; i < 8; i++) {
        setTimeout(
          () =>
            spawnAt(
              rand(60, window.innerWidth - 60),
              rand(60, window.innerHeight - 60),
              COMBO_ULTRA_EMOJIS,
              "normal",
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
      comboTimerRef.current = setTimeout(() => {
        setShowCombo(false);
        comboRef.current = 0;
      }, 900);
    }
    return c;
  }, [spawnAt, vibrate]);

  // ── Classic: shake detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return;
    let lastShake = 0;
    const onMotion = (e) => {
      if (gameModeRef.current !== "classic") return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2,
      );
      if (mag > 28 && Date.now() - lastShake > 1200) {
        lastShake = Date.now();
        vibrate([80, 40, 80, 40, 120]);
        for (let i = 0; i < 10; i++) {
          setTimeout(
            () =>
              spawnAt(
                rand(80, window.innerWidth - 80),
                rand(80, window.innerHeight - 80),
                null,
                "normal",
                false,
              ),
            i * 70,
          );
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [isFullscreen, spawnAt, vibrate]);

  // ── Classic: mouse/touch trail ───────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return;

    const onTouchMove = (e) => {
      if (gameModeRef.current !== "classic") return;
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
          const color = activeColors[randInt(0, activeColors.length)];
          const size = rand(18, 42);
          setTrail((prev) => [
            ...prev,
            { id, x: t.clientX, y: t.clientY, color, size, swipe: true },
          ]);
          setTimeout(
            () => setTrail((prev) => prev.filter((tr) => tr.id !== id)),
            750,
          );
        }
      });
    };

    let hue = 0;
    const onMove = (e) => {
      if (gameModeRef.current !== "classic") return;
      hue = (hue + 12) % 360;
      const id = nextId();
      const size = rand(28, 58);
      const color = `hsl(${hue},100%,62%)`;
      const sparkle = Math.random() < 0.25;
      setTrail((prev) => [
        ...prev.slice(-28),
        { id, x: e.clientX, y: e.clientY, color, size, sparkle },
      ]);
      setTimeout(
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
  }, [isFullscreen]);

  // ── Classic: keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!isFullscreen) return;
      if (gameModeRef.current !== "classic") return;
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

      if (/^[0-9]$/.test(key)) {
        const num = parseInt(key);
        const emoji = NUMBER_EMOJIS[num];
        const flashId = nextId();
        setKeyFlash({ emoji, id: flashId });
        setTimeout(
          () => setKeyFlash((f) => (f?.id === flashId ? null : f)),
          1100,
        );
        spawnAt(x, y, [emoji], "number", true);
      } else if (HEBREW_LETTER_EMOJIS[key]) {
        spawnAt(x, y, HEBREW_LETTER_EMOJIS[key], "normal", false);
      } else if (/^[a-zA-Z]$/.test(key)) {
        const letterEmojis = LETTER_EMOJIS[key.toLowerCase()] || activeEmojis;
        spawnAt(x, y, letterEmojis, "normal", false);
      } else if (SPECIAL_KEY_EMOJIS[key]) {
        spawnAt(x, y, SPECIAL_KEY_EMOJIS[key], "normal", false);
      } else {
        spawnAt(x, y);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [spawnAt, isFullscreen]);

  // ── Fullscreen change listener ───────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Orientation tracker ───────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsMobileViewport(
        Math.min(window.innerWidth, window.innerHeight) <= 900,
      );
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // ── Enter / exit fullscreen ──────────────────────────────────────────────────
  const enterFullscreen = async () => {
    // Request motion permission on iOS Safari.
    // In a React Native WebView, the WebView itself handles motion — skip request.
    // On regular Safari, request once per session and cache the result.
    if (
      !isWebView &&
      typeof DeviceMotionEvent?.requestPermission === "function"
    ) {
      const cached = sessionStorage.getItem("motionPermission");
      if (cached !== "granted") {
        try {
          const result = await DeviceMotionEvent.requestPermission();
          sessionStorage.setItem("motionPermission", result);
        } catch (e) {}
      }
    }
    if (isWebView) {
      setIsFullscreen(true);
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  };

  const exitFullscreen = () => {
    if (isWebView) {
      setIsFullscreen(false);
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "exit" }));
    } else {
      document.fullscreenElement && document.exitFullscreen();
    }
  };

  // ── Corner hold ──────────────────────────────────────────────────────────────
  const handleCornerStart = (e) => {
    e.stopPropagation();
    holdStartRef.current = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - holdStartRef.current) / 1000, 1);
      setHoldProgress(p);
      if (p >= 1) {
        clearInterval(holdIntervalRef.current);
        setHoldProgress(0);
        exitFullscreen();
      }
    }, 30);
  };

  const handleCornerEnd = (e) => {
    e?.stopPropagation();
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  // Keep balloonsRef in sync so hit detection is always synchronous
  useEffect(() => {
    balloonsRef.current = balloons;
  }, [balloons]);

  // Level-up detection: each BALLOON_LEVEL_STEP pops → new level
  useEffect(() => {
    if (gameMode !== "balloons") return;
    const newLevel = getBalloonLevel(popCount);
    if (newLevel > balloonLevelRef.current) {
      balloonLevelRef.current = newLevel;
      setBalloonLevel(newLevel);
      setBalloonLevelUp({ level: newLevel });
      vibrate([60, 30, 80]);
      setTimeout(() => setBalloonLevelUp(null), 2000);
    }
  }, [popCount, gameMode, vibrate]);

  // ── Balloon mode: spawn loop (restarts when level changes) ───────────────────
  useEffect(() => {
    if (!isFullscreen || gameMode !== "balloons") {
      clearInterval(balloonTimerRef.current);
      setBalloons([]);
      setBalloonMissed(0);
      // Save current level before resetting, so next session starts there
      const savedLvl = balloonLevelRef.current;
      if (savedLvl > 1) setBalloonSavedLevel(savedLvl);
      setPopCount(0);
      setBalloonLevel(1);
      balloonLevelRef.current = 1;
      return;
    }
    // Restore saved level on first entry (popCount==0 means fresh start)
    if (balloonLevel === 1 && balloonSavedLevel > 1) {
      const restoredPops = (balloonSavedLevel - 1) * BALLOON_LEVEL_STEP;
      setPopCount(restoredPops);
      setBalloonLevel(balloonSavedLevel);
      balloonLevelRef.current = balloonSavedLevel;
    }
    const speed = getBalloonSpeed(balloonLevel);
    const interval = getBalloonInterval(balloonLevel);
    const maxOnScreen = 6 + balloonLevel; // more balloons at higher levels

    // Spawn 3 balloons immediately so screen isn't empty on entry
    setBalloons([makeBalloon(speed), makeBalloon(speed), makeBalloon(speed)]);
    clearInterval(balloonTimerRef.current);
    balloonTimerRef.current = setInterval(() => {
      setBalloons((prev) => {
        if (prev.length >= maxOnScreen) return prev;
        return [...prev, makeBalloon(speed)];
      });
    }, interval);
    return () => clearInterval(balloonTimerRef.current);
  }, [isFullscreen, gameMode, balloonLevel]);

  // ── Balloon mode: remove balloons that rose off-screen ───────────────────────
  useEffect(() => {
    if (gameMode !== "balloons") return;
    const tick = setInterval(() => {
      const now = Date.now();
      setBalloons((prev) => {
        const expired = prev.filter((b) => now - b.born >= b.rise + 200);
        if (expired.length) setBalloonMissed((m) => m + expired.length);
        return prev.filter((b) => now - b.born < b.rise + 200);
      });
    }, 500);
    return () => clearInterval(tick);
  }, [gameMode]);

  // ── Balloon mode: hint if no pop in 5s ──────────────────────────────────────
  useEffect(() => {
    if (gameMode !== "balloons" || !isFullscreen) {
      setBalloonHint(false);
      return;
    }
    const check = setInterval(() => {
      if (Date.now() - lastBalloonPopRef.current > 5000) {
        setBalloonHint(true);
      } else {
        setBalloonHint(false);
      }
    }, 500);
    return () => clearInterval(check);
  }, [gameMode, isFullscreen]);

  // ── Target mode: difficulty helper ──────────────────────────────────────────
  const getTargetDifficulty = (score) => {
    if (score >= 16) return { duration: 1600, maxTargets: 4 };
    if (score >= 6) return { duration: 2200, maxTargets: 3 };
    return { duration: 3000, maxTargets: 2 };
  };

  // ── Target mode: spawn a single target ──────────────────────────────────────
  const spawnTarget = useCallback(() => {
    const score = targetScoreRef.current;
    const { duration, maxTargets } = getTargetDifficulty(score);
    if (targetsRef.current.length >= maxTargets) return;

    const size = randInt(100, 141);
    const x = rand(80 + size / 2, window.innerWidth - 80 - size / 2);
    const y = rand(80 + size / 2, window.innerHeight - 80 - size / 2);
    const emoji = activeEmojis[randInt(0, activeEmojis.length)];
    const hue = randInt(0, 360);
    const id = nextId();

    const removeTimer = setTimeout(() => {
      // Target expired — remove it and schedule a new spawn after 800ms
      setTargets((prev) => {
        const still = prev.find((t) => t.id === id && !t.popped);
        if (!still) return prev;
        setTargetMissed((m) => m + 1);
        return prev.filter((t) => t.id !== id);
      });
      setTimeout(() => {
        if (gameModeRef.current === "targets") spawnTarget();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Target mode: lifecycle effect ───────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen || gameMode !== "targets") {
      // Clear all pending timers and reset state
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
      setTargets([]);
      setTargetScore(0);
      setTargetMissed(0);
      return;
    }
    // Spawn first targets on enter
    spawnTarget();
    spawnTarget();
    return () => {
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
    };
  }, [isFullscreen, gameMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Target mode: tap handler ─────────────────────────────────────────────────
  const handleTargetTap = useCallback(
    (target, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (target.popped) return;

      // Mark as popped so the expiry timer won't count it as missed
      clearTimeout(target.removeTimer);
      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, popped: true } : t)),
      );

      // Score increment + track high score
      setTargetScore((s) => {
        const next = s + 1;
        setTargetHighScore((hs) => Math.max(hs, next));
        return next;
      });

      // Play sound
      playSound("number");
      vibrate([20]);

      // Sparkle burst at tap position
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
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return { id, emoji, x: cx, y: cy, size, dx, dy, rotation, duration };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);

      // Remove the target after pop animation (250ms), then spawn a replacement after 800ms
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== target.id));
        setTimeout(() => {
          if (gameModeRef.current === "targets") spawnTarget();
        }, 800);
      }, 280);
    },
    [vibrate, spawnTarget],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sleep mode audio engine ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen || gameMode !== "autoshow" || muteOn || !sleepEnabled) {
      stopSleepAudio();
      return;
    }
    startSleepAudio(sleepSoundMode, sleepVolume);
    return () => stopSleepAudio();
  }, [
    gameMode,
    isFullscreen,
    muteOn,
    sleepEnabled,
    sleepSoundMode,
    sleepVolume,
    startSleepAudio,
    stopSleepAudio,
  ]);

  // ── Balloon pop handler ──────────────────────────────────────────────────────
  const popBalloon = useCallback(
    (balloon, clientX, clientY) => {
      setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
      setPopCount((c) => c + 1);
      lastBalloonPopRef.current = Date.now();
      setBalloonHint(false);
      playBalloonPop();
      vibrate([25]);

      // Sparkle emojis
      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉", "💥"];
      const count = randInt(3, 6);
      const newEmojis = Array.from({ length: count }, () => {
        const id = nextId();
        const emoji = sparkles[randInt(0, sparkles.length)];
        const size = randInt(28, 50);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 120);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - rand(30, 70);
        const rotation = rand(-180, 180);
        const duration = rand(500, 800);
        setTimeout(
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return {
          id,
          emoji,
          x: clientX,
          y: clientY,
          size,
          dx,
          dy,
          rotation,
          duration,
        };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);
    },
    [vibrate],
  );

  // ── Balloon direct tap handler (tap the balloon element itself) ───────────────
  const handleBalloonDirectTap = useCallback(
    (balloon, e) => {
      e.preventDefault();
      e.stopPropagation();
      const point = e.touches?.[0] || e.changedTouches?.[0] || e;
      popBalloon(balloon, point.clientX, point.clientY);
    },
    [popBalloon],
  );

  // ── Drum pad tap ─────────────────────────────────────────────────────────────
  const handleDrumTap = useCallback(
    (padType, e) => {
      e.preventDefault();
      e.stopPropagation();
      playDrum(padType);
      vibrate([15]);

      // Ripple
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      const rippleId = nextId();
      setDrumRipples((prev) => [...prev, { id: rippleId, padType, x, y }]);
      setTimeout(
        () => setDrumRipples((prev) => prev.filter((r) => r.id !== rippleId)),
        400,
      );
    },
    [vibrate],
  );

  // ── Classic: touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (gameModeRef.current === "piano") return;
    if (gameModeRef.current !== "classic") return;
    if (
      e.target.closest(".corner-hold") ||
      e.target.closest(".start-screen") ||
      e.target.closest(".settings-wrap")
    )
      return;
    Array.from(e.changedTouches).forEach((t) => {
      const pos = { x: t.clientX, y: t.clientY };
      touchStartRef.current[t.identifier] = pos;
      activeTouchPosRef.current[t.identifier] = pos;
      isSwipingRef.current[t.identifier] = false;

      longPressTimerRef.current[t.identifier] = setTimeout(() => {
        if (!isSwipingRef.current[t.identifier]) {
          vibrate([20]);
          longPressIntervalRef.current[t.identifier] = setInterval(() => {
            const cur = activeTouchPosRef.current[t.identifier];
            if (cur) {
              spawnAt(cur.x, cur.y);
              vibrate([12]);
            }
          }, 300);
        }
      }, 700);
    });
  };

  const handleTouchMove = (e) => {
    Array.from(e.changedTouches).forEach((t) => {
      activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY };
    });
  };

  const handleTouchEnd = (e) => {
    if (gameModeRef.current !== "classic") return;
    if (
      e.target.closest(".corner-hold") ||
      e.target.closest(".start-screen") ||
      e.target.closest(".settings-wrap")
    )
      return;
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
          vibrate([60, 30, 100]);
          for (let i = 0; i < 5; i++) {
            setTimeout(
              () =>
                spawnAt(
                  t.clientX + rand(-80, 80),
                  t.clientY + rand(-80, 80),
                  null,
                  "normal",
                  false,
                  5,
                ),
              i * 55,
            );
          }
        } else {
          const c = trackCombo();
          vibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22]);
          const pool =
            c >= 10 ? COMBO_ULTRA_EMOJIS : c >= 5 ? COMBO_HOT_EMOJIS : null;
          spawnAt(t.clientX, t.clientY, pool, "normal", false, c);
        }
      }

      delete touchStartRef.current[t.identifier];
      delete activeTouchPosRef.current[t.identifier];
      delete isSwipingRef.current[t.identifier];
    });
  };

  // ── Classic: mouse handlers ──────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (gameModeRef.current === "piano") return;
    if (gameModeRef.current !== "classic") return;
    if (
      e.target.closest(".corner-hold") ||
      e.target.closest(".start-screen") ||
      e.target.closest(".settings-wrap")
    )
      return;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    mouseLongTimerRef.current = setTimeout(() => {
      vibrate([20]);
      mouseLongIntervalRef.current = setInterval(() => {
        const p = mousePosRef.current;
        if (p) {
          spawnAt(p.x, p.y);
          vibrate([12]);
        }
      }, 300);
    }, 700);
  };

  const handleMouseUp = (e) => {
    if (e.button !== 0) return;
    if (gameModeRef.current !== "classic") return;
    if (
      e.target.closest(".corner-hold") ||
      e.target.closest(".start-screen") ||
      e.target.closest(".settings-wrap")
    )
      return;
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
        vibrate([60, 30, 100]);
        for (let i = 0; i < 5; i++) {
          setTimeout(
            () =>
              spawnAt(
                e.clientX + rand(-80, 80),
                e.clientY + rand(-80, 80),
                null,
                "normal",
                false,
                5,
              ),
            i * 55,
          );
        }
      } else {
        const c = trackCombo();
        vibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22]);
        const pool =
          c >= 10 ? COMBO_ULTRA_EMOJIS : c >= 5 ? COMBO_HOT_EMOJIS : null;
        spawnAt(e.clientX, e.clientY, pool, "normal", false, c);
      }
    }
    mousePosRef.current = null;
  };

  const handleMouseMoveLong = (e) => {
    if (mousePosRef.current)
      mousePosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseLeaveLong = () => {
    clearTimeout(mouseLongTimerRef.current);
    clearInterval(mouseLongIntervalRef.current);
    mouseLongTimerRef.current = null;
    mouseLongIntervalRef.current = null;
    mousePosRef.current = null;
  };

  // ── Piano: touch/mouse handlers ──────────────────────────────────────────────
  const handlePianoTouch = useCallback(
    (e) => {
      e.preventDefault();
      if (!pianoRef.current) return;
      const containerEl = pianoRef.current;
      const rect = containerEl.getBoundingClientRect();
      const newPressed = new Set();
      const newDisplayed = new Set(displayedKeys);
      Array.from(e.touches).forEach((t) => {
        const key = findPianoKeyAtPoint(t.clientX, t.clientY, containerEl, rect);
        if (key) {
          newPressed.add(key.id);
          if (!pressedKeysRef.current.has(key.id)) {
            playPianoNote(key.freq);
            vibrate([8]);
            newDisplayed.add(key.id);
          }
        }
      });
      if (newDisplayed.size !== displayedKeys.size) {
        clearTimeout(displayTimerRef.current);
        setDisplayedKeys(newDisplayed);
      }
      setPressedKeys(newPressed);
    },
    [displayedKeys, vibrate],
  );

  const handlePianoTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (!pianoRef.current) return;
    const containerEl = pianoRef.current;
    const rect = containerEl.getBoundingClientRect();
    const newPressed = new Set();
    Array.from(e.touches).forEach((t) => {
      const key = findPianoKeyAtPoint(t.clientX, t.clientY, containerEl, rect);
      if (key) newPressed.add(key.id);
    });
    setPressedKeys(newPressed);
  }, []);

  const handlePianoMouseDown = useCallback(
    (e) => {
      if (!pianoRef.current) return;
      const containerEl = pianoRef.current;
      const rect = containerEl.getBoundingClientRect();
      const key = findPianoKeyAtPoint(e.clientX, e.clientY, containerEl, rect);
      if (key) {
        playPianoNote(key.freq);
        vibrate([8]);
        clearTimeout(displayTimerRef.current);
        setDisplayedKeys(new Set([key.id]));
        setPressedKeys(new Set([key.id]));
      }
    },
    [vibrate],
  );

  const handlePianoMouseUp = useCallback(() => {
    setPressedKeys(new Set());
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const C = 2 * Math.PI * 22;
  const shouldForcePianoLandscape =
    isMobileViewport && gameMode === "piano" && isPortrait;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`app theme-${theme}`}
      onTouchStart={IS_TOUCH ? handleTouchStart : undefined}
      onTouchMove={IS_TOUCH ? handleTouchMove : undefined}
      onTouchEnd={IS_TOUCH ? handleTouchEnd : undefined}
      onMouseDown={IS_TOUCH ? undefined : handleMouseDown}
      onMouseUp={IS_TOUCH ? undefined : handleMouseUp}
      onMouseMove={IS_TOUCH ? undefined : handleMouseMoveLong}
      onMouseLeave={IS_TOUCH ? undefined : handleMouseLeaveLong}
    >
      {/* ── Background layers ── */}
      <div className="bg-base" />
      <div className="bg-aurora">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>
      <div className="bg-stars" />
      <div className="bg-bubbles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`bubble bubble-${(i % 4) + 1}`}
            style={{
              left: `${(i * 5.2 + 2) % 100}%`,
              width: `${20 + ((i * 19) % 70)}px`,
              height: `${20 + ((i * 19) % 70)}px`,
              animationDuration: `${13 + ((i * 1.9) % 10)}s`,
              animationDelay: `-${(i * 2.8) % 16}s`,
            }}
          />
        ))}
      </div>
      <div className="theme-symbols">
        {Array.from({ length: 14 }).map((_, i) => {
          const sym = activeEmojis[i % activeEmojis.length];
          return (
            <span
              key={`${theme}-${i}-${sym}`}
              className="theme-symbol"
              style={{
                left: `${(i * 7.1 + 3) % 100}%`,
                animationDuration: `${11 + ((i * 1.7) % 10)}s`,
                animationDelay: `-${(i * 2.1) % 12}s`,
                fontSize: `${20 + ((i * 7) % 22)}px`,
              }}
            >
              {sym}
            </span>
          );
        })}
      </div>

      {/* ── Start Screen ── */}
      {!isFullscreen && (
        <div className="start-screen">
          <div className="start-card" dir={isHebrewUI ? "rtl" : "ltr"}>
            <div className="start-emoji-row">{activeTheme.heroRow || ui.emojiRow}</div>
            <h1 className="start-title">{ui.title}</h1>
            <p className="start-subtitle">
              {ui.subtitle.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </p>
            <button className="start-btn" onClick={enterFullscreen}>
              {ui.btn}
            </button>
            <p className="start-hint">{ui.hint}</p>
            <a
              className="start-privacy-link"
              href="privacy-policy"
              rel="noopener noreferrer"
            >
              {isHebrewUI ? 'פרטיות' : 'Privacy Policy'}
            </a>
          </div>
        </div>
      )}

      {/* ── Game content ── */}
      {isFullscreen && (
        <>
          {/* ── Corner hold to exit (always top-left) ── */}
          <div
            className="corner-hold"
            onTouchStart={handleCornerStart}
            onTouchEnd={handleCornerEnd}
            onMouseDown={handleCornerStart}
            onMouseUp={handleCornerEnd}
            onMouseLeave={handleCornerEnd}
          >
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="rgba(0,0,0,0.35)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
              />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray={`${holdProgress * C} ${C}`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
              <text
                x="26"
                y="32"
                textAnchor="middle"
                fill="white"
                fontSize="18"
              >
                ✕
              </text>
            </svg>
          </div>

          {/* ── Settings gear (top-right) ── */}
          <div className="settings-wrap" ref={settingsRef}>
            <button
              className={`settings-gear-btn${showSettingsHint ? " settings-gear-pulse" : ""}`}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSettingsHint(false);
                setSettingsOpen((o) => !o);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setShowSettingsHint(false);
                setSettingsOpen((o) => !o);
              }}
            >
              ⚙️
            </button>

            {/* First-time hint bubble */}
            {showSettingsHint && !settingsOpen && (
              <div className="settings-hint-bubble">
                {isHebrewUI ? "← הגדרות ומצבים" : "Settings & modes →"}
              </div>
            )}

            {settingsOpen && (
              <SettingsMenu
                lang={lang}
                gameMode={gameMode}
                theme={theme}
                muteOn={muteOn}
                vibrateOn={vibrateOn}
                themePresets={THEME_PRESETS}
                onGameModeChange={setGameMode}
                onLangChange={setLang}
                onThemeChange={setTheme}
                onMuteChange={setMuteOn}
                onVibrateChange={setVibrateOn}
                onClose={() => setSettingsOpen(false)}
              />
            )}
            {/* ── UNUSED OLD PANEL START (kept for reference – remove block below) ── */}
            {false && (
              <div className="settings-panel" dir={isHebrewUI ? "rtl" : "ltr"}>
                {/* Mode row */}
                {/* Mode label */}
                <span className="settings-label">
                  {isHebrewUI ? "בחר מצב" : "Select mode"}
                </span>

                {/* Mode grid 3×2 */}
                {(() => {
                  const modes = [
                    {
                      id: "classic",
                      emoji: "🎮",
                      label: isHebrewUI ? "קלאסי" : "Classic",
                    },
                    {
                      id: "balloons",
                      emoji: "🎈",
                      label: isHebrewUI ? "בלונים" : "Balloons",
                    },
                    {
                      id: "drums",
                      emoji: "🥁",
                      label: isHebrewUI ? "תופים" : "Drums",
                    },
                    {
                      id: "targets",
                      emoji: "🎯",
                      label: isHebrewUI ? "מטרות" : "Targets",
                    },
                    {
                      id: "piano",
                      emoji: "🎹",
                      label: isHebrewUI ? "פסנתר" : "Piano",
                    },
                    {
                      id: "autoshow",
                      emoji: "🌟",
                      label: isHebrewUI ? "שינה" : "Sleep",
                    },
                    {
                      id: "shapes",
                      emoji: "🔵",
                      label: isHebrewUI ? "צורות" : "Shapes",
                    },
                    {
                      id: "colormix",
                      emoji: "🎨",
                      label: isHebrewUI ? "ערבוב" : "Mix Colors",
                    },
                    {
                      id: "sizesort",
                      emoji: "📏",
                      label: isHebrewUI ? "מיון" : "Size Sort",
                    },
                    {
                      id: "memory",
                      emoji: "🧠",
                      label: isHebrewUI ? "זיכרון" : "Memory",
                    },
                    {
                      id: "pattern",
                      emoji: "🔷",
                      label: isHebrewUI ? "דפוס" : "Pattern",
                    },
                  ];
                  return (
                    <div className="settings-mode-grid">
                      {modes.map((m) => (
                        <button
                          key={m.id}
                          className={`settings-mode-btn${gameMode === m.id ? " active" : ""}`}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setGameMode(m.id);
                            setSettingsOpen(false);
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            setGameMode(m.id);
                            setSettingsOpen(false);
                          }}
                        >
                          <span className="mode-emoji">{m.emoji}</span>
                          <span className="mode-label">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="settings-divider" />

                <span className="settings-label">
                  {isHebrewUI ? "שפה" : "Language"}
                </span>
                <div className="settings-mode-grid">
                  {[
                    { id: "he", emoji: "🇮🇱", label: "עברית" },
                    { id: "en", emoji: "🇬🇧", label: "English" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      className={`settings-mode-btn${lang === l.id ? " active" : ""}`}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLang(l.id);
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        setLang(l.id);
                      }}
                    >
                      <span className="mode-emoji">{l.emoji}</span>
                      <span className="mode-label">{l.label}</span>
                    </button>
                  ))}
                </div>

                <span className="settings-label">
                  {isHebrewUI ? "ערכת נושא" : "Theme"}
                </span>
                <div className="settings-mode-grid">
                  {Object.values(THEME_PRESETS).map((t) => (
                    <button
                      key={t.id}
                      className={`settings-mode-btn${theme === t.id ? " active" : ""}`}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTheme(t.id);
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        setTheme(t.id);
                      }}
                    >
                      <span className="mode-emoji">{t.emoji}</span>
                      <span className="mode-label">{t.label[lang]}</span>
                    </button>
                  ))}
                </div>

                {/* Sound toggle */}
                <div className="settings-toggle-row">
                  <span className="settings-toggle-label">
                    <span className="tl-icon">{muteOn ? "🔇" : "🔊"}</span>
                    {isHebrewUI ? "צליל" : "Sound"}
                  </span>
                  <button
                    className={`settings-toggle-btn${muteOn ? "" : " on"}`}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMuteOn((m) => !m);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      setMuteOn((m) => !m);
                    }}
                  />
                </div>

                {/* Vibrate toggle */}
                <div className="settings-toggle-row">
                  <span className="settings-toggle-label">
                    <span className="tl-icon">{vibrateOn ? "📳" : "🔕"}</span>
                    {isHebrewUI ? "רטט" : "Vibrate"}
                  </span>
                  <button
                    className={`settings-toggle-btn${vibrateOn ? " on" : ""}`}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setVibrateOn((v) => !v);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      setVibrateOn((v) => !v);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Classic mode content ── */}
          {gameMode === "classic" && (
            <>
              {gameMode === "classic" && ultraFlash && (
                <div className="ultra-flash" />
              )}

              {gameMode === "classic" && showCombo && combo >= 2 && (
                <div
                  key={combo}
                  className={`combo-display ${combo >= 10 ? "combo-ultra" : combo >= 7 ? "combo-fire" : combo >= 4 ? "combo-hot" : ""}`}
                >
                  {combo >= 10
                    ? ui.ultra
                    : combo >= 7
                      ? ui.fire
                      : combo >= 4
                        ? "⚡ ×"
                        : "✨ ×"}
                  {combo}
                </div>
              )}

              {showSongName && <div className="song-banner">{songName}</div>}

              {showIdle && (
                <div className="idle-hint">
                  <span>👆</span>
                </div>
              )}

              {gameMode === "classic" && keyFlash && (
                <div key={keyFlash.id} className="key-flash">
                  {keyFlash.emoji}
                </div>
              )}

              {/* Trail dots */}
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
            </>
          )}

          {/* ── Balloon mode content ── */}
          {gameMode === "balloons" && (
            <>
              {/* Pop counter + level */}
              <div className="balloon-counter">
                🎈 {popCount} &nbsp;|&nbsp; 💨 {balloonMissed}
                &nbsp;|&nbsp;
                <span className="balloon-level-badge">
                  {"⚡".repeat(Math.min(balloonLevel, 5))}{" "}
                  {isHebrewUI ? `רמה ${balloonLevel}` : `Lv ${balloonLevel}`}
                </span>
              </div>

              {/* Level-up flash */}
              {balloonLevelUp && (
                <div className="balloon-levelup">
                  {"🚀"}
                  <br />
                  {isHebrewUI
                    ? `רמה ${balloonLevelUp.level}!`
                    : `Level ${balloonLevelUp.level}!`}
                </div>
              )}

              {balloonHint && (
                <div className="balloon-hint">
                  {isHebrewUI ? "! פוצצו את הבלונים" : "tap the balloons!"}
                </div>
              )}

              {balloons.map((b) => (
                <div
                  key={b.id}
                  className="balloon"
                  onTouchStart={(e) => handleBalloonDirectTap(b, e)}
                  onMouseDown={IS_TOUCH ? undefined : (e) => handleBalloonDirectTap(b, e)}
                  style={{
                    left: b.x,
                    top: b.y,
                    width: b.size,
                    height: b.size * 1.15,
                    background: `radial-gradient(circle at 35% 30%, white 0%, ${b.color} 40%, ${b.colorDark} 100%)`,
                    "--rise": `${b.rise}ms`,
                    "--dur": `${b.floatD}ms`,
                    "--sway": `${b.sway}px`,
                  }}
                />
              ))}
            </>
          )}

          {/* ── Drum mode content ── */}
          {gameMode === "drums" && (
            <div className="drum-grid">
              {DRUM_PADS.map((pad) => (
                <div
                  key={pad.type}
                  className="drum-pad"
                  style={{ background: pad.bg }}
                  onTouchStart={(e) => handleDrumTap(pad.type, e)}
                  onMouseDown={(e) => handleDrumTap(pad.type, e)}
                >
                  <span className="drum-pad-emoji">{pad.emoji}</span>
                  {drumRipples
                    .filter((r) => r.padType === pad.type)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="drum-pad-ripple"
                        style={{ left: r.x, top: r.y }}
                      />
                    ))}
                </div>
              ))}
            </div>
          )}

          {/* ── Target mode content ── */}
          {gameMode === "targets" && (
            <>
              <div className="target-score">
                🎯 {targetScore} &nbsp;|&nbsp; 💨 {targetMissed}
                {targetHighScore > 0 && (
                  <span className="target-highscore"> &nbsp;|&nbsp; 🏆 {targetHighScore}</span>
                )}
              </div>

              {targets.map((target) => {
                const circumference =
                  2 * Math.PI * ((target.size + 10) / 2 - 4);
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
            </>
          )}

          {/* ── Sleep mode content ── */}
          {gameMode === "autoshow" && (
            <div className="sleep-scene">
              <div className="sleep-gradient" />
              <div className="sleep-moon" />
              <div className="sleep-stars" />
              {/* Distant points (sleep-stars) + falling emoji stars */}
              <div className="sleep-falling-stars" aria-hidden="true">
                {[
                  { emoji: "⭐", dx: -18 },
                  { emoji: "🌟", dx: 22 },
                  { emoji: "✨", dx: -14 },
                  { emoji: "⭐", dx: 18 },
                  { emoji: "🌟", dx: -10 },
                ].map((s, i) => {
                  const left = 10 + i * 18; // 10..82
                  const delay = i * 2.6; // every few seconds
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

              {/* Sheep falling like stars */}
              <div className="sleep-falling-sheep" aria-hidden="true">
                {[
                  { emoji: "🐑", left: 18, delay: 0.8, dur: 12.5, dxMid: -12, dxEnd: -22, shuf: true },
                  { emoji: "🐏", left: 42, delay: 3.4, dur: 13.5, dxMid: 10, dxEnd: 24, shuf: false },
                  { emoji: "🐑", left: 64, delay: 6.2, dur: 12.8, dxMid: -8, dxEnd: -18, shuf: true },
                  { emoji: "🐑", left: 82, delay: 9.1, dur: 14.2, dxMid: 14, dxEnd: 30, shuf: false },
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
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSleepMenuOpen((v) => !v);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  setSleepMenuOpen((v) => !v);
                }}
              >
                {sleepMenuOpen ? (isHebrewUI ? "סגור 🌙" : "Hide 🌙") : (isHebrewUI ? "פתח 🌙" : "Open 🌙")}
              </button>

              {sleepMenuOpen && (
                <div className="sleep-panel" ref={sleepPanelRef} dir={isHebrewUI ? "rtl" : "ltr"}>
                  <div className="sleep-title">{isHebrewUI ? "מצב שינה" : "Sleep mode"}</div>
                  <div className="sleep-subtitle">
                    {isHebrewUI ? "רקע עדין להרגעת תינוק" : "Gentle night ambience for baby"}
                  </div>

                  <div className="sleep-control-row">
                    <button
                      className={`sleep-action-btn${sleepEnabled ? " active" : ""}`}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSleepEnabled((v) => !v);
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        setSleepEnabled((v) => !v);
                      }}
                    >
                      {sleepEnabled ? (isHebrewUI ? "⏸ עצור" : "⏸ Pause") : (isHebrewUI ? "▶️ נגן" : "▶️ Play")}
                    </button>
                    <button
                      className="sleep-action-btn"
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSleepEnabled(false);
                        setSleepMenuOpen(false);
                      }}
                      onMouseUp={(e) => {
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
                      { id: "rain", emoji: "🌧️", label: isHebrewUI ? "גשם עדין" : "Soft rain" },
                      { id: "ocean", emoji: "🌊", label: isHebrewUI ? "גלי ים" : "Ocean waves" },
                      { id: "wind", emoji: "🍃", label: isHebrewUI ? "רוח לילה" : "Night wind" },
                      { id: "white", emoji: "🌫️", label: isHebrewUI ? "לבן רך" : "Soft white" },
                      { id: "pink", emoji: "🩵", label: isHebrewUI ? "ורוד רך" : "Pink soft" },
                      { id: "brown", emoji: "🌲", label: isHebrewUI ? "חום עמוק" : "Deep brown" },
                      { id: "heartbeat", emoji: "💗", label: isHebrewUI ? "דופק רגוע" : "Heartbeat" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSleepSoundMode(s.id);
                          setSleepEnabled(true);
                        }}
                        onMouseUp={(e) => {
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
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSleepMelodiesOpen((v) => !v);
                      }}
                      onMouseUp={(e) => {
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
                        { id: "lullaby", emoji: "🎵", label: isHebrewUI ? "מנגינה 1" : "Melody 1" },
                        { id: "lullaby2", emoji: "🎶", label: isHebrewUI ? "מנגינה 2" : "Melody 2" },
                        { id: "lullaby3", emoji: "🎼", label: isHebrewUI ? "מנגינה 3" : "Melody 3" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSleepSoundMode(s.id);
                            setSleepEnabled(true);
                          }}
                          onMouseUp={(e) => {
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
          )}

          {/* ── Piano mode content ── */}
          {gameMode === "piano" && (
            <div
              className={`piano-mode-shell${shouldForcePianoLandscape ? " force-landscape" : ""}`}
            >
              {/* Portrait overlay — ask user to rotate */}
              {IS_TOUCH && isPortrait && !shouldForcePianoLandscape && (
                <div className="piano-rotate-hint">
                  <div className="piano-rotate-icon">🔄</div>
                  <div>
                    {isHebrewUI
                      ? "סובב את המכשיר לרוחב"
                      : "Rotate device to landscape"}
                  </div>
                </div>
              )}

              {/* Note display — top portion */}
              {(() => {
                const SOLFEGE = isHebrewUI
                  ? {
                      C: "דו",
                      D: "רה",
                      E: "מי",
                      F: "פה",
                      G: "סול",
                      A: "לה",
                      B: "סי",
                    }
                  : {
                      C: "Do",
                      D: "Re",
                      E: "Mi",
                      F: "Fa",
                      G: "Sol",
                      A: "La",
                      B: "Si",
                    };
                return (
                  <div className="piano-display">
                    {displayedKeys.size > 0 ? (
                      Array.from(displayedKeys).map((kid) => {
                        const k = PIANO_KEYS.find((p) => p.id === kid);
                        if (!k) return null;
                        const name =
                          (SOLFEGE[k.label] ?? "?") +
                          (k.type === "black" ? "♯" : "");
                        return (
                          <span key={kid} className="piano-note-label">
                            {name}
                          </span>
                        );
                      })
                    ) : (
                      <span className="piano-display-hint">🎹</span>
                    )}
                  </div>
                );
              })()}

              {/* Keyboard — bottom 45% */}
              <div
                ref={pianoRef}
                className="piano-container"
                onTouchStart={IS_TOUCH ? handlePianoTouch : undefined}
                onTouchMove={IS_TOUCH ? handlePianoTouch : undefined}
                onTouchEnd={IS_TOUCH ? handlePianoTouchEnd : undefined}
                onMouseDown={IS_TOUCH ? undefined : handlePianoMouseDown}
                onMouseMove={
                  IS_TOUCH
                    ? undefined
                    : (e) => {
                        if (e.buttons === 1) handlePianoMouseDown(e);
                      }
                }
                onMouseUp={IS_TOUCH ? undefined : handlePianoMouseUp}
                onMouseLeave={IS_TOUCH ? undefined : handlePianoMouseUp}
              >
                {/* White keys */}
                {PIANO_KEYS.filter((k) => k.type === "white").map(
                  (key, idx, arr) => (
                    <div
                      key={key.id}
                      className={`piano-key white-key${pressedKeys.has(key.id) ? " pressed" : ""}`}
                      data-key-id={key.id}
                      style={{
                        left: `${(idx / arr.length) * 100}%`,
                        width: `${100 / arr.length}%`,
                      }}
                    >
                      <span className="piano-key-label">{key.label}</span>
                    </div>
                  ),
                )}
                {/* Black keys */}
                {PIANO_KEYS.filter((k) => k.type === "black").map((key) => {
                  const whites = PIANO_KEYS.filter((k) => k.type === "white");
                  const ww = 100 / whites.length;
                  const noteChar = key.id.slice(0, -1);
                  const octave = key.id.slice(-1);
                  const leftWhiteId = noteChar[0] + octave;
                  const leftIdx = whites.findIndex((k) => k.id === leftWhiteId);
                  if (leftIdx < 0) return null;
                  const leftPct = (leftIdx + 1) * ww - ww * 0.3;
                  return (
                    <div
                      key={key.id}
                      className={`piano-key black-key${pressedKeys.has(key.id) ? " pressed" : ""}`}
                      data-key-id={key.id}
                      style={{ left: `${leftPct}%`, width: `${ww * 0.6}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Memory mode content ── */}
          {gameMode === "memory" && (
            <MemoryGame
              lang={lang}
              onSound={(type) => {
                if (muteRef.current) return;
                if (type === "match") playSound("match");
                else playSound("miss");
              }}
            />
          )}

          {/* ── Shapes mode content ── */}
          {gameMode === "shapes" && (
            <ShapesGame
              lang={lang}
              onSound={(type) => {
                if (muteRef.current) return;
                if (type === "match") playSound("match");
                else playSound("miss");
              }}
            />
          )}

          {/* ── Shared: emojis (classic sparkles + balloon pops) ── */}
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

          {/* ── Shared: particles (classic only effectively) ── */}
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
      )}

      {/* ── Shape Match mode ── */}
      {isFullscreen && gameMode === "shapes" && (
        <ShapeMatch
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {/* ── Color Mix mode ── */}
      {isFullscreen && gameMode === "colormix" && (
        <ColorMix
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {/* ── Size Sort mode ── */}
      {isFullscreen && gameMode === "sizesort" && (
        <SizeSort
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {/* ── Shape Memory mode ── */}
      {isFullscreen && gameMode === "memory" && (
        <ShapeMemory
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {/* ── Pattern Game mode ── */}
      {isFullscreen && gameMode === "pattern" && (
        <PatternGame
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}
    </div>
  );
}
