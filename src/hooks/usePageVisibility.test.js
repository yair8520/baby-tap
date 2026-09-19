import test from "node:test";
import assert from "node:assert/strict";
import { syncVisibilityPauseClass } from "./usePageVisibility.js";

test("syncVisibilityPauseClass adds and removes the pause class from documentElement", () => {
  const root = {
    classList: {
      items: new Set(),
      add(name) {
        this.items.add(name);
      },
      remove(name) {
        this.items.delete(name);
      },
      contains(name) {
        return this.items.has(name);
      },
    },
  };

  const originalDocument = globalThis.document;
  globalThis.document = {
    hidden: true,
    documentElement: root,
  };

  try {
    syncVisibilityPauseClass("app-visibility-paused");
    assert.equal(root.classList.contains("app-visibility-paused"), true);

    globalThis.document.hidden = false;
    syncVisibilityPauseClass("app-visibility-paused");
    assert.equal(root.classList.contains("app-visibility-paused"), false);
  } finally {
    globalThis.document = originalDocument;
  }
});
