import { figureById } from './figures.js';
import { generateSequence, sequenceToGrid } from './sequence.js';
import { createMetronome, playSequenceOnce } from './audio.js';
import { saveState, BPM_MIN, BPM_MAX, BPM_STEP } from './state.js';
import { renderPatternCells } from './patternView.js';

let currentState = null;
let currentSequence = [];
let tipOn = false;
let listenController = null;
let metronome = null;

const screenHome = document.getElementById('screen-home');
const screenGame = document.getElementById('screen-game');
const scoreEl = document.getElementById('score');
const bpmValue = document.getElementById('bpm-value');
const bpmMinus = document.getElementById('bpm-minus');
const bpmPlus = document.getElementById('bpm-plus');
const metronomeBtn = document.getElementById('metronome-btn');
const refreshBtn = document.getElementById('refresh-btn');
const tipBtn = document.getElementById('tip-btn');
const listenBtn = document.getElementById('listen-btn');
const backHomeBtn = document.getElementById('back-home');

function refreshBpmUI() {
  bpmValue.textContent = String(currentState.bpm);
  bpmMinus.disabled = currentState.bpm <= BPM_MIN;
  bpmPlus.disabled = currentState.bpm >= BPM_MAX;
}

function renderScore() {
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
  annotateCellSteps();
}

// Tags every rendered cell with the [start, end) range of sixteenth-note
// indices it occupies in the flattened grid, so playback can highlight it.
function annotateCellSteps() {
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
}

function highlightStep(stepIndex) {
  for (const el of scoreEl.querySelectorAll('.score-cell')) {
    const start = Number(el.dataset.start);
    const end = Number(el.dataset.end);
    el.classList.toggle('playing', stepIndex >= start && stepIndex < end);
  }
}

function stopListen() {
  if (listenController) {
    listenController.stop();
    listenController = null;
  }
  listenBtn.textContent = '▶ Listen';
}

function stopMetronome() {
  if (metronome && metronome.isRunning) {
    metronome.stop();
  }
  metronomeBtn.textContent = '▶ Start';
}

bpmMinus.addEventListener('click', () => {
  currentState.bpm = Math.max(BPM_MIN, currentState.bpm - BPM_STEP);
  refreshBpmUI();
  saveState(currentState);
});

bpmPlus.addEventListener('click', () => {
  currentState.bpm = Math.min(BPM_MAX, currentState.bpm + BPM_STEP);
  refreshBpmUI();
  saveState(currentState);
});

metronomeBtn.addEventListener('click', async () => {
  if (!metronome) metronome = createMetronome(() => currentState.bpm);
  if (metronome.isRunning) {
    stopMetronome();
  } else {
    stopListen();
    await metronome.start();
    metronomeBtn.textContent = '■ Stop';
  }
});

refreshBtn.addEventListener('click', () => {
  stopListen();
  stopMetronome();
  currentSequence = generateSequence(currentState.pool, currentState.time);
  renderScore();
});

tipBtn.addEventListener('click', () => {
  tipOn = !tipOn;
  tipBtn.classList.toggle('active', tipOn);
  renderScore();
});

listenBtn.addEventListener('click', () => {
  if (listenController) {
    stopListen();
    return;
  }
  stopMetronome();
  const grid = sequenceToGrid(currentSequence);
  listenBtn.textContent = '■ Stop';
  listenController = playSequenceOnce(grid, currentState.bpm, {
    countInBeats: currentState.time,
    onStep: highlightStep,
    onEnd: () => {
      listenController = null;
      listenBtn.textContent = '▶ Listen';
    },
  });
});

backHomeBtn.addEventListener('click', () => {
  stopListen();
  stopMetronome();
  screenGame.classList.add('hidden');
  screenHome.classList.remove('hidden');
});

export function startGame(state) {
  currentState = state;
  tipOn = false;
  tipBtn.classList.remove('active');
  stopListen();
  stopMetronome();
  currentSequence = generateSequence(currentState.pool, currentState.time);
  refreshBpmUI();
  renderScore();
  screenHome.classList.add('hidden');
  screenGame.classList.remove('hidden');
}
