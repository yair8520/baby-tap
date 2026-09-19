/** Max seconds of melody notes allowed to queue ahead of the audio clock. */
export const MAX_MELODY_QUEUE = 0.9

/**
 * Reserve a melody slot on the audio timeline without touching Web Audio.
 * Pure helper so race-prone async callers can claim time before `await resume()`.
 */
export function reserveMelodySlot(now, nextTime, slot, maxQueue = MAX_MELODY_QUEUE) {
  const safeNow = Number.isFinite(now) ? now : 0
  const safeNext = Number.isFinite(nextTime) ? nextTime : 0
  const safeSlot = Number.isFinite(slot) && slot > 0 ? slot : 0
  const queued = safeNext - safeNow
  if (queued >= maxQueue) {
    return { accepted: false, startAt: safeNext, nextTime: safeNext }
  }
  const startAt = safeNext > safeNow ? safeNext : safeNow
  return { accepted: true, startAt, nextTime: startAt + safeSlot }
}
