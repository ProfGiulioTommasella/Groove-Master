# Groove Master — porting web

Generatore di esercizi di lettura ritmica, porting da un progetto Scratch. La
specifica completa (dati, regole di generazione, audio, interfaccia) è in
[`docs/spec-groove-master.md`](docs/spec-groove-master.md).

## Stato

- [x] Schermata Home (metrica, BPM, difficoltà/preset, selezione custom delle
      figure, metronomo on/off, validazione dello Start)
- [ ] Sorteggio delle 4 battute e schermata di gioco (pentagramma, Go!, Tip)
- [ ] Audio (metronomo, percussione, sillabazione Gordon) via Web Audio
- [x] Asset grafici (figure, sillabe, fondali) e campioni audio caricati in `assets/`
- [ ] Suono di percussione secco per l'ascolto della sola ritmica (non ancora registrato)

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
assets/                immagini e audio originali (da aggiungere)
docs/spec-groove-master.md   specifica completa del progetto
```
