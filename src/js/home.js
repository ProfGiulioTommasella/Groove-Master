import { FIGURES, isPoolValid } from './figures.js';
import { PRESETS, MIN_LEVEL, MAX_LEVEL, LEVEL_NAMES, levelColor } from './presets.js';
import { loadState, saveState, DEFAULT_STATE } from './state.js';
import { renderPatternCells } from './patternView.js';
import { startGame, registerHomeReset } from './game.js';
import { playUIClick, playLeverClick } from './audio.js';

const TIME_SIGNATURES = [2, 3, 4];
const KNOB_ARC_DEGREES = 270;

function angleForIndex(index, steps) {
  if (steps <= 1) return 0;
  return -KNOB_ARC_DEGREES / 2 + (index * KNOB_ARC_DEGREES) / (steps - 1);
}

// A stepped rotary knob: click (or Enter/Space) advances to the next
// position and wraps around. No drag gesture, so it stays reliable on
// touch devices - the physical feel comes from the animated pointer
// rotation and tick marks, not from drag physics.
function createKnob(container, { steps, onAdvance }) {
  container.innerHTML = '';

  const ticks = document.createElement('div');
  ticks.className = 'knob-ticks';
  for (let i = 0; i < steps; i += 1) {
    const tick = document.createElement('span');
    tick.className = 'knob-tick';
    // translate pushes the tick outward from the knob's center, along its
    // own (already rotated) axis, to sit just outside the face ring.
    tick.style.transform = `rotate(${angleForIndex(i, steps)}deg) translate(0, -34px)`;
    ticks.appendChild(tick);
  }

  const face = document.createElement('div');
  face.className = 'knob-face';
  const pointer = document.createElement('div');
  pointer.className = 'knob-pointer';
  face.appendChild(pointer);

  container.append(ticks, face);

  container.addEventListener('click', () => {
    playUIClick();
    onAdvance();
  });
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playUIClick();
      onAdvance();
    }
  });

  return {
    setIndex(index, color) {
      pointer.style.transform = `rotate(${angleForIndex(index, steps)}deg)`;
      if (color) {
        pointer.style.background = color.bg;
        pointer.style.boxShadow = `0 0 8px ${color.glow}`;
      }
    },
  };
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

function applyHomeDefaults(state) {
  state.time = DEFAULT_STATE.time;
  state.level = DEFAULT_STATE.level;
  state.pool = [...PRESETS[DEFAULT_STATE.level]];
}

export function initHome() {
  const state = loadState();
  // Time signature and difficulty always start over at 2/4 + Beginner,
  // both on first load and whenever Home is shown again; only BPM persists.
  applyHomeDefaults(state);

  const timeKnobEl = document.getElementById('time-knob');
  const levelKnobEl = document.getElementById('level-knob');
  const customIndicator = document.getElementById('custom-indicator');
  const displayTime = document.getElementById('display-time');
  const displayLevel = document.getElementById('display-level');
  const figurePicker = document.getElementById('figure-picker');
  const poolWarning = document.getElementById('pool-warning');
  const startBtn = document.getElementById('start-btn');

  function persist() {
    saveState(state);
  }

  function refreshTimeUI() {
    const index = TIME_SIGNATURES.indexOf(state.time);
    timeKnob.setIndex(index);
    displayTime.textContent = `${state.time}/4`;
  }

  function refreshLevelUI() {
    const matchedLevel = findPresetLevel(state.pool);
    levelKnob.setIndex(state.level - MIN_LEVEL, levelColor(state.level));
    displayLevel.textContent = matchedLevel ? LEVEL_NAMES[matchedLevel] : 'Custom';
    customIndicator.classList.toggle('active', matchedLevel === null);
  }

  function refreshStartUI() {
    const valid = isPoolValid(state.pool);
    startBtn.disabled = !valid;
    poolWarning.classList.toggle('hidden', valid);
  }

  const timeKnob = createKnob(timeKnobEl, {
    steps: TIME_SIGNATURES.length,
    onAdvance: () => {
      const index = TIME_SIGNATURES.indexOf(state.time);
      state.time = TIME_SIGNATURES[(index + 1) % TIME_SIGNATURES.length];
      refreshTimeUI();
      persist();
    },
  });

  const levelKnob = createKnob(levelKnobEl, {
    steps: MAX_LEVEL - MIN_LEVEL + 1,
    onAdvance: () => {
      state.level = state.level >= MAX_LEVEL ? MIN_LEVEL : state.level + 1;
      state.pool = [...PRESETS[state.level]];
      refreshLevelUI();
      renderFigurePicker();
      refreshStartUI();
      persist();
    },
  });

  function renderFigurePicker() {
    figurePicker.innerHTML = '';
    for (const figure of FIGURES) {
      const lever = document.createElement('button');
      lever.type = 'button';
      lever.className = 'lever-unit';
      lever.dataset.figureId = String(figure.id);
      lever.title = figure.name;
      lever.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));

      const img = document.createElement('img');
      img.className = 'figure-img';
      img.src = figure.img;
      img.alt = figure.name;
      img.onerror = () => {
        img.replaceWith(renderPatternCells(figure.pattern));
      };

      const track = document.createElement('span');
      track.className = 'lever-track';
      const led = document.createElement('span');
      led.className = 'lever-led';
      const thumb = document.createElement('span');
      thumb.className = 'lever-thumb';
      track.append(led, thumb);

      lever.append(img, track);
      lever.classList.toggle('engaged', state.pool.includes(figure.id));

      lever.addEventListener('click', () => {
        const idx = state.pool.indexOf(figure.id);
        const willEngage = idx < 0;
        playLeverClick(willEngage);
        if (idx >= 0) {
          state.pool.splice(idx, 1);
        } else {
          state.pool.push(figure.id);
        }
        lever.classList.toggle('engaged', state.pool.includes(figure.id));
        lever.setAttribute('aria-pressed', String(state.pool.includes(figure.id)));
        refreshLevelUI();
        refreshStartUI();
        persist();
      });

      figurePicker.appendChild(lever);
    }
  }

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
