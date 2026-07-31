# Groove Master — porting web

Generatore di esercizi di lettura ritmica, porting da un progetto Scratch. La
specifica completa (dati, regole di generazione, audio, interfaccia) è in
[`docs/spec-groove-master.md`](docs/spec-groove-master.md).

## Stato

- [x] Schermata Home (metrica, difficoltà/preset con griglia figure sempre
      visibile ed editabile, validazione dello Start) — interfaccia in inglese
- [x] BPM e Metronomo spostati nella schermata di gioco (come nell'originale
      Scratch, dove erano disponibili solo durante il gioco)
- [ ] Sorteggio delle 4 battute e schermata di gioco vera (pentagramma, Go!, Tip)
- [ ] Audio (metronomo, percussione, sillabazione Gordon) via Web Audio
- [x] Asset grafici (figure, sillabe, fondali) e campioni audio caricati in `assets/`
- [ ] Suono di percussione secco per l'ascolto della sola ritmica (non ancora registrato)

Nota: l'interfaccia (testi, etichette) è in inglese per essere fruibile a
livello internazionale; documentazione e commenti restano in italiano.

## Sviluppo

Sito statico, nessuna build. Per servirlo in locale:

```
python3 -m http.server 8000
```

poi apri `http://localhost:8000`.

## Struttura

```
index.html            Home screen + stub schermata di gioco
src/js/figures.js      modello dati delle 11 figure ritmiche (§3)
src/js/presets.js      preset di difficoltà 1-8 (§4)
src/js/state.js        stato persistito in localStorage
src/js/home.js         logica della schermata Home
assets/                immagini e audio originali
docs/spec-groove-master.md   specifica completa del progetto
```
