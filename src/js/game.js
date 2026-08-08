import { figureById } from './figures.js';
import { generateSequence, sequenceToGrid } from './sequence.js';
import { createMetronome, playSequenceOnce, playUIClick } from './audio.js';
import { saveState, BPM_MIN, BPM_MAX, BPM_STEP } from './state.js';
import { renderPatternCells } from './patternView.js';

let currentState = null;
let currentSequence = [];
let tipOn = false;
let listenController = null;
let metronome = null;
let onHomeReset = null;

// Home registers a callback that resets its own state (time signature,
// difficulty) back to defaults; called whenever we navigate back there.
export function registerHomeReset(fn) {
  onHomeReset = fn;
}

const screenHome = document.getElementById('screen-home');
const screenGame = document.getElementById('screen-game');
const scoreEls = document.querySelectorAll('.js-score');
const bpmReadouts = document.querySelectorAll('.js-bpm-readout');
const bpmMinuses = document.querySelectorAll('.js-bpm-minus');
const bpmPluses = document.querySelectorAll('.js-bpm-plus');
const metronomeBtns = document.querySelectorAll('.js-metronome-btn');
const metronomeBtnImgs = document.querySelectorAll('.js-metronome-btn-img');
const refreshBtns = document.querySelectorAll('.js-refresh-btn');
const tipBtns = document.querySelectorAll('.js-tip-btn');
const listenBtns = document.querySelectorAll('.js-listen-btn');
const backHomeBtns = document.querySelectorAll('.js-back-home');

function refreshBpmUI() {
  bpmReadouts.forEach((img) => {
    img.src = `assets/game-vertical-v2/parts/bpm-${currentState.bpm}.png`;
    img.alt = `${currentState.bpm} BPM`;
  });
  bpmMinuses.forEach((btn) => { btn.disabled = currentState.bpm <= BPM_MIN; });
  bpmPluses.forEach((btn) => { btn.disabled = currentState.bpm >= BPM_MAX; });
}

function renderScore() {
  scoreEls.forEach((scoreEl) => {
    scoreEl.innerHTML = '';
    for (const bar of currentSequence) {
      const barEl = document.createElement('div');
      barEl.className = 'bar';
      // Fixed number of equal-width tracks (one per movement) so beat 1, 2, 3...
      // always start at the same x position across every bar, regardless of
      // which figure (and however oddly proportioned its image) fills a slot.
      barEl.style.gridTemplateColumns = `repeat(${currentState.time}, 1fr)`;
      for (const cell of bar) {
        const figure = figureById(cell.figureId);
        const cellEl = document.createElement('div');
        cellEl.className = 'score-cell';
        cellEl.style.gridColumn = `span ${cell.movements}`;

        const img = document.createElement('img');
        img.className = 'figure-img';
        img.src = tipOn ? figure.imgSyllables : figure.img;
        img.alt = figure.name;
        img.onerror = () => {
          img.replaceWith(renderPatternCells(figure.pattern));
        };
        cellEl.appendChild(img);
        barEl.appendChild(cellEl);
      }
      scoreEl.appendChild(barEl);
    }
  });
  annotateCellSteps();
}

// Tags every rendered cell with the [start, end) range of sixteenth-note
// indices it occupies in the flattened grid, so playback can highlight it.
function annotateCellSteps() {
  scoreEls.forEach((scoreEl) => {
    let index = 0;
    const cells = scoreEl.querySelectorAll('.score-cell');
    let i = 0;
    for (const bar of currentSequence) {
      for (const cell of bar) {
        const el = cells[i];
        const length = cell.movements * 4;
        el.dataset.start = String(index);
        el.dataset.end = String(index + length);
        index += length;
        i += 1;
      }
    }
  });
}

function highlightStep(stepIndex) {
  scoreEls.forEach((scoreEl) => {
    for (const el of scoreEl.querySelectorAll('.score-cell')) {
      const start = Number(el.dataset.start);
      const end = Number(el.dataset.end);
      el.classList.toggle('playing', stepIndex >= start && stepIndex < end);
    }
  });
}

function stopListen() {
  if (listenController) {
    listenController.stop();
    listenController = null;
  }
  // "Listen" is a static printed label on the console art, so playing state
  // is shown as a glow instead of swapping text (see .action-hit.active).
  listenBtns.forEach((btn) => btn.classList.remove('active'));
}

function stopMetronome() {
  if (metronome && metronome.isRunning) {
    metronome.stop();
  }
  metronomeBtnImgs.forEach((img) => { img.src = img.dataset.startSrc; });
}

bpmMinuses.forEach((btn) => btn.addEventListener('click', () => {
  playUIClick();
  currentState.bpm = Math.max(BPM_MIN, currentState.bpm - BPM_STEP);
  refreshBpmUI();
  saveState(currentState);
  // Listen bakes the BPM into its schedule up front (unlike the metronome,
  // which reads currentState.bpm live on every tick), so a mid-playback
  // change would silently keep playing at the old speed - stop it instead
  // and make the user re-trigger Listen to hear the new tempo.
  stopListen();
}));

bpmPluses.forEach((btn) => btn.addEventListener('click', () => {
  playUIClick();
  currentState.bpm = Math.min(BPM_MAX, currentState.bpm + BPM_STEP);
  refreshBpmUI();
  saveState(currentState);
  stopListen();
}));

metronomeBtns.forEach((btn) => btn.addEventListener('click', async () => {
  if (!metronome) metronome = createMetronome(() => currentState.bpm);
  if (metronome.isRunning) {
    stopMetronome();
  } else {
    stopListen();
    await metronome.start();
    metronomeBtnImgs.forEach((img) => { img.src = img.dataset.stopSrc; });
  }
}));

refreshBtns.forEach((btn) => btn.addEventListener('click', () => {
  playUIClick();
  stopListen();
  stopMetronome();
  // A new sequence should be sight-read, not handed over already solved -
  // Tip would otherwise carry over from the previous pattern.
  tipOn = false;
  tipBtns.forEach((b) => b.classList.remove('active'));
  currentSequence = generateSequence(currentState.pool, currentState.time);
  renderScore();
}));

tipBtns.forEach((btn) => btn.addEventListener('click', () => {
  // Skip the click while the Metronome or Listen is sounding - same reason
  // their own start controls stay silent: it reads as noise on top of an
  // already-running beat instead of distinct feedback.
  if (!(metronome && metronome.isRunning) && !listenController) {
    playUIClick();
  }
  tipOn = !tipOn;
  tipBtns.forEach((b) => b.classList.toggle('active', tipOn));
  renderScore();
}));

listenBtns.forEach((btn) => btn.addEventListener('click', () => {
  if (listenController) {
    stopListen();
    return;
  }
  stopMetronome();
  const grid = sequenceToGrid(currentSequence);
  listenBtns.forEach((b) => b.classList.add('active'));
  listenController = playSequenceOnce(grid, currentState.bpm, {
    countInBeats: currentState.time,
    onStep: highlightStep,
    onEnd: () => {
      listenController = null;
      listenBtns.forEach((b) => b.classList.remove('active'));
    },
  });
}));

backHomeBtns.forEach((btn) => btn.addEventListener('click', () => {
  playUIClick();
  stopListen();
  stopMetronome();
  onHomeReset?.();
  screenGame.classList.add('hidden');
  screenHome.classList.remove('hidden');
}));

export function startGame(state) {
  currentState = state;
  tipOn = false;
  tipBtns.forEach((b) => b.classList.remove('active'));
  stopListen();
  stopMetronome();
  currentSequence = generateSequence(currentState.pool, currentState.time);
  refreshBpmUI();
  renderScore();
  screenHome.classList.add('hidden');
  screenGame.classList.remove('hidden');
}
