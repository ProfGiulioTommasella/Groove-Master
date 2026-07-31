// Modello dati delle figure ritmiche — vedi docs/spec-groove-master.md §3.
// pattern: un carattere per semicroma. N = attacco, - = prolungamento, . = silenzio.
export const FIGURES = [
  { id: 1, nome: 'minima', pattern: 'N-------', movimenti: 2,
    img: 'assets/figures/01-minima.png', imgSillabe: 'assets/syllables/01-minima-sillabe.png' },
  { id: 2, nome: 'pausa di minima', pattern: '........', movimenti: 2,
    img: 'assets/figures/02-pausa-minima.png', imgSillabe: 'assets/syllables/02-pausa-minima-sillabe.png' },
  { id: 3, nome: 'semiminima', pattern: 'N---', movimenti: 1,
    img: 'assets/figures/03-semiminima.png', imgSillabe: 'assets/syllables/03-semiminima-sillabe.png' },
  { id: 4, nome: 'pausa di semiminima', pattern: '....', movimenti: 1,
    img: 'assets/figures/04-pausa-semiminima.png', imgSillabe: 'assets/syllables/04-pausa-semiminima-sillabe.png' },
  { id: 5, nome: 'due crome', pattern: 'N-N-', movimenti: 1,
    img: 'assets/figures/05-due-crome.png', imgSillabe: 'assets/syllables/05-due-crome-sillabe.png' },
  { id: 6, nome: 'pausa di croma + croma', pattern: '..N-', movimenti: 1,
    img: 'assets/figures/06-pausa-croma-croma.png', imgSillabe: 'assets/syllables/06-pausa-croma-croma-sillabe.png' },
  { id: 7, nome: 'quattro semicrome', pattern: 'NNNN', movimenti: 1,
    img: 'assets/figures/07-quattro-semicrome.png', imgSillabe: 'assets/syllables/07-quattro-semicrome-sillabe.png' },
  { id: 8, nome: 'croma + due semicrome', pattern: 'N-NN', movimenti: 1,
    img: 'assets/figures/08-croma-due-semicrome.png', imgSillabe: 'assets/syllables/08-croma-due-semicrome-sillabe.png' },
  { id: 9, nome: 'due semicrome + croma', pattern: 'NNN-', movimenti: 1,
    img: 'assets/figures/09-due-semicrome-croma.png', imgSillabe: 'assets/syllables/09-due-semicrome-croma-sillabe.png' },
  { id: 10, nome: 'pausa di croma + due semicrome', pattern: '..NN', movimenti: 1,
    img: 'assets/figures/10-pausa-croma-due-semicrome.png', imgSillabe: 'assets/syllables/10-pausa-croma-due-semicrome-sillabe.png' },
  { id: 11, nome: 'sincope (croma + semiminima + croma)', pattern: 'N-N---N-', movimenti: 2,
    img: 'assets/figures/11-sincope.png', imgSillabe: 'assets/syllables/11-sincope-sillabe.png' },
];

export function figureById(id) {
  return FIGURES.find((f) => f.id === id);
}

// Regola §5.3: il pool è valido solo se contiene almeno una figura da 1 movimento
// tra gli id 3-10 (altrimenti l'ultimo movimento della battuta resta senza candidati).
export function isPoolValid(pool) {
  return pool.some((id) => id >= 3 && id <= 10);
}
