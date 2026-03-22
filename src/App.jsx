import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

// ── Environment detection ──────────────────────────────────────────────────────
const isHebrew = navigator.language?.startsWith('he')
const isWebView = !document.fullscreenEnabled || !!window.ReactNativeWebView
const canVibrate = typeof navigator.vibrate === 'function'
// True touch device = use ONLY touch events, never mouse events (no ghost event conflict)
const IS_TOUCH = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches

const UI = {
  emojiRow:   '👶 🎉 🌈',
  title:      isHebrew ? 'בייבי ספארק! ✨' : 'Baby Spark! ✨',
  subtitle:   isHebrew
    ? 'תנו לתינוק ללחוץ על המסך\nולראות קסם צבעוני! ✨'
    : 'Let the baby tap the screen\nand see colorful magic! ✨',
  btn:        isHebrew ? '🚀 התחל מסך מלא' : '🚀 Start Fullscreen',
  hint:       isHebrew
    ? 'לצאת: החזק פינה שמאלית-עליונה 2 שניות'
    : 'To exit: hold top-left corner for 2 seconds',
  ultra:      isHebrew ? '👑 עוצמה ×' : '👑 ULTRA ×',
  fire:       isHebrew ? '🔥 לוהט ×' : '🔥 ×',
}

// ── Emoji maps ────────────────────────────────────────────────────────────────
const NUMBER_EMOJIS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣']

const LETTER_EMOJIS = {
  a: ['🍎','🐜','🥑','🐊','🦅'],
  b: ['🐝','🐻','🦋','🍌','🎈'],
  c: ['🐱','🌵','🍰','🐛','🌙'],
  d: ['🐶','🦆','🍩','💎','🐬'],
  e: ['🐘','🥚','⚡','🌍','🦅'],
  f: ['🐸','🦊','🍓','🌸','🔥'],
  g: ['🦒','🍇','🌿','🦗','🎮'],
  h: ['🐎','🍯','🌺','🦔','❤️'],
  i: ['🍦','🌈','💎','🎸','⭐'],
  j: ['🃏','🌶️','🦁','🎃','🌟'],
  k: ['🦘','🔑','🌈','🐨','👑'],
  l: ['🦁','🍋','🦎','🌸','💙'],
  m: ['🐒','🌙','🍄','🎵','🦋'],
  n: ['🌙','🎵','🌊','🐧','⭐'],
  o: ['🐙','🍊','🦉','🌀','🌸'],
  p: ['🐼','🍕','🦚','🌺','💜'],
  q: ['👸','❓','🦄','⭐','👑'],
  r: ['🌈','🐰','🚀','🌹','🎉'],
  s: ['⭐','🐍','🌟','🌊','🦋'],
  t: ['🐯','🌮','🦕','⚡','🎯'],
  u: ['🦄','☂️','🌊','🍇','💫'],
  v: ['🌺','🦅','💜','🎻','🌟'],
  w: ['🐺','🌊','🦋','🌸','🌈'],
  x: ['❌','🎸','💥','⭐','🌟'],
  y: ['🪀','💛','🌻','🦋','⭐'],
  z: ['🦓','⚡','🌙','🎯','💫'],
}

const HEBREW_LETTER_EMOJIS = {
  'א': ['🦁','🍎','🌟','✨','🔥'],
  'ב': ['🏠','🦋','🍌','💙','🌸'],
  'ג': ['🐪','🌿','💚','🎮','⭐'],
  'ד': ['🐟','🌊','💧','🐬','🎣'],
  'ה': ['🏔️','🌄','⛰️','🌅','🌈'],
  'ו': ['🌹','🌷','💐','🌺','🌸'],
  'ז': ['🪰','🦟','🐝','🐞','🦗'],
  'ח': ['🌾','🐷','🍞','🌻','🎋'],
  'ט': ['🐣','🥚','🐥','🌟','⭐'],
  'י': ['🌊','🏖️','🐚','🦀','🐠'],
  'כ': ['⭐','🌟','✨','💫','🌠'],
  'ך': ['⭐','🌟','✨','💫','🌠'],
  'ל': ['❤️','💕','💖','💗','💝'],
  'מ': ['💧','🌊','🚿','🏊','🌧️'],
  'ם': ['💧','🌊','🚿','🏊','🌧️'],
  'נ': ['🕯️','💡','🔦','🌟','✨'],
  'ן': ['🕯️','💡','🔦','🌟','✨'],
  'ס': ['🍩','🎂','🧁','🍪','🎉'],
  'ע': ['✏️','📝','👁️','🌳','🌿'],
  'פ': ['🌸','🌺','🌼','🌻','🌹'],
  'ף': ['🌸','🌺','🌼','🌻','🌹'],
  'צ': ['🐢','🌵','🌴','🦎','🐊'],
  'ץ': ['🐢','🌵','🌴','🦎','🐊'],
  'ק': ['🐵','🦧','🐒','🌿','🍌'],
  'ר': ['🚗','🚕','🏎️','🚙','🛻'],
  'ש': ['☀️','🌞','🌤️','⛅','🌈'],
  'ת': ['🍓','🫐','🍒','🍇','🍑'],
}

// ── Special key → emoji map ───────────────────────────────────────────────────
const SPECIAL_KEY_EMOJIS = {
  ' ':         ['🌈','✨','💫','🎆','🎇','🌟','⭐','🎉','🪄','🌠'],
  'Enter':     ['🎉','🥳','🎊','🎈','🎁','🏆','🌟','🎯','🥂','🎀'],
  'Backspace': ['💨','🌬️','❌','✂️','💥','🌀','🫧','🕳️'],
  'ArrowUp':   ['🚀','🛸','🦅','⭐','🌙','☁️','🪂','🎈'],
  'ArrowDown': ['🌊','🐬','🦈','🐢','🌿','🐙','🦑','🪸'],
  'ArrowLeft': ['🌸','🦋','🐟','🌀','🎐','🍃','🌊','🌺'],
  'ArrowRight':['🏃','💨','🦊','🚗','⚡','🏎️','🦄','🐎'],
  'Tab':       ['🌈','🎨','🎭','🎪','🎡','🎠','🎢','🎆'],
  '!':         ['🎉','💥','⚡','🔥','🎊','🌟','🥳','💣'],
  '@':         ['🌀','💫','🌟','🔄','⭐','🎯','🌐','🪐'],
  '#':         ['🎯','💠','✳️','🔷','🌐','⭐','🧊','🔮'],
  '$':         ['💰','🤑','🏆','💎','✨','🪙','👑','🫅'],
  '%':         ['🎭','🎪','🎨','🎡','🎠','🎢','🎆','🎇'],
  '^':         ['⚡','🌩️','🌪️','🌊','🔥','💫','🌀','🫧'],
  '&':         ['🤝','💕','🌸','💫','🫶','🪷','💞','🌹'],
  '*':         ['⭐','🌟','💫','✨','🌠','🎆','🔮','🪄'],
  '(':         ['🌙','🌚','🌛','🌑','🦉','🐺','🌌','🦇'],
  ')':         ['☀️','🌞','🌝','🌕','🌻','🌈','🌤️','🌸'],
  '-':         ['〰️','🌊','🏄','🌀','💫','🐍','🦎','🌿'],
  '+':         ['➕','💚','🌱','✨','💫','🌟','🍀','🌵'],
  '=':         ['⚖️','🎯','✅','💯','🌟','🏆','🎖️','🥇'],
  '?':         ['❓','🤔','💭','🔍','🌀','🦋','🪄','🔮'],
  '/':         ['⚔️','✂️','🌊','💨','⚡','🗡️','🪃','🎯'],
  '.':         ['🔵','⚫','🔴','🟡','🟢','🟣','🟠','🔶'],
  ',':         ['🌧️','💧','☔','🌈','💦','🫧','❄️','🌊'],
  ';':         ['🎵','🎶','🎸','🎹','🎺','🎻','🥁','🪗'],
  "'":         ['💬','🗣️','💭','🗨️','🌟','✨','💫','⭐'],
  '[':         ['📦','🎁','🎀','🗃️','📫','📬','🎊','🎉'],
  ']':         ['🎁','📦','🎀','🎊','🎉','🥳','🎈','🎆'],
}

// Emojis for high-combo mode
const COMBO_HOT_EMOJIS  = ['🔥','⚡','💥','🌟','✨','💫','🌈','🎆','🎇','🌠','🪄','🎉','💯','🏆','🥇','🎖️']
const COMBO_ULTRA_EMOJIS = ['🌈','🔥','⚡','💥','🌟','✨','💫','🎆','🎇','🌠','🪄','🎉','💯','🏆','👑','🫅','🥳','🎊']

const EMOJIS = [
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
  '🦁','🐮','🐸','🐵','🐔','🐧','🦆','🦋','🐛','🐝',
  '🐢','🦎','🐙','🐟','🐬','🦈','🐘','🦒','🦋','🦄',
  '🌈','⭐','🌟','💫','✨','🎉','🎊','🎈','🎁','🎀',
  '🍎','🍊','🍋','🍇','🍓','🍒','🍉','🍌','🍕','🍦',
  '🌺','🌸','🌼','🌻','🌹','🌷','🍀','🌿','🍁','🌊',
  '🚀','🌙','☀️','🌍','🪐','⚡','🔥','❄️','🎸','🎮',
  '❤️','🧡','💛','💚','💙','💜','💗','💕','💖','💝',
  '🐲','👾','🤖','👻','⚽','🏀','🎯','🎲','🦸','🧸',
]

const COLORS = [
  '#FF6B6B','#FF8E53','#FFE66D','#4ECDC4','#45B7D1',
  '#96E6A1','#D4A5F5','#FF9FF3','#54A0FF','#5F27CD',
  '#FF6348','#FFA502','#2ED573','#1E90FF','#A29BFE',
  '#FD79A8','#6C5CE7','#00CEC9','#FDCB6E','#E17055',
]

const NUMBER_NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51]

// ── Melody songs (note frequencies, Hz) ──────────────────────────────────────
const C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392.00,A4=440.00,B4=493.88
const C5=523.25,D5=587.33,E5=659.25,F5=698.46,G5=783.99,A5=880.00

// note lengths encoded by repetition: quarter=1×, half=2×, dotted-half=3×
// Each note: [frequency, beats]  (1=quarter, 2=half, 4=whole, 0.5=eighth)
const SONGS = [
  {
    name: 'כוכב קטן ✨',
    bpm: 126,
    notes: [
      // Twinkle Twinkle – 4/4
      [C4,1],[C4,1],[G4,1],[G4,1],  [A4,1],[A4,1],[G4,2],
      [F4,1],[F4,1],[E4,1],[E4,1],  [D4,1],[D4,1],[C4,2],
      [G4,1],[G4,1],[F4,1],[F4,1],  [E4,1],[E4,1],[D4,2],
      [G4,1],[G4,1],[F4,1],[F4,1],  [E4,1],[E4,1],[D4,2],
      [C4,1],[C4,1],[G4,1],[G4,1],  [A4,1],[A4,1],[G4,2],
      [F4,1],[F4,1],[E4,1],[E4,1],  [D4,1],[D4,1],[C4,2],
    ],
  },
  {
    name: 'יום הולדת שמח 🎂',
    bpm: 96,
    notes: [
      // Happy Birthday – 3/4   (♩=78)
      [G4,0.5],[G4,0.5],[A4,1],[G4,1],  [C5,1],[B4,2],
      [G4,0.5],[G4,0.5],[A4,1],[G4,1],  [D5,1],[C5,2],
      [G4,0.5],[G4,0.5],[G5,1],[E5,1],  [C5,1],[B4,1],[A4,2],
      [F5,0.5],[F5,0.5],[E5,1],[C5,1],  [D5,1],[C5,3],
    ],
  },
  {
    name: 'היה לו חווה 🐄',
    bpm: 132,
    notes: [
      // Old MacDonald – 4/4
      [G4,1],[G4,1],[G4,1],[D4,1],  [E4,1],[E4,1],[D4,2],
      [B4,1],[B4,1],[A4,1],[A4,1],  [G4,4],
      [D4,2],
      [G4,1],[G4,1],[G4,1],[G4,1],  [D4,2],
      [E4,1],[E4,1],[D4,2],
      [B4,1],[B4,1],[A4,1],[A4,1],  [G4,4],
    ],
  },
  {
    name: "ג'ינגל בלס 🔔",
    bpm: 144,
    notes: [
      // Jingle Bells – 4/4
      [E4,1],[E4,1],[E4,2],
      [E4,1],[E4,1],[E4,2],
      [E4,1],[G4,1],[C4,1],[D4,1],  [E4,4],
      [F4,1],[F4,1],[F4,1],[F4,1],
      [F4,1],[E4,1],[E4,1],[E4,1],
      [E4,1],[D4,1],[D4,1],[E4,1],  [D4,2],[G4,2],
      [E4,1],[E4,1],[E4,2],
      [E4,1],[E4,1],[E4,2],
      [E4,1],[G4,1],[C4,1],[D4,1],  [E4,4],
      [F4,1],[F4,1],[F4,1],[F4,1],
      [G4,1],[G4,1],[F4,1],[D4,1],  [C4,4],
    ],
  },
  {
    name: 'מרי הייתה לה כבשה 🐑',
    bpm: 126,
    notes: [
      // Mary Had a Little Lamb – 4/4
      [E4,1],[D4,1],[C4,1],[D4,1],  [E4,1],[E4,1],[E4,2],
      [D4,1],[D4,1],[D4,2],         [E4,1],[G4,1],[G4,2],
      [E4,1],[D4,1],[C4,1],[D4,1],  [E4,1],[E4,1],[E4,1],[E4,1],
      [D4,1],[D4,1],[E4,1],[D4,1],  [C4,4],
    ],
  },
  {
    name: 'ראש כתפיים 🙆',
    bpm: 152,
    notes: [
      // Head Shoulders Knees and Toes – 4/4
      [G4,1],[G4,1],[G4,1],[E4,1],  [G4,1],[G4,1],[G4,2],
      [G4,0.5],[A4,0.5],[B4,1],[C5,1],  [B4,0.5],[A4,0.5],[G4,2],
      [A4,1],[A4,1],[A4,1],[A4,1],  [G4,1],[G4,1],[G4,2],
      [G4,1],[G4,1],[G4,1],[E4,1],  [G4,1],[G4,1],[G4,2],
      [G4,0.5],[A4,0.5],[B4,1],[C5,1],  [B4,0.5],[A4,0.5],[G4,2],
    ],
  },
]

let audioCtx = null
// Timeline pointer for random tap sounds
let nextNoteTime = 0
// Separate timeline for melody (so melody rhythm is never disrupted by tap sounds)
let nextMelodyTime = 0

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

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

const MAX_TAP_QUEUE = 0.55  // never more than 0.55s of queued tap notes

async function playSound(type = 'normal') {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    const now = ctx.currentTime
    // Cap the queue: if nextNoteTime is too far ahead, drop it back to now
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

function rand(a, b) { return a + Math.random() * (b - a) }
function randInt(a, b) { return Math.floor(rand(a, b)) }

let uid = 0
const nextId = () => ++uid

export default function App() {
  const [emojis, setEmojis] = useState([])
  const [particles, setParticles] = useState([])
  const [trail, setTrail] = useState([])
  const [keyFlash, setKeyFlash] = useState(null)
  const [showIdle, setShowIdle] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(isWebView)
  const [holdProgress, setHoldProgress] = useState(0)
  const [vibrateOn, setVibrateOn] = useState(true)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [ultraFlash, setUltraFlash] = useState(false)

  const containerRef = useRef(null)
  const idleTimerRef = useRef(null)
  const holdStartRef = useRef(null)
  const holdIntervalRef = useRef(null)
  const touchStartRef = useRef({})
  const isSwipingRef = useRef({})
  const activeTouchPosRef = useRef({})
  const longPressTimerRef = useRef({})
  const longPressIntervalRef = useRef({})
  const vibrateRef = useRef(true)
  const comboRef = useRef(0)
  const lastTapTimeRef = useRef(0)
  const comboTimerRef = useRef(null)
  const lastTapPosRef = useRef(null)
  // Mouse long-press / double-click
  const mouseLongTimerRef = useRef(null)
  const mouseLongIntervalRef = useRef(null)
  const mousePosRef = useRef(null)
  const lastSpawnRef = useRef(0)
  // Melody
  const songIdxRef = useRef(0)
  const noteIdxRef = useRef(0)
  const songNameTimerRef = useRef(null)
  const [songName, setSongName] = useState(SONGS[0].name)
  const [showSongName, setShowSongName] = useState(false)

  // keep vibrateRef in sync with state (avoids stale closures in effects)
  useEffect(() => { vibrateRef.current = vibrateOn }, [vibrateOn])

  const vibrate = (pattern) => {
    if (vibrateRef.current && canVibrate) navigator.vibrate(pattern)
  }

  // ── resetIdle ──────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    setShowIdle(false)
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setShowIdle(true), 4000)
  }, [])

  // ── melody player ──────────────────────────────────────────────────────────
  const playMelodyNote = useCallback(async () => {
    const song   = SONGS[songIdxRef.current]
    const [freq, beats] = song.notes[noteIdxRef.current]
    const beat   = 60 / song.bpm          // seconds per quarter note
    const dur    = beats * beat * 0.88    // sound-on time (slight gap between notes)
    const slot   = beats * beat           // full time slot this note occupies

    try {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()

      // Queue next note — but cap the queue at 1 note ahead so rapid tapping never creates a backlog
      const now     = ctx.currentTime
      const maxAhead = slot * 1.5   // never more than 1.5 note-slots ahead
      const startAt = (nextMelodyTime > now && nextMelodyTime - now < maxAhead)
        ? nextMelodyTime
        : now
      nextMelodyTime = startAt + slot

      // Main tone
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.28, startAt)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur)
      osc.start(startAt); osc.stop(startAt + dur)

      // Soft upper harmonic
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
  }, [])

  // ── spawnAt (must be before any effect that uses it) ──────────────────────
  const spawnAt = useCallback((x, y, emojiList = null, soundType = 'normal', isNumber = false, comboScale = 1) => {
    lastSpawnRef.current = Date.now()
    resetIdle()

    const bonus = Math.min(Math.floor((comboScale - 1) * 1.5), 6)
    const count = isNumber ? randInt(3, 6) : randInt(4, 8) + bonus
    const pool = emojiList || EMOJIS
    const baseSize = isNumber ? randInt(85, 135) : randInt(45, 95)

    const newEmojis = Array.from({ length: count }, () => {
      const id = nextId()
      const emoji = pool[randInt(0, pool.length)]
      const size = baseSize + randInt(-10, 15)
      const angle = rand(0, Math.PI * 2)
      const distance = rand(70, 240)
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance - rand(50, 110)
      const rotation = rand(-360, 360)
      const duration = rand(950, 1500)
      setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), duration)
      return { id, emoji, x, y, size, dx, dy, rotation, duration }
    })
    setEmojis(prev => [...prev, ...newEmojis])

    const burstCount = isNumber ? 24 : 16
    const newParticles = Array.from({ length: burstCount }, () => {
      const id = nextId()
      const angle = rand(0, Math.PI * 2)
      const speed = rand(70, isNumber ? 290 : 230)
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 800)
      return {
        id, x, y,
        color: COLORS[randInt(0, COLORS.length)],
        px: Math.cos(angle) * speed,
        py: Math.sin(angle) * speed,
        size: rand(8, isNumber ? 30 : 24),
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      }
    })
    setParticles(prev => [...prev, ...newParticles])
    playMelodyNote()
  }, [resetIdle, playMelodyNote])

  // ── combo tracking (after spawnAt) ────────────────────────────────────────
  const trackCombo = useCallback(() => {
    const now = Date.now()
    const gap = now - lastTapTimeRef.current
    lastTapTimeRef.current = now
    if (gap < 650) {
      comboRef.current = Math.min(comboRef.current + 1, 15)
    } else {
      comboRef.current = 1
    }
    const c = comboRef.current

    // Milestone: combo 10 → ULTRA flash + auto-burst
    if (c === 10) {
      if (vibrateRef.current) navigator.vibrate?.([100,40,100,40,200])
      setUltraFlash(true)
      setTimeout(() => setUltraFlash(false), 800)
      for (let i = 0; i < 8; i++) {
        setTimeout(() => spawnAt(
          rand(60, window.innerWidth - 60),
          rand(60, window.innerHeight - 60),
          COMBO_ULTRA_EMOJIS, 'normal', false, 8
        ), i * 60)
      }
    }

    if (c >= 2) {
      setCombo(c)
      setShowCombo(true)
      clearTimeout(comboTimerRef.current)
      comboTimerRef.current = setTimeout(() => {
        setShowCombo(false)
        comboRef.current = 0
      }, 900)
    }
    return c
  }, [spawnAt])

  // ── Idle effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) { clearTimeout(idleTimerRef.current); setShowIdle(false); return }
    resetIdle()
    return () => clearTimeout(idleTimerRef.current)
  }, [isFullscreen, resetIdle])

  // ── Shake detection → mega explosion ──────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return
    let lastShake = 0
    const onMotion = (e) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
      if (mag > 28 && Date.now() - lastShake > 1200) {
        lastShake = Date.now()
        if (vibrateRef.current) navigator.vibrate?.([80, 40, 80, 40, 120])
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            spawnAt(
              rand(80, window.innerWidth - 80),
              rand(80, window.innerHeight - 80),
              null, 'normal', false
            )
          }, i * 70)
        }
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [isFullscreen, spawnAt])

  // ── Touch trail (swipe) + mouse trail ─────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return

    const onTouchMove = (e) => {
      Array.from(e.touches).forEach(t => {
        activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY }
        const start = touchStartRef.current[t.identifier]
        if (start) {
          const dx = t.clientX - start.x
          const dy = t.clientY - start.y
          if (Math.sqrt(dx * dx + dy * dy) > 12) {
            isSwipingRef.current[t.identifier] = true
            // Cancel long press once user starts moving
            clearTimeout(longPressTimerRef.current[t.identifier])
            clearInterval(longPressIntervalRef.current[t.identifier])
          }
        }
        if (isSwipingRef.current[t.identifier]) {
          const id = nextId()
          const color = COLORS[randInt(0, COLORS.length)]
          const size = rand(18, 42)
          setTrail(prev => [...prev, { id, x: t.clientX, y: t.clientY, color, size, swipe: true }])
          setTimeout(() => setTrail(prev => prev.filter(tr => tr.id !== id)), 750)
        }
      })
    }

    let hue = 0
    const onMove = (e) => {
      hue = (hue + 12) % 360
      const id  = nextId()
      const size = rand(28, 58)
      const color = `hsl(${hue},100%,62%)`
      const sparkle = Math.random() < 0.25   // 25% chance to show a ✨ emoji
      setTrail(prev => [
        ...prev.slice(-28),                  // cap trail length for perf
        { id, x: e.clientX, y: e.clientY, color, size, sparkle }
      ])
      setTimeout(() => setTrail(prev => prev.filter(t => t.id !== id)), 700)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [isFullscreen])

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!isFullscreen) return
      if (e.repeat) return

      // Block browser/OS shortcuts from leaking out while game is active.
      // We can't stop OS-level shortcuts (Cmd+Space) but we stop everything
      // the browser can intercept: Cmd/Ctrl combos, F-keys, Space, arrows, etc.
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey
      const isFKey      = e.key.startsWith('F') && e.key.length <= 3 && !isNaN(e.key.slice(1))
      const isNav       = ['Tab','Escape','Backspace','Delete',
                           'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                           ' '].includes(e.key)

      if (hasModifier || isFKey || isNav) {
        e.preventDefault()
        // Still spawn an emoji so the kid sees something happen
        spawnAt(rand(120, window.innerWidth - 120), rand(120, window.innerHeight - 120))
        return
      }

      const x = rand(120, window.innerWidth - 120)
      const y = rand(120, window.innerHeight - 120)
      const key = e.key

      if (/^[0-9]$/.test(key)) {
        const num = parseInt(key)
        const emoji = NUMBER_EMOJIS[num]
        const flashId = nextId()
        setKeyFlash({ emoji, id: flashId })
        setTimeout(() => setKeyFlash(f => f?.id === flashId ? null : f), 1100)
        spawnAt(x, y, [emoji], 'number', true)
      } else if (HEBREW_LETTER_EMOJIS[key]) {
        spawnAt(x, y, HEBREW_LETTER_EMOJIS[key], 'normal', false)
      } else if (/^[a-zA-Z]$/.test(key)) {
        const letterEmojis = LETTER_EMOJIS[key.toLowerCase()] || EMOJIS
        spawnAt(x, y, letterEmojis, 'normal', false)
      } else if (SPECIAL_KEY_EMOJIS[key]) {
        spawnAt(x, y, SPECIAL_KEY_EMOJIS[key], 'normal', false)
      } else {
        spawnAt(x, y)
      }
    }
    // capture:true → intercepts before browser handles shortcuts (e.g. Ctrl+W, F5)
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [spawnAt, isFullscreen])

  // ── Fullscreen change ──────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])


  const enterFullscreen = async () => {
    // iOS 13+ requires explicit permission for DeviceMotionEvent
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try { await DeviceMotionEvent.requestPermission() } catch (e) {}
    }
    containerRef.current?.requestFullscreen?.()
  }
  const exitFullscreen = () => document.fullscreenElement && document.exitFullscreen()

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.vibrate-btn')) return
    Array.from(e.changedTouches).forEach(t => {
      const pos = { x: t.clientX, y: t.clientY }
      touchStartRef.current[t.identifier] = pos
      activeTouchPosRef.current[t.identifier] = pos
      isSwipingRef.current[t.identifier] = false

      // Long press: after 700ms start continuous spawn + gentle vibration
      longPressTimerRef.current[t.identifier] = setTimeout(() => {
        if (!isSwipingRef.current[t.identifier]) {
          vibrate([20])
          longPressIntervalRef.current[t.identifier] = setInterval(() => {
            const cur = activeTouchPosRef.current[t.identifier]
            if (cur) {
              spawnAt(cur.x, cur.y)
              vibrate([12])
            }
          }, 300)
        }
      }, 700)
    })
  }

  const handleTouchMove = (e) => {
    Array.from(e.changedTouches).forEach(t => {
      activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY }
    })
  }

  const handleTouchEnd = (e) => {
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.vibrate-btn')) return
    Array.from(e.changedTouches).forEach(t => {
      const wasLongPress = !!longPressIntervalRef.current[t.identifier]
      clearTimeout(longPressTimerRef.current[t.identifier])
      clearInterval(longPressIntervalRef.current[t.identifier])
      delete longPressTimerRef.current[t.identifier]
      delete longPressIntervalRef.current[t.identifier]

      if (!isSwipingRef.current[t.identifier] && !wasLongPress) {
        const now = Date.now()
        const lastPos = lastTapPosRef.current
        const isDoubleTap = lastPos &&
          now - lastPos.time < 300 &&
          Math.abs(t.clientX - lastPos.x) < 60 &&
          Math.abs(t.clientY - lastPos.y) < 60

        lastTapPosRef.current = { x: t.clientX, y: t.clientY, time: now }

        if (isDoubleTap) {
          // Double tap → mega burst
          lastTapPosRef.current = null
          vibrate([60, 30, 100])
          for (let i = 0; i < 5; i++) {
            setTimeout(() => spawnAt(
              t.clientX + rand(-80, 80),
              t.clientY + rand(-80, 80),
              null, 'normal', false, 5
            ), i * 55)
          }
        } else {
          // Single tap → normal + combo
          const c = trackCombo(t.clientX, t.clientY)
          vibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22])
          const pool = c >= 10 ? COMBO_ULTRA_EMOJIS : c >= 5 ? COMBO_HOT_EMOJIS : null
          spawnAt(t.clientX, t.clientY, pool, 'normal', false, c)
        }
      }

      delete touchStartRef.current[t.identifier]
      delete activeTouchPosRef.current[t.identifier]
      delete isSwipingRef.current[t.identifier]
    })
  }

  // ── Mouse handlers (long press + double click + combo, mirrors touch) ──────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.vibrate-btn')) return
    mousePosRef.current = { x: e.clientX, y: e.clientY }
    mouseLongTimerRef.current = setTimeout(() => {
      vibrate([20])
      mouseLongIntervalRef.current = setInterval(() => {
        const p = mousePosRef.current
        if (p) { spawnAt(p.x, p.y); vibrate([12]) }
      }, 300)
    }, 700)
  }

  const handleMouseUp = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.vibrate-btn')) return
    const wasLong = !!mouseLongIntervalRef.current
    clearTimeout(mouseLongTimerRef.current)
    clearInterval(mouseLongIntervalRef.current)
    mouseLongTimerRef.current = null
    mouseLongIntervalRef.current = null
    if (!wasLong && mousePosRef.current) {
      const now = Date.now()
      const last = lastTapPosRef.current
      const isDouble = last && now - last.time < 300 &&
        Math.abs(e.clientX - last.x) < 60 && Math.abs(e.clientY - last.y) < 60
      lastTapPosRef.current = { x: e.clientX, y: e.clientY, time: now }
      if (isDouble) {
        lastTapPosRef.current = null
        vibrate([60, 30, 100])
        for (let i = 0; i < 5; i++) {
          setTimeout(() => spawnAt(
            e.clientX + rand(-80, 80), e.clientY + rand(-80, 80),
            null, 'normal', false, 5
          ), i * 55)
        }
      } else {
        const c = trackCombo()
        vibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22])
        const pool = c >= 10 ? COMBO_ULTRA_EMOJIS : c >= 5 ? COMBO_HOT_EMOJIS : null
        spawnAt(e.clientX, e.clientY, pool, 'normal', false, c)
      }
    }
    mousePosRef.current = null
  }

  const handleMouseMoveLong = (e) => {
    if (mousePosRef.current) mousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseLeaveLong = () => {
    clearTimeout(mouseLongTimerRef.current)
    clearInterval(mouseLongIntervalRef.current)
    mouseLongTimerRef.current = null
    mouseLongIntervalRef.current = null
    mousePosRef.current = null
  }

  // ── Corner hold to exit ────────────────────────────────────────────────────
  const handleCornerStart = (e) => {
    e.stopPropagation()
    holdStartRef.current = Date.now()
    holdIntervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - holdStartRef.current) / 2000, 1)
      setHoldProgress(p)
      if (p >= 1) {
        clearInterval(holdIntervalRef.current)
        setHoldProgress(0)
        exitFullscreen()
      }
    }, 30)
  }

  const handleCornerEnd = (e) => {
    e?.stopPropagation()
    clearInterval(holdIntervalRef.current)
    setHoldProgress(0)
  }

  const C = 2 * Math.PI * 22

  return (
    <div
      ref={containerRef}
      className="app"
      onTouchStart={IS_TOUCH ? handleTouchStart : undefined}
      onTouchMove={IS_TOUCH ? handleTouchMove : undefined}
      onTouchEnd={IS_TOUCH ? handleTouchEnd : undefined}
      onMouseDown={IS_TOUCH ? undefined : handleMouseDown}
      onMouseUp={IS_TOUCH ? undefined : handleMouseUp}
      onMouseMove={IS_TOUCH ? undefined : handleMouseMoveLong}
      onMouseLeave={IS_TOUCH ? undefined : handleMouseLeaveLong}
    >
      <div className="bg-gradient" />
      <div className="bg-bubbles">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="bubble" style={{
            left: `${(i * 6.5 + 3) % 100}%`,
            width: `${28 + (i * 17) % 65}px`,
            height: `${28 + (i * 17) % 65}px`,
            animationDuration: `${14 + (i * 1.7) % 8}s`,
            animationDelay: `-${(i * 3.1) % 14}s`,
          }} />
        ))}
      </div>

      {/* Start Screen */}
      {!isFullscreen && (
        <div className="start-screen">
          <div className="start-card" dir={isHebrew ? 'rtl' : 'ltr'}>
            <div className="start-emoji-row">{UI.emojiRow}</div>
            <h1 className="start-title">{UI.title}</h1>
            <p className="start-subtitle">
              {UI.subtitle.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
            <button className="start-btn" onClick={enterFullscreen}>
              {UI.btn}
            </button>
            <p className="start-hint">{UI.hint}</p>
          </div>
        </div>
      )}

      {/* Corner hold to exit */}
      {isFullscreen && (
        <div
          className="corner-hold"
          onTouchStart={handleCornerStart}
          onTouchEnd={handleCornerEnd}
          onMouseDown={handleCornerStart}
          onMouseUp={handleCornerEnd}
          onMouseLeave={handleCornerEnd}
        >
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <circle
              cx="26" cy="26" r="22"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={`${holdProgress * C} ${C}`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <text x="26" y="32" textAnchor="middle" fill="white" fontSize="18">✕</text>
          </svg>
        </div>
      )}

      {/* Vibrate toggle button – only on devices that support it */}
      {isFullscreen && canVibrate && (
        <button
          className="vibrate-btn"
          onTouchEnd={(e) => { e.stopPropagation(); setVibrateOn(v => !v) }}
          onMouseUp={(e) => { e.stopPropagation(); setVibrateOn(v => !v) }}
        >
          {vibrateOn ? '📳' : '🔇'}
        </button>
      )}

      {/* Ultra combo flash */}
      {isFullscreen && ultraFlash && (
        <div className="ultra-flash" />
      )}

      {/* Combo display */}
      {isFullscreen && showCombo && combo >= 2 && (
        <div key={combo} className={`combo-display ${combo >= 10 ? 'combo-ultra' : combo >= 7 ? 'combo-fire' : combo >= 4 ? 'combo-hot' : ''}`}>
          {combo >= 10 ? UI.ultra : combo >= 7 ? UI.fire : combo >= 4 ? '⚡ ×' : '✨ ×'}{combo}
        </div>
      )}

      {/* Song name banner */}
      {isFullscreen && showSongName && (
        <div className="song-banner">{songName}</div>
      )}

      {/* Idle hint */}
      {isFullscreen && showIdle && (
        <div className="idle-hint">
          <span>👆</span>
        </div>
      )}

      {/* Big number flash */}
      {keyFlash && (
        <div key={keyFlash.id} className="key-flash">
          {keyFlash.emoji}
        </div>
      )}

      {/* Trail dots */}
      {trail.map(t => (
        <div
          key={t.id}
          className={`trail-dot${t.swipe ? ' swipe-trail' : ''}`}
          style={{
            left: t.x,
            top: t.y,
            background: t.swipe ? t.color : `radial-gradient(circle at 35% 35%, white, ${t.color})`,
            width: t.size,
            height: t.size,
            boxShadow: `0 0 ${t.size * 0.6}px ${t.color}, 0 0 ${t.size * 1.4}px ${t.color}88, 0 0 ${t.size * 2.5}px ${t.color}33`,
          }}
        >
          {t.sparkle && <span style={{ fontSize: t.size * 0.7, lineHeight: 1, userSelect: 'none' }}>✨</span>}
        </div>
      ))}

      {/* Emojis */}
      {emojis.map(item => (
        <div
          key={item.id}
          className="emoji-item"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            '--dx': `${item.dx}px`,
            '--dy': `${item.dy}px`,
            '--rot': `${item.rotation}deg`,
            '--dur': `${item.duration}ms`,
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className={`particle ${p.shape}`}
          style={{
            left: p.x,
            top: p.y,
            background: p.color,
            width: p.size,
            height: p.size,
            '--px': `${p.px}px`,
            '--py': `${p.py}px`,
          }}
        />
      ))}
    </div>
  )
}
