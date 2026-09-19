// ── Tone tables for the tap sounds and the piano ──────────────────
export const NOTES = [
  261.63,
  293.66,
  329.63,
  392.0,
  440.0, // C4 D4 E4 G4 A4
  523.25,
  587.33,
  659.25,
  783.99,
  880.0, // C5 D5 E5 G5 A5
  1046.5,
  1174.66,
  1318.51,
  1567.98,
  1760.0, // C6 D6 E6 G6 A6
];

export const NUMBER_NOTES = [
  523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66,
  1318.51,
];

export const PIANO_KEYS = [
  { id: "C3", freq: 130.81, type: "white", label: "C", octave: 3 },
  { id: "Cs3", freq: 138.59, type: "black", label: "C" },
  { id: "D3", freq: 146.83, type: "white", label: "D", octave: 3 },
  { id: "Ds3", freq: 155.56, type: "black", label: "D" },
  { id: "E3", freq: 164.81, type: "white", label: "E", octave: 3 },
  { id: "F3", freq: 174.61, type: "white", label: "F", octave: 3 },
  { id: "Fs3", freq: 185.0, type: "black", label: "F" },
  { id: "G3", freq: 196.0, type: "white", label: "G", octave: 3 },
  { id: "Gs3", freq: 207.65, type: "black", label: "G" },
  { id: "A3", freq: 220.0, type: "white", label: "A", octave: 3 },
  { id: "As3", freq: 233.08, type: "black", label: "A" },
  { id: "B3", freq: 246.94, type: "white", label: "B", octave: 3 },
  { id: "C4", freq: 261.63, type: "white", label: "C", octave: 4 },
  { id: "Cs4", freq: 277.18, type: "black", label: "C" },
  { id: "D4", freq: 293.66, type: "white", label: "D", octave: 4 },
  { id: "Ds4", freq: 311.13, type: "black", label: "D" },
  { id: "E4", freq: 329.63, type: "white", label: "E", octave: 4 },
  { id: "F4", freq: 349.23, type: "white", label: "F", octave: 4 },
  { id: "Fs4", freq: 369.99, type: "black", label: "F" },
  { id: "G4", freq: 392.0, type: "white", label: "G", octave: 4 },
  { id: "Gs4", freq: 415.3, type: "black", label: "G" },
  { id: "A4", freq: 440.0, type: "white", label: "A", octave: 4 },
  { id: "As4", freq: 466.16, type: "black", label: "A" },
  { id: "B4", freq: 493.88, type: "white", label: "B", octave: 4 },
  { id: "C5", freq: 523.25, type: "white", label: "C", octave: 5 },
];

