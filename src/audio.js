import { NOTES, NUMBER_NOTES, SONGS } from './constants.js'

// ── Audio context (lazy singleton) ────────────────────────────────────────────
let audioCtx = null
export let globalMute = false

export function setGlobalMute(val) {
  globalMute = val
}

export function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// ── Timeline pointers ─────────────────────────────────────────────────────────
let nextNoteTime   = 0
export let nextMelodyTime = 0

// ── Helpers ───────────────────────────────────────────────────────────────────
function scheduleNote(ctx, freq, type, volume, startAt, dur) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type = type
  gain.gain.setValueAtTime(volume, startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur)
  osc.start(startAt)
  osc.stop(startAt + dur)
}

function makeNoise(ctx) {
  const bufSize = ctx.sampleRate * 0.5
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  return src
}

// ── Tap sound ─────────────────────────────────────────────────────────────────
const MAX_TAP_QUEUE = 0.55

export async function playSound(type = 'normal') {
  if (globalMute) return
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    const now = ctx.currentTime
    const startAt = (nextNoteTime > now && nextNoteTime - now < MAX_TAP_QUEUE)
      ? nextNoteTime
      : now

    if (type === 'number') {
      const dur = 0.45
      scheduleNote(ctx, NUMBER_NOTES[Math.floor(Math.random() * NUMBER_NOTES.length)], 'triangle', 0.28, startAt, dur)
      scheduleNote(ctx, NUMBER_NOTES[Math.floor(Math.random() * NUMBER_NOTES.length)] * 1.33, 'sine', 0.12, startAt, 0.28)
      nextNoteTime = startAt + dur
    } else {
      const dur = 0.5
      scheduleNote(ctx, NOTES[Math.floor(Math.random() * NOTES.length)],
        ['sine', 'triangle', 'sine'][Math.floor(Math.random() * 3)], 0.22, startAt, dur)
      nextNoteTime = startAt + dur
    }
  } catch (e) {}
}

// ── Melody note player ────────────────────────────────────────────────────────
export async function playMelodyNote(noteIdxRef, songIdxRef, setSongName, setShowSongName, songNameTimerRef) {
  if (globalMute) return
  const song = SONGS[songIdxRef.current]
  const [freq, beats] = song.notes[noteIdxRef.current]
  const beat  = 60 / song.bpm
  const dur   = beats * beat * 0.88
  const slot  = beats * beat

  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    const now     = ctx.currentTime
    const startAt = nextMelodyTime > now ? nextMelodyTime : now
    nextMelodyTime = startAt + slot

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.28, startAt)
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur)
    osc.start(startAt); osc.stop(startAt + dur)

    const osc2  = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.frequency.value = freq * 1.5
    osc2.type = 'triangle'
    gain2.gain.setValueAtTime(0.07, startAt)
    gain2.gain.exponentialRampToValueAtTime(0.001, startAt + dur * 0.6)
    osc2.start(startAt); osc2.stop(startAt + dur * 0.6)
  } catch (e) {}

  noteIdxRef.current++
  if (noteIdxRef.current >= song.notes.length) {
    noteIdxRef.current = 0
    songIdxRef.current = (songIdxRef.current + 1) % SONGS.length
    const next = SONGS[songIdxRef.current]
    setSongName(next.name)
    setShowSongName(true)
    clearTimeout(songNameTimerRef.current)
    songNameTimerRef.current = setTimeout(() => setShowSongName(false), 2200)
  }
}

// ── Balloon pop sound ─────────────────────────────────────────────────────────
export async function playBalloonPop() {
  if (globalMute) return
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    const now = ctx.currentTime
    // Quick sine burst at 400hz
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 400
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.start(now); osc.stop(now + 0.15)

    // Noise burst
    const noise = makeNoise(ctx)
    const ng = ctx.createGain()
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 800
    bp.Q.value = 0.5
    noise.connect(bp); bp.connect(ng); ng.connect(ctx.destination)
    ng.gain.setValueAtTime(0.15, now)
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    noise.start(now); noise.stop(now + 0.1)
  } catch (e) {}
}

// ── Drum sounds ───────────────────────────────────────────────────────────────
export async function playDrum(type) {
  if (globalMute) return
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    const now = ctx.currentTime

    switch (type) {
      case 'kick': {
        // Sine wave 80→40hz, gain decay 0.4s
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(80, now)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4)
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.9, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.start(now); osc.stop(now + 0.4)
        break
      }

      case 'snare': {
        // Noise + 200hz sine, decay 0.2s
        const noise = makeNoise(ctx)
        const ng  = ctx.createGain()
        const hp  = ctx.createBiquadFilter()
        hp.type = 'highpass'; hp.frequency.value = 1000
        noise.connect(hp); hp.connect(ng); ng.connect(ctx.destination)
        ng.gain.setValueAtTime(0.6, now)
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        noise.start(now); noise.stop(now + 0.2)

        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 200
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.start(now); osc.stop(now + 0.15)
        break
      }

      case 'hihat': {
        // Noise bandpass 8000hz, decay 0.08s (closed)
        const noise = makeNoise(ctx)
        const bp  = ctx.createBiquadFilter()
        bp.type = 'bandpass'; bp.frequency.value = 8000; bp.Q.value = 0.5
        const gain = ctx.createGain()
        noise.connect(bp); bp.connect(gain); gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        noise.start(now); noise.stop(now + 0.08)
        break
      }

      case 'tom': {
        // Sine 150→80hz, decay 0.3s
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.7, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        osc.start(now); osc.stop(now + 0.3)
        break
      }

      case 'clap': {
        // Noise burst, 4 rapid repeats, decay 0.15s
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.012
          const noise = makeNoise(ctx)
          const hp  = ctx.createBiquadFilter()
          hp.type = 'highpass'; hp.frequency.value = 1200
          const gain = ctx.createGain()
          noise.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
          gain.gain.setValueAtTime(0.5 - i * 0.08, t)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
          noise.start(t); noise.stop(t + 0.04)
        }
        break
      }

      case 'cymbal': {
        // Noise highpass 5000hz, decay 0.4s
        const noise = makeNoise(ctx)
        const hp  = ctx.createBiquadFilter()
        hp.type = 'highpass'; hp.frequency.value = 5000
        const gain = ctx.createGain()
        noise.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        noise.start(now); noise.stop(now + 0.4)
        break
      }

      default:
        break
    }
  } catch (e) {}
}
