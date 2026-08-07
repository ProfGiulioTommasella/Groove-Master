import { figureById, isPoolValid } from './figures.js';
import { PRESETS, MIN_LEVEL, MAX_LEVEL } from './presets.js';
import { loadState, saveState, DEFAULT_STATE } from './state.js';
import { startGame, registerHomeReset } from './game.js';
import { playUIClick, playLeverClick, playTimeKnobClick, playLevelKnobClick } from './audio.js';

const TIME_SIGNATURES = [2, 3, 4];

// Exact rotation angles from the console design file (one knob graphic,
// spun to point at each value - there's no separate art per position).
const TIME_KNOB_ROTATION = { 2: -115, 3: 0, 4: 115 };
const LEVEL_KNOB_ROTATION = { 1: -145, 2: -115, 3: -90, 4: -45, 5: 0, 6: 45, 7: 90, 8: 115, 9: 145 };

// Left-to-right order of the 9 physical switches - fixed, matches the order
// the console artwork was designed in. Half note/rest (ids 1-2) have no
// switch of their own: they ride along automatically with every preset and
// every custom combination (see presets.js, every PRESETS entry starts at 1).
const PATTERN_FIGURE_IDS = [3, 4, 5, 6, 7, 8, 9, 10, 11];

const PARTS = 'assets/home-vertical-v2/parts/';

// Percentage positions measured directly off the console artwork's pixels
// (852x1846 canvas) - see assets/home-vertical-v2/parts/*.json for how these
// were derived. Only the LED/lever need per-column data: the readout boxes
// and knobs are single fixed positions handled in CSS.
const PATTERN_COLUMNS = [
  { led: 16.549, leverUp: 17.019, leverDown: 16.901 },
  { led: 24.061, leverUp: 24.531, leverDown: 24.413 },
  { led: 31.808, leverUp: 32.277, leverDown: 32.16 },
  { led: 39.671, leverUp: 40.141, leverDown: 40.023 },
  { led: 47.3, leverUp: 47.77, leverDown: 47.653 },
  { led: 55.047, leverUp: 55.516, leverDown: 55.399 },
  { led: 62.559, leverUp: 63.028, leverDown: 62.911 },
  { led: 70.305, leverUp: 70.775, leverDown: 70.657 },
  { led: 78.052, leverUp: 78.521, leverDown: 78.404 },
];

const PATTERN_SHARED = {
  ledTop: 72.86, ledWidth: 5.634, ledHeight: 2.546,
  leverUpTop: 74.81, leverUpWidth: 4.343, leverUpHeight: 7.259,
  leverDownTop: 79.198, leverDownWidth: 4.225, leverDownHeight: 7.313,
};

// Same idea, measured off the horizontal console artwork instead
// (assets/home-horizontal-v1/home-horizontal-console.png, 1338x704 canvas).
// The 9 lever slots there have no baked-in LED, so the LED sits in the gap
// to the slot's right, at the slot's vertical mid-height - side-by-side with
// the lever, matching the layout worked out by hand in elementi-2.png.
const PATTERN_COLUMNS_H = [9.492, 17.339, 25.187, 32.810, 40.583, 48.356, 56.129, 63.901, 71.525]
  .map((leverLeft) => ({
    leverLeft,
    led: leverLeft + 3.887, // slot centers are ~104px apart; +52px lands mid-gap
  }));

const PATTERN_SHARED_H = {
  leverWidth: 2.541, leverUpTop: 66.62, leverDownTop: 69.32, leverHeight: 13.92,
  ledTop: 74.36, ledWidth: 2.093, ledHeight: 3.977,
};

// The big idle screen's usable inner area (percent of the console box),
// measured off the artwork, divided into a 3x3 grid for the 9 tappable
// figure icons.
const FIG_SCREEN = { left: 10.56, top: 16.25, width: 79.23, height: 26 };
const FIG_SCREEN_H = { left: 23.916, top: 21.307, width: 50.822, height: 36.932 };
const FIG_COLS = 3;
const FIG_ROWS = 3;

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

  const timeReadouts = document.querySelectorAll('.js-time-readout');
  const levelReadouts = document.querySelectorAll('.js-level-readout');
  const timeKnobImgs = document.querySelectorAll('.js-time-knob-img');
  const levelKnobImgs = document.querySelectorAll('.js-level-knob-img');
  const timeKnobs = document.querySelectorAll('.js-time-knob');
  const levelKnobs = document.querySelectorAll('.js-level-knob');
  const figGrids = document.querySelectorAll('.js-fig-grid');
  const patternSlotsEls = document.querySelectorAll('.js-pattern-slots');
  const poolWarning = document.getElementById('pool-warning');
  const startBtns = document.querySelectorAll('.js-start-btn');

  function persist() {
    saveState(state);
  }

  function refreshTimeUI() {
    timeReadouts.forEach((img) => {
      img.src = `${PARTS}time-${state.time}.png`;
      img.alt = `Time signature ${state.time}/4`;
    });
    timeKnobImgs.forEach((img) => {
      img.style.transform = `rotate(${TIME_KNOB_ROTATION[state.time]}deg)`;
    });
  }

  function refreshLevelUI() {
    const matchedLevel = findPresetLevel(state.pool);
    const shown = matchedLevel ?? 9;
    levelReadouts.forEach((img) => {
      img.src = `${PARTS}level-${shown}.png`;
      img.alt = matchedLevel ? `Level ${matchedLevel}` : 'Level: Custom';
    });
    levelKnobImgs.forEach((img) => {
      img.style.transform = `rotate(${LEVEL_KNOB_ROTATION[shown]}deg)`;
    });
  }

  function refreshStartUI() {
    const valid = isPoolValid(state.pool);
    startBtns.forEach((btn) => {
      btn.disabled = !valid;
    });
    poolWarning.classList.toggle('hidden', valid);
  }

  function renderFigGrid(container) {
    const screen = container.dataset.layout === 'horizontal' ? FIG_SCREEN_H : FIG_SCREEN;
    container.innerHTML = '';
    const cellWidth = screen.width / FIG_COLS;
    const cellHeight = screen.height / FIG_ROWS;
    PATTERN_FIGURE_IDS.forEach((figureId, index) => {
      const engaged = state.pool.includes(figureId);
      const figure = figureById(figureId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fig-tap';
      btn.setAttribute('aria-pressed', String(engaged));
      btn.setAttribute('aria-label', figure.name);

      const col = index % FIG_COLS;
      const row = Math.floor(index / FIG_COLS);
      btn.style.left = `${screen.left + col * cellWidth}%`;
      btn.style.top = `${screen.top + row * cellHeight}%`;
      btn.style.width = `${cellWidth}%`;
      btn.style.height = `${cellHeight}%`;

      const img = document.createElement('img');
      img.src = `${PARTS}fig-${index + 1}-${engaged ? 'on' : 'off'}.png`;
      img.alt = '';
      btn.appendChild(img);

      btn.addEventListener('click', () => {
        const willEngage = !state.pool.includes(figureId);
        playLeverClick(willEngage);
        if (willEngage) {
          state.pool.push(figureId);
        } else {
          state.pool.splice(state.pool.indexOf(figureId), 1);
        }
        refreshLevelUI();
        renderAllFigGrids();
        renderAllPatternSlots();
        refreshStartUI();
        persist();
      });

      container.appendChild(btn);
    });
  }

  function renderAllFigGrids() {
    figGrids.forEach(renderFigGrid);
  }

  // The physical switches are a pure visual readout of the pool - they
  // mirror renderFigGrid()'s state but aren't clickable themselves (a
  // 9-lever row is too small a target on a phone; the big screen above is
  // the actual control surface).
  function renderPatternSlots(container) {
    const horizontal = container.dataset.layout === 'horizontal';
    container.innerHTML = '';
    PATTERN_FIGURE_IDS.forEach((figureId, index) => {
      const engaged = state.pool.includes(figureId);

      const led = document.createElement('div');
      led.className = 'pattern-slot-led';
      const ledImg = document.createElement('img');
      ledImg.src = `${PARTS}led-${engaged ? 'blue' : 'red'}.png`;
      ledImg.alt = '';
      led.appendChild(ledImg);

      const lever = document.createElement('div');
      lever.className = 'pattern-slot-lever';
      const leverImg = document.createElement('img');
      leverImg.src = `${PARTS}lever-${engaged ? 'up' : 'down'}.png`;
      leverImg.alt = '';
      lever.appendChild(leverImg);

      if (horizontal) {
        const col = PATTERN_COLUMNS_H[index];
        led.style.left = `${col.led}%`;
        led.style.top = `${PATTERN_SHARED_H.ledTop}%`;
        led.style.width = `${PATTERN_SHARED_H.ledWidth}%`;
        led.style.height = `${PATTERN_SHARED_H.ledHeight}%`;

        lever.style.left = `${col.leverLeft}%`;
        lever.style.top = `${engaged ? PATTERN_SHARED_H.leverUpTop : PATTERN_SHARED_H.leverDownTop}%`;
        lever.style.width = `${PATTERN_SHARED_H.leverWidth}%`;
        lever.style.height = `${PATTERN_SHARED_H.leverHeight}%`;
      } else {
        const col = PATTERN_COLUMNS[index];
        led.style.left = `${col.led}%`;
        led.style.top = `${PATTERN_SHARED.ledTop}%`;
        led.style.width = `${PATTERN_SHARED.ledWidth}%`;
        led.style.height = `${PATTERN_SHARED.ledHeight}%`;

        const leverLeft = engaged ? col.leverUp : col.leverDown;
        const leverTop = engaged ? PATTERN_SHARED.leverUpTop : PATTERN_SHARED.leverDownTop;
        const leverWidth = engaged ? PATTERN_SHARED.leverUpWidth : PATTERN_SHARED.leverDownWidth;
        const leverHeight = engaged ? PATTERN_SHARED.leverUpHeight : PATTERN_SHARED.leverDownHeight;
        lever.style.left = `${leverLeft}%`;
        lever.style.top = `${leverTop}%`;
        lever.style.width = `${leverWidth}%`;
        lever.style.height = `${leverHeight}%`;
      }

      container.append(led, lever);
    });
  }

  function renderAllPatternSlots() {
    patternSlotsEls.forEach(renderPatternSlots);
  }

  timeKnobs.forEach((knob) => {
    knob.addEventListener('click', () => {
      playTimeKnobClick();
      const index = TIME_SIGNATURES.indexOf(state.time);
      state.time = TIME_SIGNATURES[(index + 1) % TIME_SIGNATURES.length];
      refreshTimeUI();
      persist();
    });
  });

  levelKnobs.forEach((knob) => {
    knob.addEventListener('click', () => {
      playLevelKnobClick();
      state.level = state.level >= MAX_LEVEL ? MIN_LEVEL : state.level + 1;
      state.pool = [...PRESETS[state.level]];
      refreshLevelUI();
      renderAllFigGrids();
      renderAllPatternSlots();
      refreshStartUI();
      persist();
    });
  });

  startBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!isPoolValid(state.pool)) return;
      playUIClick();
      persist();
      startGame(state);
    });
  });

  registerHomeReset(() => {
    applyHomeDefaults(state);
    persist();
    refreshTimeUI();
    refreshLevelUI();
    renderAllFigGrids();
    renderAllPatternSlots();
    refreshStartUI();
  });

  refreshTimeUI();
  refreshLevelUI();
  renderAllFigGrids();
  renderAllPatternSlots();
  refreshStartUI();
}
