// Preset di difficoltà — vedi docs/spec-groove-master.md §4.
// Livelli cumulativi ereditati dall'originale Scratch; restano come scorciatoia,
// la modalità Custom permette di comporre un pool arbitrario.
function range(to) {
  return Array.from({ length: to }, (_, i) => i + 1);
}

export const PRESETS = {
  1: range(4),
  2: range(5),
  3: range(6),
  4: range(7),
  5: range(8),
  6: range(9),
  7: range(10),
  8: range(11),
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 8;

// Pedagogical level names (kept from the original classroom-tested labels).
export const LEVEL_NAMES = {
  1: 'Beginner',
  2: 'Capable',
  3: 'Intermediate',
  4: 'Effective',
  5: 'Experienced',
  6: 'Advanced',
  7: 'Distinguished',
  8: 'Master',
};

// Color for a level's difficulty, light green (easy) to dark red (hard),
// used to highlight the selected level chip.
export function levelColor(level) {
  const t = (level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);
  const hue = 120 - 120 * t;
  const lightness = 52 - 20 * t;
  const saturation = 55;
  return {
    bg: `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness.toFixed(0)}%)`,
    glow: `hsla(${hue.toFixed(0)}, ${saturation}%, ${lightness.toFixed(0)}%, 0.55)`,
    ink: lightness > 45 ? '#04141a' : '#f2fbff',
  };
}
