# Groove Master — porting web

Generatore di esercizi di lettura ritmica, porting da un progetto Scratch. La
specifica completa (dati, regole di generazione, audio, interfaccia) è in
[`docs/spec-groove-master.md`](docs/spec-groove-master.md).

## Stato

- [x] Schermata Home (metrica, difficoltà/preset con griglia figure sempre
      visibile ed editabile, validazione dello Start) — interfaccia in inglese
- [x] Sorteggio delle 4 battute (§5) e schermata di gioco con pentagramma
      semplificato (immagini delle figure su una riga per battuta)
- [x] Refresh (rigenera), Tip (mostra la sillabazione), Listen (ascolta la
      ritmica sorteggiata) e Metronomo (BPM + Start/Stop) nella schermata di
      gioco, come nell'originale Scratch + la nuova funzione Listen
- [x] Audio via Web Audio API con scheduling anticipato (§6): metronomo
      (campione registrato) e Listen (click sintetizzato via oscillatore,
      nessun campione di percussione registrato ancora)
- [x] Layout responsive: colonna singola su schermi stretti (telefono),
      due colonne su schermi larghi (tablet/PC, ≥860px) — stessi asset e tema
- [x] Asset grafici (figure, sillabe, fondali) e campioni audio caricati in `assets/`

Nota: l'interfaccia (testi, etichette) è in inglese per essere fruibile a
livello internazionale; documentazione e commenti restano in italiano.

### Prossimi passi

- Notazione musicale vera (pentagramma a 5 righe, es. VexFlow) al posto della
  semplice riga ritmica con le immagini delle figure (§8)
- Campione audio reale di percussione (legno/claves) al posto del click
  sintetizzato per "Listen"
- Eventuale sillabazione Gordon parlata durante l'ascolto (campioni
  `du.mp3`/`de.mp3`/`ta.mp3` già presenti ma non ancora usati)

## Sviluppo

Sito statico, nessuna build. Per servirlo in locale:

```
python3 -m http.server 8000
```

poi apri `http://localhost:8000`.

## Struttura

```
index.html             Home screen + schermata di gioco
src/js/figures.js       modello dati delle 11 figure ritmiche (§3)
src/js/presets.js       preset di difficoltà 1-8 + nomi + colori (§4)
src/js/state.js         stato persistito in localStorage
src/js/home.js          logica della schermata Home
src/js/sequence.js       generatore delle 4 battute (§5)
src/js/audio.js          motore Web Audio: metronomo + ascolto (§6)
src/js/game.js           logica della schermata di gioco
src/js/patternView.js    fallback visivo condiviso per figure senza immagine
assets/                 immagini e audio originali
docs/spec-groove-master.md   specifica completa del progetto
```
