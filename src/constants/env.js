/** Runtime capability and host detection. */
export const isHebrew = navigator.language?.startsWith("he");
export const isWebView =
  !document.fullscreenEnabled || !!window.ReactNativeWebView;
export const canVibrate = typeof navigator.vibrate === "function";
export const IS_TOUCH =
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches;
