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
