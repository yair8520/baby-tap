import test from "node:test";
import assert from "node:assert/strict";

function stubBrowserGlobals() {
  if (!globalThis.document) {
    globalThis.document = {
      hidden: false,
      fullscreenEnabled: true,
      documentElement: { lang: "", dir: "", classList: { add() {}, remove() {} } },
      addEventListener() {},
      removeEventListener() {},
    };
  }
  if (!globalThis.window) {
    globalThis.window = globalThis;
  }
  if (!globalThis.navigator) {
    globalThis.navigator = { userAgent: "node-test", maxTouchPoints: 0, language: "en" };
  }
  if (typeof globalThis.matchMedia !== "function") {
    globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  }
  if (!globalThis.AudioContext && !globalThis.webkitAudioContext) {
    globalThis.AudioContext = class {
      state = "suspended";
      suspend() {
        this.state = "suspended";
        return Promise.resolve();
      }
      resume() {
        this.state = "running";
        return Promise.resolve();
      }
    };
  }
}

stubBrowserGlobals();

test("audio module exports visibility pause helpers", async () => {
  const audio = await import("./audio.js");
  assert.equal(typeof audio.suspendAudioCtx, "function");
  assert.equal(typeof audio.resumeAudioCtx, "function");
  assert.equal(typeof audio.getAudioCtx, "function");
});

test("suspendAudioCtx is a no-op before any AudioContext exists", async () => {
  const audio = await import("./audio.js");
  assert.doesNotThrow(() => audio.suspendAudioCtx());
});
