import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

import {
  IS_TOUCH, isHebrew, isWebView, canVibrate,
  UI, EMOJIS, COLORS, SONGS,
  NUMBER_EMOJIS, LETTER_EMOJIS, HEBREW_LETTER_EMOJIS, SPECIAL_KEY_EMOJIS,
  COMBO_HOT_EMOJIS, COMBO_ULTRA_EMOJIS,
  DRUM_PADS,
} from './constants.js'

import {
  getAudioCtx, setGlobalMute, playSound, playMelodyNote,
  playBalloonPop, playDrum, nextMelodyTime,
} from './audio.js'

// ── Utilities ──────────────────────────────────────────────────────────────────
function rand(a, b) { return a + Math.random() * (b - a) }
function randInt(a, b) { return Math.floor(rand(a, b)) }

let uid = 0
const nextId = () => ++uid

// ── Balloon helpers ────────────────────────────────────────────────────────────
function makeBalloon() {
  const size   = randInt(65, 106)
  const hue    = randInt(0, 360)
  const sway   = rand(-60, 60)
  const rise   = rand(6000, 12000)
  const floatD = rand(2000, 4000)
  return {
    id:    nextId(),
    x:     rand(size, window.innerWidth - size),
    y:     window.innerHeight + size,
    size,
    color: `hsl(${hue}, 80%, 70%)`,
    colorDark: `hsl(${hue}, 70%, 50%)`,
    sway,
    rise,
    floatD,
    born:  Date.now(),
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function App() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [isFullscreen,  setIsFullscreen]  = useState(false)
  const [holdProgress,  setHoldProgress]  = useState(0)
  const [vibrateOn,     setVibrateOn]     = useState(true)
  const [muteOn,        setMuteOn]        = useState(false)
  const [gameMode,      setGameMode]      = useState('classic')  // 'classic' | 'balloons' | 'drums'
  const [settingsOpen,  setSettingsOpen]  = useState(false)

  // ── Classic mode state ───────────────────────────────────────────────────────
  const [emojis,       setEmojis]       = useState([])
  const [particles,    setParticles]    = useState([])
  const [trail,        setTrail]        = useState([])
  const [keyFlash,     setKeyFlash]     = useState(null)
  const [showIdle,     setShowIdle]     = useState(false)
  const [combo,        setCombo]        = useState(0)
  const [showCombo,    setShowCombo]    = useState(false)
  const [ultraFlash,   setUltraFlash]   = useState(false)
  const [songName,     setSongName]     = useState(SONGS[0].name)
  const [showSongName, setShowSongName] = useState(false)

  // ── Balloon mode state ───────────────────────────────────────────────────────
  const [balloons,      setBalloons]     = useState([])
  const [balloonHint,   setBalloonHint]  = useState(false)
  const [popCount,      setPopCount]     = useState(0)
  const balloonsRef = useRef([])

  // ── Drum mode state ──────────────────────────────────────────────────────────
  const [drumRipples, setDrumRipples] = useState([])

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const containerRef        = useRef(null)
  const idleTimerRef        = useRef(null)
  const holdStartRef        = useRef(null)
  const holdIntervalRef     = useRef(null)
  const touchStartRef       = useRef({})
  const isSwipingRef        = useRef({})
  const activeTouchPosRef   = useRef({})
  const longPressTimerRef   = useRef({})
  const longPressIntervalRef= useRef({})
  const mouseLongTimerRef   = useRef(null)
  const mouseLongIntervalRef= useRef(null)
  const mousePosRef         = useRef(null)
  const lastSpawnRef        = useRef(0)
  const lastTapTimeRef      = useRef(0)
  const comboTimerRef       = useRef(null)
  const lastTapPosRef       = useRef(null)
  const vibrateRef          = useRef(true)
  const muteRef             = useRef(false)
  const comboRef            = useRef(0)
  const songIdxRef          = useRef(0)
  const noteIdxRef          = useRef(0)
  const songNameTimerRef    = useRef(null)
  const balloonTimerRef     = useRef(null)
  const balloonHintTimerRef = useRef(null)
  const lastBalloonPopRef   = useRef(Date.now())
  const gameModeRef         = useRef('classic')
  const settingsRef         = useRef(null)

  // ── Sync refs ────────────────────────────────────────────────────────────────
  useEffect(() => { vibrateRef.current = vibrateOn }, [vibrateOn])
  useEffect(() => {
    muteRef.current = muteOn
    setGlobalMute(muteOn)
  }, [muteOn])
  useEffect(() => { gameModeRef.current = gameMode }, [gameMode])

  // ── Vibrate helper ───────────────────────────────────────────────────────────
  const vibrate = useCallback((pattern) => {
    if (!vibrateRef.current) return
    if (canVibrate) navigator.vibrate(pattern)
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'vibrate', pattern }))
  }, [])

  // ── Idle timer ───────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    setShowIdle(false)
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setShowIdle(true), 4000)
  }, [])

  useEffect(() => {
    if (!isFullscreen) { clearTimeout(idleTimerRef.current); setShowIdle(false); return }
    resetIdle()
    return () => clearTimeout(idleTimerRef.current)
  }, [isFullscreen, resetIdle])

  // ── Settings panel close-on-outside-click ────────────────────────────────────
  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [settingsOpen])

  // ── Melody player wrapper ────────────────────────────────────────────────────
  const playMelody = useCallback(() => {
    playMelodyNote(noteIdxRef, songIdxRef, setSongName, setShowSongName, songNameTimerRef)
  }, [])

  // ── Classic: spawnAt ─────────────────────────────────────────────────────────
  const spawnAt = useCallback((x, y, emojiList = null, soundType = 'normal', isNumber = false, comboScale = 1) => {
    lastSpawnRef.current = Date.now()
    resetIdle()

    const bonus    = Math.min(Math.floor((comboScale - 1) * 0.8), 2)
    const count    = isNumber ? randInt(2, 3) : randInt(2, 4) + bonus
    const pool     = emojiList || EMOJIS
    const baseSize = isNumber ? randInt(85, 130) : randInt(45, 90)

    const newEmojis = Array.from({ length: count }, () => {
      const id       = nextId()
      const emoji    = pool[randInt(0, pool.length)]
      const size     = baseSize + randInt(-8, 12)
      const angle    = rand(0, Math.PI * 2)
      const distance = rand(60, 200)
      const dx       = Math.cos(angle) * distance
      const dy       = Math.sin(angle) * distance - rand(40, 90)
      const rotation = rand(-270, 270)
      const duration = rand(650, 950)
      setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), duration)
      return { id, emoji, x, y, size, dx, dy, rotation, duration }
    })
    setEmojis(prev => [...prev, ...newEmojis])

    const burstCount   = isNumber ? 10 : 7
    const newParticles = Array.from({ length: burstCount }, () => {
      const id    = nextId()
      const angle = rand(0, Math.PI * 2)
      const speed = rand(60, isNumber ? 220 : 170)
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 600)
      return {
        id, x, y,
        color: COLORS[randInt(0, COLORS.length)],
        px:    Math.cos(angle) * speed,
        py:    Math.sin(angle) * speed,
        size:  rand(8, isNumber ? 30 : 24),
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      }
    })
    setParticles(prev => [...prev, ...newParticles])

    playSound(soundType)

    const ctx = getAudioCtx()
    if (!ctx || nextMelodyTime - ctx.currentTime < 0.9) {
      playMelody()
    }
  }, [resetIdle, playMelody])

  // ── Classic: combo tracking ──────────────────────────────────────────────────
  const trackCombo = useCallback(() => {
    const now = Date.now()
    const gap = now - lastTapTimeRef.current
    lastTapTimeRef.current = now
    comboRef.current = gap < 650 ? Math.min(comboRef.current + 1, 15) : 1
    const c = comboRef.current

    if (c === 10) {
      vibrate([100,40,100,40,200])
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
  }, [spawnAt, vibrate])

  // ── Classic: shake detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return
    let lastShake = 0
    const onMotion = (e) => {
      if (gameModeRef.current !== 'classic') return
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
      if (mag > 28 && Date.now() - lastShake > 1200) {
        lastShake = Date.now()
        vibrate([80, 40, 80, 40, 120])
        for (let i = 0; i < 10; i++) {
          setTimeout(() => spawnAt(
            rand(80, window.innerWidth - 80),
            rand(80, window.innerHeight - 80),
            null, 'normal', false
          ), i * 70)
        }
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [isFullscreen, spawnAt, vibrate])

  // ── Classic: mouse/touch trail ───────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return

    const onTouchMove = (e) => {
      if (gameModeRef.current !== 'classic') return
      Array.from(e.touches).forEach(t => {
        activeTouchPosRef.current[t.identifier] = { x: t.clientX, y: t.clientY }
        const start = touchStartRef.current[t.identifier]
        if (start) {
          const dx = t.clientX - start.x
          const dy = t.clientY - start.y
          if (Math.sqrt(dx * dx + dy * dy) > 12) {
            isSwipingRef.current[t.identifier] = true
            clearTimeout(longPressTimerRef.current[t.identifier])
            clearInterval(longPressIntervalRef.current[t.identifier])
          }
        }
        if (isSwipingRef.current[t.identifier]) {
          const id    = nextId()
          const color = COLORS[randInt(0, COLORS.length)]
          const size  = rand(18, 42)
          setTrail(prev => [...prev, { id, x: t.clientX, y: t.clientY, color, size, swipe: true }])
          setTimeout(() => setTrail(prev => prev.filter(tr => tr.id !== id)), 750)
        }
      })
    }

    let hue = 0
    const onMove = (e) => {
      if (gameModeRef.current !== 'classic') return
      hue = (hue + 12) % 360
      const id      = nextId()
      const size    = rand(28, 58)
      const color   = `hsl(${hue},100%,62%)`
      const sparkle = Math.random() < 0.25
      setTrail(prev => [
        ...prev.slice(-28),
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

  // ── Classic: keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!isFullscreen) return
      if (gameModeRef.current !== 'classic') return
      if (e.repeat) return

      const hasModifier = e.metaKey || e.ctrlKey || e.altKey
      const isFKey      = e.key.startsWith('F') && e.key.length <= 3 && !isNaN(e.key.slice(1))
      const isNav       = ['Tab','Escape','Backspace','Delete',
                           'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)

      if (hasModifier || isFKey || isNav) {
        e.preventDefault()
        spawnAt(rand(120, window.innerWidth - 120), rand(120, window.innerHeight - 120))
        return
      }

      const x   = rand(120, window.innerWidth - 120)
      const y   = rand(120, window.innerHeight - 120)
      const key = e.key

      if (/^[0-9]$/.test(key)) {
        const num     = parseInt(key)
        const emoji   = NUMBER_EMOJIS[num]
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
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [spawnAt, isFullscreen])

  // ── Fullscreen change listener ───────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Enter / exit fullscreen ──────────────────────────────────────────────────
  const enterFullscreen = async () => {
    // Request motion permission on iOS Safari.
    // In a React Native WebView, the WebView itself handles motion — skip request.
    // On regular Safari, request once per session and cache the result.
    if (!isWebView && typeof DeviceMotionEvent?.requestPermission === 'function') {
      const cached = sessionStorage.getItem('motionPermission')
      if (cached !== 'granted') {
        try {
          const result = await DeviceMotionEvent.requestPermission()
          sessionStorage.setItem('motionPermission', result)
        } catch (e) {}
      }
    }
    if (isWebView) {
      setIsFullscreen(true)
    } else {
      containerRef.current?.requestFullscreen?.()
    }
  }

  const exitFullscreen = () => {
    if (isWebView) {
      setIsFullscreen(false)
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'exit' }))
    } else {
      document.fullscreenElement && document.exitFullscreen()
    }
  }

  // ── Corner hold ──────────────────────────────────────────────────────────────
  const handleCornerStart = (e) => {
    e.stopPropagation()
    holdStartRef.current = Date.now()
    holdIntervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - holdStartRef.current) / 1000, 1)
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

  // Keep balloonsRef in sync so hit detection is always synchronous
  useEffect(() => { balloonsRef.current = balloons }, [balloons])

  // ── Balloon mode: spawn loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen || gameMode !== 'balloons') {
      clearInterval(balloonTimerRef.current)
      setBalloons([])
      setPopCount(0)
      return
    }
    // Spawn 3 balloons immediately so screen isn't empty on entry
    setBalloons([makeBalloon(), makeBalloon(), makeBalloon()])
    balloonTimerRef.current = setInterval(() => {
      setBalloons(prev => {
        if (prev.length >= 10) return prev
        return [...prev, makeBalloon()]
      })
    }, 1200)
    return () => clearInterval(balloonTimerRef.current)
  }, [isFullscreen, gameMode])

  // ── Balloon mode: remove balloons that rose off-screen ───────────────────────
  useEffect(() => {
    if (gameMode !== 'balloons') return
    const tick = setInterval(() => {
      const now = Date.now()
      setBalloons(prev => prev.filter(b => now - b.born < b.rise + 200))
    }, 500)
    return () => clearInterval(tick)
  }, [gameMode])

  // ── Balloon mode: hint if no pop in 5s ──────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'balloons' || !isFullscreen) {
      setBalloonHint(false)
      return
    }
    const check = setInterval(() => {
      if (Date.now() - lastBalloonPopRef.current > 5000) {
        setBalloonHint(true)
      } else {
        setBalloonHint(false)
      }
    }, 500)
    return () => clearInterval(check)
  }, [gameMode, isFullscreen])

  // ── Balloon pop handler ──────────────────────────────────────────────────────
  const popBalloon = useCallback((balloon, clientX, clientY) => {
    setBalloons(prev => prev.filter(b => b.id !== balloon.id))
    setPopCount(c => c + 1)
    lastBalloonPopRef.current = Date.now()
    setBalloonHint(false)
    playBalloonPop()
    vibrate([25])

    // Sparkle emojis
    const sparkles = ['✨','🌟','💫','⭐','🎉','💥']
    const count    = randInt(3, 6)
    const newEmojis = Array.from({ length: count }, () => {
      const id       = nextId()
      const emoji    = sparkles[randInt(0, sparkles.length)]
      const size     = randInt(28, 50)
      const angle    = rand(0, Math.PI * 2)
      const distance = rand(40, 120)
      const dx       = Math.cos(angle) * distance
      const dy       = Math.sin(angle) * distance - rand(30, 70)
      const rotation = rand(-180, 180)
      const duration = rand(500, 800)
      setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), duration)
      return { id, emoji, x: clientX, y: clientY, size, dx, dy, rotation, duration }
    })
    setEmojis(prev => [...prev, ...newEmojis])
  }, [vibrate])

  // ── Balloon touch/click handler (hit-test on tap) ────────────────────────────
  const handleBalloonTap = useCallback((e) => {
    if (gameMode !== 'balloons') return
    const touches = e.changedTouches ? Array.from(e.changedTouches) : [{ clientX: e.clientX, clientY: e.clientY }]
    const now = Date.now()
    touches.forEach(t => {
      const cx = t.clientX
      const cy = t.clientY
      // Hit detection directly from ref — synchronous, always up-to-date
      let hit = null
      let minDist = 100  // generous tap radius
      balloonsRef.current.forEach(b => {
        const elapsed  = now - b.born
        const progress = Math.min(elapsed / b.rise, 1)
        const bx = b.x
        const by = b.y - progress * (window.innerHeight + 200)
        const dist = Math.hypot(cx - bx, cy - by)
        if (dist < minDist) { minDist = dist; hit = b }
      })
      if (hit) popBalloon(hit, cx, cy)
    })
  }, [gameMode, popBalloon])

  // ── Drum pad tap ─────────────────────────────────────────────────────────────
  const handleDrumTap = useCallback((padType, e) => {
    e.preventDefault()
    e.stopPropagation()
    playDrum(padType)
    vibrate([15])

    // Ripple
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    const rippleId = nextId()
    setDrumRipples(prev => [...prev, { id: rippleId, padType, x, y }])
    setTimeout(() => setDrumRipples(prev => prev.filter(r => r.id !== rippleId)), 400)
  }, [vibrate])

  // ── Classic: touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (gameModeRef.current !== 'classic') return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.settings-wrap')) return
    Array.from(e.changedTouches).forEach(t => {
      const pos = { x: t.clientX, y: t.clientY }
      touchStartRef.current[t.identifier]       = pos
      activeTouchPosRef.current[t.identifier]   = pos
      isSwipingRef.current[t.identifier]         = false

      longPressTimerRef.current[t.identifier] = setTimeout(() => {
        if (!isSwipingRef.current[t.identifier]) {
          vibrate([20])
          longPressIntervalRef.current[t.identifier] = setInterval(() => {
            const cur = activeTouchPosRef.current[t.identifier]
            if (cur) { spawnAt(cur.x, cur.y); vibrate([12]) }
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
    if (gameModeRef.current !== 'classic') return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.settings-wrap')) return
    Array.from(e.changedTouches).forEach(t => {
      const wasLongPress = !!longPressIntervalRef.current[t.identifier]
      clearTimeout(longPressTimerRef.current[t.identifier])
      clearInterval(longPressIntervalRef.current[t.identifier])
      delete longPressTimerRef.current[t.identifier]
      delete longPressIntervalRef.current[t.identifier]

      if (!isSwipingRef.current[t.identifier] && !wasLongPress) {
        const now     = Date.now()
        const lastPos = lastTapPosRef.current
        const isDoubleTap = lastPos &&
          now - lastPos.time < 300 &&
          Math.abs(t.clientX - lastPos.x) < 60 &&
          Math.abs(t.clientY - lastPos.y) < 60

        lastTapPosRef.current = { x: t.clientX, y: t.clientY, time: now }

        if (isDoubleTap) {
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
          const c    = trackCombo()
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

  // ── Classic: mouse handlers ──────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (gameModeRef.current !== 'classic') return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.settings-wrap')) return
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
    if (gameModeRef.current !== 'classic') return
    if (e.target.closest('.corner-hold') || e.target.closest('.start-screen') || e.target.closest('.settings-wrap')) return
    const wasLong = !!mouseLongIntervalRef.current
    clearTimeout(mouseLongTimerRef.current)
    clearInterval(mouseLongIntervalRef.current)
    mouseLongTimerRef.current   = null
    mouseLongIntervalRef.current = null
    if (!wasLong && mousePosRef.current) {
      const now  = Date.now()
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
        const c    = trackCombo()
        vibrate(c >= 5 ? [60, 20, 40] : c >= 3 ? [40] : [22])
        const pool = c >= 10 ? COMBO_ULTRA_EMOJIS : c >= 5 ? COMBO_HOT_EMOJIS : null
        spawnAt(e.clientX, e.clientY, pool, 'normal', false, c)
      }
    }
    mousePosRef.current = null
  }

  const handleMouseMoveLong  = (e) => { if (mousePosRef.current) mousePosRef.current = { x: e.clientX, y: e.clientY } }
  const handleMouseLeaveLong = ()  => {
    clearTimeout(mouseLongTimerRef.current)
    clearInterval(mouseLongIntervalRef.current)
    mouseLongTimerRef.current   = null
    mouseLongIntervalRef.current = null
    mousePosRef.current = null
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const C = 2 * Math.PI * 22

  // ── Render ────────────────────────────────────────────────────────────────────
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
          <div key={i} className={`bubble bubble-${(i % 4) + 1}`} style={{
            left:             `${(i * 5.2 + 2) % 100}%`,
            width:            `${20 + (i * 19) % 70}px`,
            height:           `${20 + (i * 19) % 70}px`,
            animationDuration:`${13 + (i * 1.9) % 10}s`,
            animationDelay:   `-${(i * 2.8) % 16}s`,
          }} />
        ))}
      </div>

      {/* ── Start Screen ── */}
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
              <circle cx="26" cy="26" r="22" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <circle
                cx="26" cy="26" r="22"
                fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${holdProgress * C} ${C}`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
              <text x="26" y="32" textAnchor="middle" fill="white" fontSize="18">✕</text>
            </svg>
          </div>

          {/* ── Settings gear (top-right) ── */}
          <div className="settings-wrap" ref={settingsRef}>
            <button
              className="settings-gear-btn"
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setSettingsOpen(o => !o) }}
              onMouseUp={(e)  => { e.stopPropagation(); setSettingsOpen(o => !o) }}
            >
              ⚙️
            </button>

            {settingsOpen && (
              <div className="settings-panel" dir={isHebrew ? 'rtl' : 'ltr'}>
                {/* Mode row */}
                <div className="settings-row">
                  <span className="settings-label">מצב</span>
                  <div className="settings-mode-btns">
                    <button
                      className={`settings-mode-btn${gameMode === 'classic' ? ' active' : ''}`}
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setGameMode('classic'); setSettingsOpen(false) }}
                      onMouseUp={(e)  => { e.stopPropagation(); setGameMode('classic'); setSettingsOpen(false) }}
                    >🎮 קלאסי</button>
                    <button
                      className={`settings-mode-btn${gameMode === 'balloons' ? ' active' : ''}`}
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setGameMode('balloons'); setSettingsOpen(false) }}
                      onMouseUp={(e)  => { e.stopPropagation(); setGameMode('balloons'); setSettingsOpen(false) }}
                    >🎈 בלונים</button>
                    <button
                      className={`settings-mode-btn${gameMode === 'drums' ? ' active' : ''}`}
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setGameMode('drums'); setSettingsOpen(false) }}
                      onMouseUp={(e)  => { e.stopPropagation(); setGameMode('drums'); setSettingsOpen(false) }}
                    >🥁 תופים</button>
                  </div>
                </div>

                {/* Sound toggle row */}
                <div className="settings-row">
                  <span className="settings-label">צליל</span>
                  <button
                    className="settings-toggle-btn"
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMuteOn(m => !m) }}
                    onMouseUp={(e)  => { e.stopPropagation(); setMuteOn(m => !m) }}
                  >
                    {muteOn ? '🔇' : '🔊'}
                  </button>
                </div>

                {/* Vibrate toggle row */}
                <div className="settings-row">
                  <span className="settings-label">רטט</span>
                  <button
                    className="settings-toggle-btn"
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setVibrateOn(v => !v) }}
                    onMouseUp={(e)  => { e.stopPropagation(); setVibrateOn(v => !v) }}
                  >
                    {vibrateOn ? '📳' : '🔕'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Classic mode content ── */}
          {gameMode === 'classic' && (
            <>
              {ultraFlash && <div className="ultra-flash" />}

              {showCombo && combo >= 2 && (
                <div key={combo} className={`combo-display ${combo >= 10 ? 'combo-ultra' : combo >= 7 ? 'combo-fire' : combo >= 4 ? 'combo-hot' : ''}`}>
                  {combo >= 10 ? UI.ultra : combo >= 7 ? UI.fire : combo >= 4 ? '⚡ ×' : '✨ ×'}{combo}
                </div>
              )}

              {showSongName && (
                <div className="song-banner">{songName}</div>
              )}

              {showIdle && (
                <div className="idle-hint"><span>👆</span></div>
              )}

              {keyFlash && (
                <div key={keyFlash.id} className="key-flash">{keyFlash.emoji}</div>
              )}

              {/* Trail dots */}
              {trail.map(t => (
                <div
                  key={t.id}
                  className={`trail-dot${t.swipe ? ' swipe-trail' : ''}`}
                  style={{
                    left:       t.x,
                    top:        t.y,
                    background: t.swipe ? t.color : `radial-gradient(circle at 35% 35%, white, ${t.color})`,
                    width:      t.size,
                    height:     t.size,
                    boxShadow:  `0 0 ${t.size * 0.6}px ${t.color}, 0 0 ${t.size * 1.4}px ${t.color}88, 0 0 ${t.size * 2.5}px ${t.color}33`,
                  }}
                >
                  {t.sparkle && <span style={{ fontSize: t.size * 0.7, lineHeight: 1, userSelect: 'none' }}>✨</span>}
                </div>
              ))}
            </>
          )}

          {/* ── Balloon mode content ── */}
          {gameMode === 'balloons' && (
            <>
              {/* Pop counter */}
              <div className="balloon-counter">
                🎈 × {popCount}
              </div>

              {balloonHint && (
                <div className="balloon-hint">
                  {isHebrew ? '! פוצצו את הבלונים' : 'tap the balloons!'}
                </div>
              )}

              {/* Balloon tap overlay */}
              <div
                className="balloon-tap-layer"
                onTouchEnd={IS_TOUCH ? handleBalloonTap : undefined}
                onMouseUp={IS_TOUCH ? undefined : handleBalloonTap}
              />

              {balloons.map(b => (
                <div
                  key={b.id}
                  className="balloon"
                  style={{
                    left:        b.x,
                    top:         b.y,
                    width:       b.size,
                    height:      b.size * 1.15,
                    background:  `radial-gradient(circle at 35% 30%, white 0%, ${b.color} 40%, ${b.colorDark} 100%)`,
                    '--rise':    `${b.rise}ms`,
                    '--dur':     `${b.floatD}ms`,
                    '--sway':    `${b.sway}px`,
                  }}
                />
              ))}
            </>
          )}

          {/* ── Drum mode content ── */}
          {gameMode === 'drums' && (
            <div className="drum-grid">
              {DRUM_PADS.map(pad => (
                <div
                  key={pad.type}
                  className="drum-pad"
                  style={{ background: pad.bg }}
                  onTouchStart={(e) => handleDrumTap(pad.type, e)}
                  onMouseDown={(e)  => handleDrumTap(pad.type, e)}
                >
                  <span className="drum-pad-emoji">{pad.emoji}</span>
                  <span className="drum-pad-label">{pad.label}</span>
                  {drumRipples.filter(r => r.padType === pad.type).map(r => (
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

          {/* ── Shared: emojis (classic sparkles + balloon pops) ── */}
          {emojis.map(item => (
            <div
              key={item.id}
              className="emoji-item"
              style={{
                left:       item.x,
                top:        item.y,
                fontSize:   item.size,
                '--dx':     `${item.dx}px`,
                '--dy':     `${item.dy}px`,
                '--rot':    `${item.rotation}deg`,
                '--dur':    `${item.duration}ms`,
              }}
            >
              {item.emoji}
            </div>
          ))}

          {/* ── Shared: particles (classic only effectively) ── */}
          {particles.map(p => (
            <div
              key={p.id}
              className={`particle ${p.shape}`}
              style={{
                left:       p.x,
                top:        p.y,
                background: p.color,
                width:      p.size,
                height:     p.size,
                '--px':     `${p.px}px`,
                '--py':     `${p.py}px`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
