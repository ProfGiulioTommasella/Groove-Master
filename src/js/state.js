import { PRESETS } from './presets.js';

const STORAGE_KEY = 'groove-master:home-config';

export const BPM_MIN = 60;
export const BPM_MAX = 120;
export const BPM_STEP = 5;

export const DEFAULT_STATE = {
  time: 2,
  bpm: 100,
  level: 1,
  pool: [...PRESETS[1]],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
