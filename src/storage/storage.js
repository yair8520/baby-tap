export const STORAGE_PREFIX = "bt_";

/**
 * Schema version for the `bt_*` payloads. Bump it and add a migration below
 * whenever a stored shape changes, so an existing install is not left holding
 * data the new code cannot read.
 */
export const SCHEMA_VERSION = 1;
const VERSION_KEY = `${STORAGE_PREFIX}schemaVersion`;

/** Ordered migrations: index i upgrades version i to i+1. */
const MIGRATIONS = [
  // v0 → v1: keys were already `bt_`-prefixed JSON; nothing to move.
  () => {},
];

/** Run any pending migrations. Safe to call more than once. */
export function migrateStorage() {
  let from;
  try {
    from = Number(localStorage.getItem(VERSION_KEY) ?? 0);
  } catch {
    return;
  }
  if (!Number.isFinite(from) || from >= SCHEMA_VERSION) {
    writeVersion(SCHEMA_VERSION);
    return;
  }
  for (let v = from; v < SCHEMA_VERSION; v += 1) {
    try {
      MIGRATIONS[v]?.();
    } catch {
      // A failed migration must not block startup.
    }
  }
  writeVersion(SCHEMA_VERSION);
}

function writeVersion(version) {
  try {
    localStorage.setItem(VERSION_KEY, String(version));
  } catch {
    // localStorage unavailable (private mode, quota exceeded)
  }
}

/** Read a logical key, falling back when absent or unparseable. */
export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Write a logical key. No-op writes are skipped to avoid storage thrash. */
export function writeStored(key, value) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  try {
    const serialized = JSON.stringify(value);
    if (localStorage.getItem(storageKey) === serialized) return;
    localStorage.setItem(storageKey, serialized);
  } catch {
    // localStorage unavailable (private mode, quota exceeded)
  }
}

/** Remove a logical key. */
export function removeStored(key) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // ignore
  }
}
