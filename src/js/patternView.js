// Fallback rendering for a figure when its image asset is missing: draws
// the raw sixteenth-note pattern (N/-/.) as a small row of cells.
export function renderPatternCells(pattern) {
  const wrap = document.createElement('span');
  wrap.className = 'pattern';
  for (const ch of pattern) {
    const cell = document.createElement('span');
    cell.className = 'cell ' + (ch === 'N' ? 'attacco' : ch === '-' ? 'prolungamento' : 'silenzio');
    wrap.appendChild(cell);
  }
  return wrap;
}
