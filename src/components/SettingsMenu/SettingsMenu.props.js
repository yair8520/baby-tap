/**
 * @typedef {Object} SettingsMenuProps
 * @property {string} gameMode
 * @property {string} theme
 * @property {boolean} muteOn
 * @property {boolean} vibrateOn
 * @property {Record<string, { id: string, emoji: string, label: { he: string, en: string } }>} themePresets
 * @property {(id: string) => void} onGameModeChange
 * @property {(id: string) => void} onLangChange
 * @property {(id: string) => void} onThemeChange
 * @property {(value: boolean) => void} onMuteChange
 * @property {(value: boolean) => void} onVibrateChange
 * @property {() => void} onResetProgress
 * @property {() => void} onClose
 */

export {};
