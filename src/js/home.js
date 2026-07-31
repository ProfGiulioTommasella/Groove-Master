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
  const customGrid = document.getElementById('custom-figures');
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
    for (const btn of levelButtons) {
      const isCustomBtn = btn.dataset.level === 'custom';
      btn.classList.toggle('active', isCustomBtn ? state.customMode : Number(btn.dataset.level) === state.level);
    }
    customGrid.classList.toggle('hidden', !state.customMode);
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

  function renderCustomGrid() {
    customGrid.innerHTML = '';
    for (const figure of FIGURES) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'figure-tile';
      tile.dataset.figureId = String(figure.id);
      tile.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));
      tile.classList.toggle('selected', state.pool.includes(figure.id));

      const img = document.createElement('img');
      img.className = 'figure-img';
      img.src = figure.img;
      img.alt = figure.nome;
      img.onerror = () => {
        img.replaceWith(renderPatternCells(figure.pattern));
      };

      const name = document.createElement('span');
      name.className = 'figure-name';
      name.textContent = figure.nome;

      tile.append(img, name);
      tile.addEventListener('click', () => {
        if (!state.customMode) return;
        const idx = state.pool.indexOf(figure.id);
        if (idx >= 0) {
          state.pool.splice(idx, 1);
        } else {
          state.pool.push(figure.id);
        }
        tile.classList.toggle('selected', state.pool.includes(figure.id));
        tile.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));
        refreshStartUI();
        persist();
      });

      customGrid.appendChild(tile);
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
      if (btn.dataset.level === 'custom') {
        state.customMode = true;
      } else {
        state.customMode = false;
        state.level = Number(btn.dataset.level);
        state.pool = [...PRESETS[state.level]];
      }
      refreshLevelUI();
      renderCustomGrid();
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
      metrica: `${state.time}/4`,
      bpm: state.bpm,
      livello: state.customMode ? 'custom' : state.level,
      metronomo: state.metronomeOn ? 'on' : 'off',
      figureSelezionate: state.pool
        .slice()
        .sort((a, b) => a - b)
        .map((id) => FIGURES.find((f) => f.id === id).nome),
    };
    gameConfig.textContent = JSON.stringify(summary, null, 2);
    screenHome.classList.add('hidden');
    screenGame.classList.remove('hidden');
  });

  backHomeBtn.addEventListener('click', () => {
    screenGame.classList.add('hidden');
    screenHome.classList.remove('hidden');
  });

  // Se il pool caricato da localStorage combacia con un preset, riallinea il livello;
  // altrimenti è una selezione custom salvata in precedenza.
  const matchedLevel = findPresetLevel(state.pool);
  if (matchedLevel && !state.customMode) {
    state.level = matchedLevel;
  } else if (!matchedLevel) {
    state.customMode = true;
  }

  refreshTimeUI();
  refreshLevelUI();
  refreshBpmUI();
  refreshMetronomeUI();
  renderCustomGrid();
  refreshStartUI();
}
