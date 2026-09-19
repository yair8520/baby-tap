import he from "./he.json";
import en from "./en.json";

const translations = { he, en };

export const SUPPORTED_LANGS = Object.keys(translations);
export const DEFAULT_LANG = "en";
export const RTL_LANGS = ["he"];

/** Is the given language written right-to-left? */
export function isRtl(lang) {
  return RTL_LANGS.includes(lang);
}

/** Text direction attribute value for a language. */
export function dirFor(lang) {
  return isRtl(lang) ? "rtl" : "ltr";
}

function lookup(dict, parts) {
  let val = dict;
  for (const part of parts) {
    if (val == null) break;
    val = val[part];
  }
  return val;
}

/**
 * Returns the translation for a dot-notation key, e.g. "games.classic".
 * Supports {{variable}} interpolation and falls back to English.
 */
export function getT(lang) {
  const dict = translations[lang] ?? translations[DEFAULT_LANG];

  return function t(key, vars = {}) {
    const parts = key.split(".");
    let val = lookup(dict, parts);
    if (val == null) val = lookup(translations[DEFAULT_LANG], parts) ?? key;
    if (typeof val !== "string") return key;
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`,
    );
  };
}

/**
 * Resolve a colocated `{ he, en }` label from level data. Stage labels stay next
 * to the stage they describe; this is the one sanctioned way to read them.
 */
export function localize(value, lang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value[DEFAULT_LANG] ?? Object.values(value)[0] ?? "";
}

/** Convenience: get all translations for a given lang */
export function getTranslations(lang) {
  return translations[lang] ?? translations[DEFAULT_LANG];
}
