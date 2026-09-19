/** Localized display name for a piano song entry. */
export function songDisplayName(song, lang = "he") {
  if (!song?.name) return "";
  if (typeof song.name === "string") return song.name;
  return song.name[lang] || song.name.he || song.name.en || "";
}
