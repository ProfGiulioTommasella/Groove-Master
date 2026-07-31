// Rhythmic figure data model — see docs/spec-groove-master.md §3.
// pattern: one character per sixteenth note. N = attack, - = sustain, . = rest.
export const FIGURES = [
  { id: 1, name: 'half note', pattern: 'N-------', movements: 2,
    img: 'assets/figures/01-minima.png', imgSyllables: 'assets/syllables/01-minima-sillabe.png' },
  { id: 2, name: 'half rest', pattern: '........', movements: 2,
    img: 'assets/figures/02-pausa-minima.png', imgSyllables: 'assets/syllables/02-pausa-minima-sillabe.png' },
  { id: 3, name: 'quarter note', pattern: 'N---', movements: 1,
    img: 'assets/figures/03-semiminima.png', imgSyllables: 'assets/syllables/03-semiminima-sillabe.png' },
  { id: 4, name: 'quarter rest', pattern: '....', movements: 1,
    img: 'assets/figures/04-pausa-semiminima.png', imgSyllables: 'assets/syllables/04-pausa-semiminima-sillabe.png' },
  { id: 5, name: 'two eighth notes', pattern: 'N-N-', movements: 1,
    img: 'assets/figures/05-due-crome.png', imgSyllables: 'assets/syllables/05-due-crome-sillabe.png' },
  { id: 6, name: 'eighth rest + eighth note', pattern: '..N-', movements: 1,
    img: 'assets/figures/06-pausa-croma-croma.png', imgSyllables: 'assets/syllables/06-pausa-croma-croma-sillabe.png' },
  { id: 7, name: 'four sixteenth notes', pattern: 'NNNN', movements: 1,
    img: 'assets/figures/07-quattro-semicrome.png', imgSyllables: 'assets/syllables/07-quattro-semicrome-sillabe.png' },
  { id: 8, name: 'eighth note + two sixteenths', pattern: 'N-NN', movements: 1,
    img: 'assets/figures/08-croma-due-semicrome.png', imgSyllables: 'assets/syllables/08-croma-due-semicrome-sillabe.png' },
  { id: 9, name: 'two sixteenths + eighth note', pattern: 'NNN-', movements: 1,
    img: 'assets/figures/09-due-semicrome-croma.png', imgSyllables: 'assets/syllables/09-due-semicrome-croma-sillabe.png' },
  { id: 10, name: 'eighth rest + two sixteenths', pattern: '..NN', movements: 1,
    img: 'assets/figures/10-pausa-croma-due-semicrome.png', imgSyllables: 'assets/syllables/10-pausa-croma-due-semicrome-sillabe.png' },
  { id: 11, name: 'syncopation (eighth + quarter + eighth)', pattern: 'N-N---N-', movements: 2,
    img: 'assets/figures/11-sincope.png', imgSyllables: 'assets/syllables/11-sincope-sillabe.png' },
];

export function figureById(id) {
  return FIGURES.find((f) => f.id === id);
}

// Rule §5.3: the pool is valid only if it contains at least one one-movement
// figure among ids 3-10 (otherwise the last movement of the bar has no candidate).
export function isPoolValid(pool) {
  return pool.some((id) => id >= 3 && id <= 10);
}
