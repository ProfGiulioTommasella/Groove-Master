import { PRESETS } from './presets.js';

const STORAGE_KEY = 'groove-master:home-config';

export const DEFAULT_STATE = {
  time: 4,
  bpm: 100,
  level: 1,
  pool: [...PRESETS[1]],
  metronomeOn: false,
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
