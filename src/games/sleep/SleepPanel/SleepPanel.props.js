/**
 * @typedef {Object} SleepPanelProps
 * @property {boolean} open
 * @property {string} sleepSoundMode
 * @property {number} sleepVolume
 * @property {boolean} sleepEnabled
 * @property {boolean} melodiesOpen
 * @property {(mode: string) => void} onSoundModeChange
 * @property {(volume: number) => void} onVolumeChange
 * @property {(enabled: boolean | ((v: boolean) => boolean)) => void} onEnabledChange
 * @property {(open: boolean | ((v: boolean) => boolean)) => void} onMelodiesOpenChange
 * @property {() => void} onClose
 * @property {import('react').Ref} panelRef
 */

export {};
