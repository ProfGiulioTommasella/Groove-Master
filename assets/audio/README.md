Campioni audio non ancora usati dal codice (vedi docs/spec-groove-master.md §6):
- `click.mp3` — provato per il click del metronomo, ma il suono sintetizzato
  (vedi sotto) è stato preferito e usato al suo posto
- `du.mp3`, `de.mp3`, `ta.mp3` — sillabazione Gordon, non ancora usati: il
  Tip attuale è solo visivo (mostra le immagini in `assets/syllables/`),
  come nell'originale Scratch; questi campioni restano disponibili per
  un'eventuale sillabazione parlata durante l'ascolto, in futuro.

Tutto l'audio attuale (Metronomo e Listen) è sintetizzato al volo in
`src/js/audio.js` via Web Audio (timbri diversi per distinguere le due
funzioni). Si può sostituire con campioni reali in un secondo momento
senza cambiare la logica di scheduling.
