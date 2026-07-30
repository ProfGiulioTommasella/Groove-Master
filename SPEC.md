# Groove Master — specifica per il porting web

Documento di passaggio. Contiene tutto ciò che è stato ricavato dal progetto Scratch
originale (`Groove_Master.sb3`, estratto dall'HTML impacchettato con TurboWarp) più le
decisioni di design prese per la versione web. Chi riprende il lavoro non ha bisogno di
aprire il progetto Scratch: qui c'è il modello completo.

---

## 1. Cos'è

Generatore di esercizi di lettura ritmica per allievi di scuola media / primi anni di
strumento. Il programma sorteggia 4 battute di ritmica, l'allievo le legge battendo le
mani o su uno strumento, con metronomo. Due aiuti: la sillabazione secondo il metodo
Gordon e l'ascolto del modello.

## 2. Cosa esisteva in Scratch

Griglia fissa di **4 battute × 4 movimenti = 16 slot**, ciascuno gestito da uno sprite
separato (`1° Q 1^ B` … `4° Q 4^ B`).

Variabili globali rilevanti:

| variabile | valori | significato |
|---|---|---|
| `TIME` | 2, 3, 4 | movimenti per battuta (2/4, 3/4, 4/4) |
| `BPM` | 60→120 a passi di 5 | tempo del metronomo |
| `Level:` | 1→8 | difficoltà (vedi §4) |
| `Metronomo` | on / off | |
| `GAME` | intro / play | schermata attiva |
| `2°q - 1^b` … `4°q - 4^b` | free / no | slot occupato da una figura di 2 movimenti |
| `Notes avail.` | lista | creata e mai usata nell'originale |

Il sorteggio avveniva così: ogni sprite eseguiva
`passa al costume (numero casuale tra 1 e N)` dove N dipendeva solo dal livello.
I costumi 1–11 sono le figure ritmiche in ordine di difficoltà crescente; i costumi
12–22 sono le stesse figure con la sillabazione stampata sotto (usate dal pulsante Tip).
Lo sprite del 4° movimento ha una numerazione sfalsata: i suoi costumi 1–8
corrispondono alle figure globali 3–10, perché sul quarto movimento le figure da due
tempi sono escluse.

Il metronomo era già implementato con l'estensione Music:
`ripeti fino a che Metronomo = off → imposta tempo a BPM; suona tamburo 9 per 1 battiti`.
Nessun altro audio esisteva: la ritmica non si poteva ascoltare.

## 3. Modello dati delle figure

Ogni figura è codificata su una **griglia di semicrome**: un carattere per semicroma,
quattro caratteri per movimento. `N` = attacco, `-` = prolungamento, `.` = silenzio.

| id | figura | pattern | movimenti |
|---|---|---|---|
| 1 | minima | `N-------` | 2 |
| 2 | pausa di minima | `........` | 2 |
| 3 | semiminima | `N---` | 1 |
| 4 | pausa di semiminima | `....` | 1 |
| 5 | due crome | `N-N-` | 1 |
| 6 | pausa di croma + croma | `..N-` | 1 |
| 7 | quattro semicrome | `NNNN` | 1 |
| 8 | croma + due semicrome | `N-NN` | 1 |
| 9 | due semicrome + croma | `NNN-` | 1 |
| 10 | pausa di croma + due semicrome | `..NN` | 1 |
| 11 | sincope: croma + semiminima + croma | `N-N---N-` | 2 |

> Da verificare con l'autore: l'ordine di 8 e 9 è dedotto dalle immagini.

Struttura suggerita:

```js
{ id: 5, nome: 'due crome', pattern: 'N-N-', movimenti: 1,
  img: 'figures/05-due-crome.png', imgSillabe: 'syllables/05-due-crome-sillabe.png' }
```

La griglia di una battuta completa è la concatenazione dei pattern dei suoi slot; una
sessione in 4/4 dà 64 caratteri (4 battute × 4 movimenti × 4 semicrome).

## 4. Selezione delle figure

L'originale aveva 8 livelli **cumulativi**: il livello era solo il tetto superiore del
sorteggio (liv. 1 → figure 1–4, liv. 2 → 1–5, … liv. 8 → 1–11). Impossibile scegliere
figure singole.

Nella versione web la difficoltà diventa un **insieme di id selezionati** (`pool`).
Gli 8 livelli restano come **preset** che riempiono il pool:

```
preset[1] = [1,2,3,4]      preset[5] = [1..8]
preset[2] = [1..5]         preset[6] = [1..9]
preset[3] = [1..6]         preset[7] = [1..10]
preset[4] = [1..7]         preset[8] = [1..11]
```

più una modalità **Custom** in cui l'utente attiva o disattiva ogni figura
singolarmente. Nel progetto Scratto le icone di questa schermata esistono già (sprite
`Minima`, `Semimin`, `Croma`, `Semicr`, `Opz Agg 0`…`Opz agg 5`), ciascuna con costume
attivo e spento.

Opzionale, utile didatticamente: un id ripetuto nel pool aumenta la sua probabilità di
uscita, così si può insistere su una figura appena introdotta.

## 5. Regole di generazione

1. Le figure 1, 2 e 11 occupano **due movimenti**: il generatore deve marcare lo slot
   successivo come occupato e saltarlo. Nell'originale questo controllo era duplicato
   dentro ogni ramo di livello; nella versione web deriva direttamente da
   `figura.movimenti === 2`.
2. Le figure da due movimenti **non possono cadere sull'ultimo movimento** della
   battuta (nell'originale erano escluse dal 4° movimento; con `TIME` variabile la
   regola giusta è: nessuna figura da 2 movimenti sull'ultimo movimento, qualunque
   sia la metrica).
3. Il pool non può essere vuoto, e non può contenere **solo** figure da due movimenti,
   altrimenti l'ultimo movimento resta senza candidati. Vincolo minimo: almeno una
   figura tra gli id 3–10. L'interfaccia deve impedire lo Start, non fallire in
   silenzio.
4. Con `TIME` = 2 o 3 gli slot oltre il terzo/secondo non esistono.

## 6. Audio

Tre funzioni distinte, tutte sulla stessa griglia di semicrome.

**Metronomo** — un click per movimento, indipendente dalla ritmica, attivabile da
solo. Timbro distinto dagli altri due.

**Percussione** — un colpo secco su ogni `N` della griglia. Legno o claves: attacco
netto, decadimento breve, nessuna intonazione che distragga.

**Sillabazione Gordon** — la sillaba dipende **solo dalla posizione metrica**, non
dalla figura. Divisione binaria: `Du` sul movimento, `De` a metà, `Ta` sui quarti.
Quindi, per un attacco all'indice `i` della griglia:

```js
const sillaba = ['Du', 'Ta', 'De', 'Ta'][i % 4];
```

Bastano **tre campioni** (Du, De, Ta) per coprire tutte le figure e tutte le
combinazioni future. Registrarli corti e secchi, attacco entro ~20 ms.
Aggiungendo `Du Da Di` si copre la divisione ternaria e si apre il 6/8, non previsto
nella versione attuale.

**Scheduling.** Questo è il motivo principale del porting: Scratch gira a 30 fps, cioè
con granularità di 33 ms, e una semicroma a 100 bpm dura 150 ms — il tremolio è
udibile proprio sulle figure dove serve precisione. Usare Web Audio con
programmazione anticipata (`AudioBufferSourceNode.start(when)` su `audioContext.currentTime`,
look‑ahead ~100 ms), **non** `setInterval` né `setTimeout` per gli attacchi.
Durata di una semicroma: `15 / BPM` secondi.

L'evidenziazione visiva della nota in riproduzione va sincronizzata leggendo
`audioContext.currentTime` in un `requestAnimationFrame`, non contando i frame.

## 7. Interfaccia

Schermate dell'originale (immagini in `assets/screens/`):

- **Home** — scelta metrica (2/4, 3/4, 4/4), BPM ±, difficoltà, metronomo on/off, Start.
- **Gioco** — pentagramma con le 4 battute generate, pulsante **Go!** (rigenera),
  pulsante **Tip** (mostra la sillabazione sotto le note), ritorno alla home.

Da aggiungere: selezione custom delle figure (§4) e i due pulsanti di ascolto (§6),
idealmente come un unico controllo a tre stati — silenzio / percussione / sillabe.

## 8. Asset

In `assets/` ci sono i PNG originali estratti dal progetto Scratch:

- `figures/` — le 11 figure, senza sillabazione
- `syllables/` — le stesse 11 figure con la sillabazione stampata sotto
- `screens/` — i 4 fondali (home + le tre schermate di gioco per 2/4, 3/4, 4/4)

Usarli così com'è per la prima versione mantiene identico l'aspetto e permette di
confrontare vecchio e nuovo. In un secondo momento si può valutare la resa della
notazione con un font musicale (Bravura/SMuFL) o con VexFlow, che renderebbe possibili
metriche e figure non previste dal set di immagini.

## 9. Punti aperti

- Ordine delle figure 8 e 9 da confermare.
- Le sillabe stampate nei costumi Tip vanno confrontate con la convenzione
  `Du / De / Ta`: se l'autore ha usato una notazione diversa, sono i nomi dei tre
  campioni a doversi adeguare, non il codice.
- I tre campioni audio (Du, De, Ta) e il suono di percussione vanno registrati o
  scelti: non esistono nel progetto originale.
- Valutare se conservare la griglia fissa di 4 battute o renderla configurabile.
