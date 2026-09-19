export const VIBRATE = {
  correct: [40, 25, 90],
  wrong: [80, 40, 80],
  win: [40, 30, 80, 30, 120],
  soft: [30, 20, 60],
};

export function buzz(pattern, vibrateOn) {
  if (!vibrateOn) return;
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "vibrate", pattern }),
    );
    return;
  }
  navigator.vibrate?.(pattern);
}
