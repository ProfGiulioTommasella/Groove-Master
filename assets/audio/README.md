Campioni audio (vedi docs/spec-groove-master.md §6):
- `click.mp3` — click del metronomo, usato da `src/js/audio.js`
- `du.mp3`, `de.mp3`, `ta.mp3` — sillabazione Gordon, non ancora usati: il
  Tip attuale è solo visivo (mostra le immagini in `assets/syllables/`),
  come nell'originale Scratch; questi campioni restano disponibili per
  un'eventuale sillabazione parlata durante l'ascolto, in futuro.

Il suono di "Listen" (ascolto della sola ritmica) non usa un campione
registrato: è sintetizzato al volo in `src/js/audio.js` (un click secco
via Web Audio, timbro distinto dal metronomo). Si può sostituire con un
campione reale di legno/claves in un secondo momento senza cambiare la
logica di scheduling.
