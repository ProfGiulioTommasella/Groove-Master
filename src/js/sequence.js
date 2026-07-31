// 4-bar sequence generation — see docs/spec-groove-master.md §5.
import { figureById } from './figures.js';

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// One bar is a list of cells (figure id + how many movements it occupies).
// Sum of cell.movements across a bar always equals `time`.
function generateBar(pool, time) {
  const oneMovers = pool.filter((id) => figureById(id).movements === 1);
  const twoMovers = pool.filter((id) => figureById(id).movements === 2);

  const cells = [];
  let remaining = time;
  while (remaining > 0) {
    // Rule §5.2: a two-movement figure can never land on the bar's last
    // movement, so it's only a candidate while more than 2 movements remain.
    const candidates = remaining > 2 ? [...oneMovers, ...twoMovers] : oneMovers;
    const figureId = pickRandom(candidates);
    const movements = figureById(figureId).movements;
    cells.push({ figureId, movements });
    remaining -= movements;
  }
  return cells;
}

export const BARS_PER_SEQUENCE = 4;

export function generateSequence(pool, time) {
  return Array.from({ length: BARS_PER_SEQUENCE }, () => generateBar(pool, time));
}

// Concatenates every cell's sixteenth-note pattern into one grid string,
// used for audio scheduling and syllable lookup (§3, §6).
export function sequenceToGrid(sequence) {
  return sequence
    .flat()
    .map((cell) => figureById(cell.figureId).pattern)
    .join('');
}
