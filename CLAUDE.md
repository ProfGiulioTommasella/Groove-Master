# Groove Master — CLAUDE.md

Generatore di esercizi di lettura ritmica. Porting web di un progetto Scratch.
Specifica completa: `docs/spec-groove-master.md`.

## Stack (zero build)

- **Vanilla JS ES modules** — nessun npm, nessun bundler, nessun framework
- **CSS** puro — nessun preprocessore
- **Web Audio API** — audio scheduling anticipato, nessuna libreria
- Servire in locale: `python3 -m http.server 8000` → `http://localhost:8000`
- Deploy: file statici, nessun server

## Struttura file

```
index.html              unico HTML — contiene Home + schermata di gioco
src/css/style.css       tutti gli stili, responsive ≥860px = due colonne
src/js/figures.js       FIGURES[] — 11 figure ritmiche, immutabile
src/js/presets.js       PRESETS{1..8} — pool figure per livello, immutabile
src/js/state.js         loadState/saveState via localStorage
src/js/home.js          logica Home (time, BPM, level, pool, Start)
src/js/sequence.js      generateSequence() — sorteggio 4 battute
src/js/audio.js         metronomo (campioni) + Listen (oscillatore)
src/js/game.js          logica schermata di gioco (Refresh, Tip, Listen)
src/js/patternView.js   fallback visivo per figure senza immagine
assets/figures/         01-minima.png … 11-sincope.png (figure ritmiche)
assets/audio/           click.mp3, de.mp3, du.mp3, ta.mp3, level-knob.mp3,
                        switch-on.mp3, switch-off.mp3, time-knob.mp3
docs/spec-groove-master.md   fonte di verità per regole, dati, audio
```

## Modello dati core

**Figure ritmiche** (`figures.js`) — pattern su griglia di semicrome:
`N` = attacco, `-` = prolungamento, `.` = silenzio.

| id | pattern | movimenti |
|---|---|---|
| 1–2 | `N-------` / `........` | 2 (minima/pausa) |
| 3–10 | `N---` … `..NN` | 1 |
| 11 | `N-N---N-` | 2 (sincope) |

**Stato persistito** (`state.js`, key `groove-master:home-config`):
`{ time: 2|3|4, bpm: 50–150 step 5, level: 1–8, pool: number[] }`

**Sequenza** (`sequence.js`): 4 battute × `time` movimenti.
Slot da 2 movimenti (minima/sincope) occupano posizioni consecutive.
Sul 4° movimento figure id 1,2,11 sono escluse.

## Invarianti — NON modificare senza discussione

- **Nessun build tool**: non aggiungere npm/package.json/webpack/vite/esbuild
- **Nessun framework**: non aggiungere React/Vue/Svelte o simili
- **Nessuna libreria audio**: Web Audio API diretta, non Tone.js o simili
- **Un solo HTML**: index.html gestisce entrambe le schermate
- **ES modules nativi**: `import`/`export`, nessun CommonJS
- **Interfaccia in inglese**, documentazione/commenti in italiano
- `FIGURES` e `PRESETS` sono dati fissi — non aggiungere logica lì dentro

## Pattern ricorrenti

**Cambio schermata:**
```js
document.getElementById('home-screen').hidden = true;
document.getElementById('game-screen').hidden = false;
```

**Import tipico:**
```js
import { FIGURES } from './figures.js';
import { loadState, saveState } from './state.js';
```

**Scheduling audio (audio.js):** usa `AudioContext.currentTime` + lookahead 100ms.
Non usare `setTimeout` per il timing musicale.

## Responsive

- **< 860px**: colonna singola, asset identici
- **≥ 860px**: due colonne (Home sinistra, info destra)
- Media query in `style.css`, nessun JS per il layout

## Branch e workflow

- Branch: `claude/descrizione-breve-vNUMERO` (es. `claude/groove-master-setup-v1`)
- Sempre sviluppare su branch, mai pushare su `main` direttamente
- Commit atomici per funzionalità, push finale con `git push -u origin <branch>`

## Come lavorare efficientemente (risparmio token)

- Leggere prima `docs/spec-groove-master.md §N` relevante, non esplorare a caso
- Per audio: leggere `audio.js` completo prima di modificarlo (stato condiviso `AudioContext`)
- Per il layout: `style.css` è unico file, grep prima di leggere tutto
- Non rileggere questo file ogni turno — è già in contesto

## Prossimi passi dichiarati

1. Pentagramma a 5 righe con VexFlow (§8 della spec)
2. Campione audio reale percussione (claves/legno) per Listen
3. Sillabazione Gordon parlata (`du.mp3`/`de.mp3`/`ta.mp3` già presenti)
