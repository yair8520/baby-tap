import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

// ── Environment detection ──────────────────────────────────────────────────────
const isHebrew = navigator.language?.startsWith('he')
const isWebView = !document.fullscreenEnabled || !!window.ReactNativeWebView
// iOS Safari does not support vibration at all
const canVibrate = typeof navigator.vibrate === 'function'

const UI = {
  emojiRow:   '👶 🎉 🌈',
  title:      'Baby Smash!',
  subtitle:   isHebrew
    ? 'תנו לתינוק ללחוץ על המסך\nולראות קסם צבעוני! ✨'
    : 'Let the baby tap the screen\nand see colorful magic! ✨',
  btn:        isHebrew ? '🚀 התחל מסך מלא' : '🚀 Start Fullscreen',
  hint:       isHebrew
    ? 'לצאת: החזק פינה שמאלית-עליונה 2 שניות'
    : 'To exit: hold top-left corner for 2 seconds',
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
const SONGS = [
  {
    // C C | G G | A A | G(half) | F F | E E | D D | C(half)
    name: 'כוכב קטן ✨',
    notes: [
      C4,C4, G4,G4, A4,A4, G4,G4,
      F4,F4, E4,E4, D4,D4, C4,C4,
      G4,G4, F4,F4, E4,E4, D4,D4,
      G4,G4, F4,F4, E4,E4, D4,D4,
      C4,C4, G4,G4, A4,A4, G4,G4,
      F4,F4, E4,E4, D4,D4, C4,C4,
    ],
  },
  {
    // G(8) G(8) A(q) G(q) | C5(q) B4(half+q) ...
    name: 'יום הולדת שמח 🎂',
    notes: [
      G4,G4,A4,G4, C5,C5,B4,B4,B4,
      G4,G4,A4,G4, D5,D5,C5,C5,C5,
      G4,G4,G5,E5, C5,B4,A4,A4,A4,
      F5,F5,E5,C5, D5,C5,C5,C5,
    ],
  },
  {
    // Old MacDonald – היה לו חווה 🐄
    name: 'היה לו חווה 🐄',
    notes: [
      G4,G4,G4,D4, E4,E4,D4,D4,
      B4,B4,A4,A4, G4,G4,
      D4,D4, G4,G4,G4,G4,D4,D4,
      E4,E4,D4,D4, B4,B4,A4,A4, G4,G4,
    ],
  },
  {
    // Jingle Bells – with correct rhythm (eighth notes doubled)
    name: 'ג\'ינגל בלס 🔔',
    notes: [
      E4,E4,E4,E4,  // Jin-gle bells (half)
      E4,E4,E4,E4,  // jin-gle bells (half)
      E4,G4,C4,D4,E4,E4,  // jin-gle all  the  way (last E half)
      F4,F4,F4,F4,F4,  // Oh what fun it is (last F half)
      F4,E4,E4,E4,E4,  // to ride in a (last E half)
      E4,D4,D4,E4,D4,D4, G4,G4, // one horse open sleigh
      E4,E4,E4,E4,
      E4,E4,E4,E4,
      E4,G4,C4,D4,E4,E4,
      F4,F4,F4,F4,F4,
      G4,G4,F4,D4,C4,C4,
    ],
  },
  {
    // Mary Had a Little Lamb
    name: 'מרי הייתה לה כבשה 🐑',
    notes: [
      E4,D4,C4,D4, E4,E4,E4,E4,  // Ma-ry had a lit-tle lamb (last E half)
      D4,D4,D4,D4, E4,G4,G4,G4,  // lit-tle lamb  lit-tle lamb (G half)
      E4,D4,C4,D4, E4,E4,E4,E4,
      E4,D4,D4,D4, E4,D4,C4,C4,
    ],
  },
  {
    // Head Shoulders Knees and Toes – ראש כתפיים
    name: 'ראש כתפיים 🙆',
    notes: [
      G4,G4,G4,E4,  // ראש  וכ-תפיים
      G4,G4,G4,     // בר-כיים
      G4,A4,B4,C5,B4,A4,G4,G4, // ואצ-בעות  (last G half)
      A4,B4,A4,A4,  // ואצ-בעות
      G4,G4,G4,E4,
      G4,G4,G4,
      G4,A4,B4,C5,B4,A4,G4,G4,
      A4,A4,G4,G4,
    ],
  },
]

let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playSound(type = 'normal') {
  try {
    const ctx = getAudioCtx()
    if (type === 'number') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = NUMBER_NOTES[Math.floor(Math.random() * NUMBER_NOTES.length)]
      osc.type = 'triangle'
      gain.gain.setValueAtTime(0.28, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.45)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = NUMBER_NOTES[Math.floor(Math.random() * NUMBER_NOTES.length)] * 1.33
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.12, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.28)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = NOTES[Math.floor(Math.random() * NOTES.length)]
      osc.type = ['sine', 'triangle', 'sine'][Math.floor(Math.random() * 3)]
      gain.gain.setValueAtTime(0.22, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
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
  // Prevents ghost mouse events fired by Safari after touch
  const lastTouchEndRef = useRef(0)
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
  const playMelodyNote = useCallback(() => {
    const song = SONGS[songIdxRef.current]
    const freq = song.notes[noteIdxRef.current]
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.28, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.38)
      // soft harmony
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2); gain2.connect(ctx.destination)
      osc2.frequency.value = freq * 1.5
      osc2.type = 'triangle'
      gain2.gain.setValueAtTime(0.08, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.22)
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

    const onMove = (e) => {
      const id = nextId()
      const color = COLORS[randInt(0, COLORS.length)]
      setTrail(prev => [...prev, { id, x: e.clientX, y: e.clientY, color, size: rand(8, 18) }])
      setTimeout(() => setTrail(prev => prev.filter(t => t.id !== id)), 500)
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
      if (e.repeat) return
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
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spawnAt])

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

      // Long press: after 350ms start continuous spawn + gentle vibration
      longPressTimerRef.current[t.identifier] = setTimeout(() => {
        if (!isSwipingRef.current[t.identifier]) {
          vibrate([20])
          longPressIntervalRef.current[t.identifier] = setInterval(() => {
            const cur = activeTouchPosRef.current[t.identifier]
            if (cur) {
              spawnAt(cur.x, cur.y)
              vibrate([12])
            }
          }, 200)
        }
      }, 350)
    })
  }

  const handleTouchMove = (e) => {
    Array.from(e.changedTouches).forEach(t => {
      activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY }
    })
  }

  const handleTouchEnd = (e) => {
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.vibrate-btn')) return
    lastTouchEndRef.current = Date.now()
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
    // Ignore ghost mouse events generated by Safari after touch
    if (Date.now() - lastTouchEndRef.current < 600) return
    mousePosRef.current = { x: e.clientX, y: e.clientY }
    mouseLongTimerRef.current = setTimeout(() => {
      vibrate([20])
      mouseLongIntervalRef.current = setInterval(() => {
        const p = mousePosRef.current
        if (p) { spawnAt(p.x, p.y); vibrate([12]) }
      }, 200)
    }, 350)
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMoveLong}
      onMouseLeave={handleMouseLeaveLong}
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
          {combo >= 10 ? '👑 ULTRA ×' : combo >= 7 ? '🔥 ×' : combo >= 4 ? '⚡ ×' : '✨ ×'}{combo}
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
            background: t.color,
            width: t.size,
            height: t.size,
            boxShadow: t.swipe
              ? `0 0 ${t.size * 0.8}px ${t.color}, 0 0 ${t.size * 1.8}px ${t.color}55`
              : undefined,
          }}
        />
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
