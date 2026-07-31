import { FIGURES, isPoolValid } from './figures.js';
import { PRESETS, MIN_LEVEL, MAX_LEVEL, LEVEL_NAMES, levelColor } from './presets.js';
import { loadState, saveState, DEFAULT_STATE } from './state.js';
import { renderPatternCells } from './patternView.js';
import { startGame, registerHomeReset } from './game.js';

function applyHomeDefaults(state) {
  state.time = DEFAULT_STATE.time;
  state.level = DEFAULT_STATE.level;
  state.pool = [...PRESETS[DEFAULT_STATE.level]];
}

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

export function initHome() {
  const state = loadState();
  // Time signature and difficulty always start over at 2/4 + Beginner,
  // both on first load and whenever Home is shown again; only BPM persists.
  applyHomeDefaults(state);

  const timeButtons = [...document.querySelectorAll('#time-group .chip')];
  const levelGroup = document.getElementById('level-group');
  const figurePicker = document.getElementById('figure-picker');
  const poolWarning = document.getElementById('pool-warning');
  const startBtn = document.getElementById('start-btn');

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
    for (const btn of levelGroup.querySelectorAll('.level-chip')) {
      btn.classList.toggle('active', Number(btn.dataset.level) === matchedLevel);
    }
    customIndicator.classList.toggle('active', matchedLevel === null);
  }

  function refreshStartUI() {
    const valid = isPoolValid(state.pool);
    startBtn.disabled = !valid;
    poolWarning.classList.toggle('hidden', valid);
  }

  function buildLevelGroup() {
    levelGroup.innerHTML = '';
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const color = levelColor(level);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip level-chip';
      btn.dataset.level = String(level);
      btn.title = `Level ${level}`;
      btn.textContent = LEVEL_NAMES[level];
      btn.style.setProperty('--level-color', color.bg);
      btn.style.setProperty('--level-glow', color.glow);
      btn.style.setProperty('--level-ink', color.ink);
      btn.addEventListener('click', () => {
        state.level = level;
        state.pool = [...PRESETS[level]];
        refreshLevelUI();
        renderFigurePicker();
        refreshStartUI();
        persist();
      });
      levelGroup.appendChild(btn);
    }

    const custom = document.createElement('span');
    custom.className = 'chip chip-custom';
    custom.textContent = 'Custom';
    custom.title = 'Lights up when the figure pool does not match a preset';
    levelGroup.appendChild(custom);
    return custom;
  }

  const customIndicator = buildLevelGroup();

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

  startBtn.addEventListener('click', () => {
    if (!isPoolValid(state.pool)) return;
    persist();
    startGame(state);
  });

  registerHomeReset(() => {
    applyHomeDefaults(state);
    persist();
    refreshTimeUI();
    refreshLevelUI();
    renderFigurePicker();
    refreshStartUI();
  });

  refreshTimeUI();
  refreshLevelUI();
  renderFigurePicker();
  refreshStartUI();
}
