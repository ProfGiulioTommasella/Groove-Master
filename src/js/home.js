import { FIGURES, isPoolValid } from './figures.js';
import { PRESETS, MIN_LEVEL, MAX_LEVEL } from './presets.js';
import { loadState, saveState } from './state.js';

const BPM_MIN = 60;
const BPM_MAX = 120;
const BPM_STEP = 5;

function findPresetLevel(pool) {
  const sorted = [...pool].sort((a, b) => a - b);
  for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
    const preset = PRESETS[level];
    if (preset.length === sorted.length && preset.every((id, i) => id === sorted[i])) {
      return level;
    }
  }
  return null;
}

function renderPatternCells(pattern) {
  const wrap = document.createElement('span');
  wrap.className = 'pattern';
  for (const ch of pattern) {
    const cell = document.createElement('span');
    cell.className = 'cell ' + (ch === 'N' ? 'attacco' : ch === '-' ? 'prolungamento' : 'silenzio');
    wrap.appendChild(cell);
  }
  return wrap;
}

export function initHome() {
  const state = loadState();

  const timeButtons = [...document.querySelectorAll('#time-group .chip')];
  const levelButtons = [...document.querySelectorAll('#level-group .chip')];
  const figurePicker = document.getElementById('figure-picker');
  const bpmValue = document.getElementById('bpm-value');
  const bpmMinus = document.getElementById('bpm-minus');
  const bpmPlus = document.getElementById('bpm-plus');
  const metronomeToggle = document.getElementById('metronome-toggle');
  const metronomeLabel = document.getElementById('metronome-label');
  const poolWarning = document.getElementById('pool-warning');
  const startBtn = document.getElementById('start-btn');
  const screenHome = document.getElementById('screen-home');
  const screenGame = document.getElementById('screen-game');
  const gameConfig = document.getElementById('game-config');
  const backHomeBtn = document.getElementById('back-home');

  function persist() {
    saveState(state);
  }

  function refreshTimeUI() {
    for (const btn of timeButtons) {
      btn.classList.toggle('active', Number(btn.dataset.time) === state.time);
    }
  }

  function refreshLevelUI() {
    const matchedLevel = findPresetLevel(state.pool);
    for (const btn of levelButtons) {
      btn.classList.toggle('active', Number(btn.dataset.level) === matchedLevel);
    }
  }

  function refreshBpmUI() {
    bpmValue.textContent = String(state.bpm);
    bpmMinus.disabled = state.bpm <= BPM_MIN;
    bpmPlus.disabled = state.bpm >= BPM_MAX;
  }

  function refreshMetronomeUI() {
    metronomeToggle.checked = state.metronomeOn;
    metronomeLabel.textContent = state.metronomeOn ? 'On' : 'Off';
  }

  function refreshStartUI() {
    const valid = isPoolValid(state.pool);
    startBtn.disabled = !valid;
    poolWarning.classList.toggle('hidden', valid);
  }

  function renderFigurePicker() {
    figurePicker.innerHTML = '';
    for (const figure of FIGURES) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'figure-tile';
      tile.dataset.figureId = String(figure.id);
      tile.title = figure.name;
      tile.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));
      tile.classList.toggle('selected', state.pool.includes(figure.id));

      const img = document.createElement('img');
      img.className = 'figure-img';
      img.src = figure.img;
      img.alt = figure.name;
      img.onerror = () => {
        img.replaceWith(renderPatternCells(figure.pattern));
      };

      tile.appendChild(img);
      tile.addEventListener('click', () => {
        const idx = state.pool.indexOf(figure.id);
        if (idx >= 0) {
          state.pool.splice(idx, 1);
        } else {
          state.pool.push(figure.id);
        }
        tile.classList.toggle('selected', state.pool.includes(figure.id));
        tile.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));
        refreshLevelUI();
        refreshStartUI();
        persist();
      });

      figurePicker.appendChild(tile);
    }
  }

  timeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.time = Number(btn.dataset.time);
      refreshTimeUI();
      persist();
    });
  });

  levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.level = Number(btn.dataset.level);
      state.pool = [...PRESETS[state.level]];
      refreshLevelUI();
      renderFigurePicker();
      refreshStartUI();
      persist();
    });
  });

  bpmMinus.addEventListener('click', () => {
    state.bpm = Math.max(BPM_MIN, state.bpm - BPM_STEP);
    refreshBpmUI();
    persist();
  });

  bpmPlus.addEventListener('click', () => {
    state.bpm = Math.min(BPM_MAX, state.bpm + BPM_STEP);
    refreshBpmUI();
    persist();
  });

  metronomeToggle.addEventListener('change', () => {
    state.metronomeOn = metronomeToggle.checked;
    refreshMetronomeUI();
    persist();
  });

  startBtn.addEventListener('click', () => {
    if (!isPoolValid(state.pool)) return;
    persist();
    const summary = {
      timeSignature: `${state.time}/4`,
      bpm: state.bpm,
      metronome: state.metronomeOn ? 'on' : 'off',
      selectedFigures: state.pool
        .slice()
        .sort((a, b) => a - b)
        .map((id) => FIGURES.find((f) => f.id === id).name),
    };
    gameConfig.textContent = JSON.stringify(summary, null, 2);
    screenHome.classList.add('hidden');
    screenGame.classList.remove('hidden');
  });

  backHomeBtn.addEventListener('click', () => {
    screenGame.classList.add('hidden');
    screenHome.classList.remove('hidden');
  });

  refreshTimeUI();
  refreshLevelUI();
  refreshBpmUI();
  refreshMetronomeUI();
  renderFigurePicker();
  refreshStartUI();
}
