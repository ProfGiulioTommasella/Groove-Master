// Web Audio playback — see docs/spec-groove-master.md §6.
// Lookahead scheduling only: audio start times always come from precise
// AudioContext.currentTime math passed to AudioBufferSourceNode.start(when)/
// oscillator envelopes, never from setTimeout/setInterval firing directly.

let audioContext = null;
const bufferCache = new Map();

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

async function loadBuffer(ctx, url) {
  if (bufferCache.has(url)) return bufferCache.get(url);
  const promise = fetch(url)
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data));
  bufferCache.set(url, promise);
  return promise;
}

function playBuffer(ctx, buffer, when) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(when);
}

// No percussion sample exists yet (see assets/audio/README.md), so the
// rhythm-listen click is synthesized: a short, dry, unpitched-sounding tick.
function playSyntheticTick(ctx, when, { frequency = 1400, duration = 0.05 } = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.35, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration);
}

const LOOKAHEAD_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

// Metronome: independent click running at a live BPM until stopped.
export function createMetronome(getBpm) {
  let timerId = null;
  let nextClickTime = 0;
  let clickBuffer = null;

  function scheduleTick() {
    const ctx = getContext();
    while (nextClickTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      if (clickBuffer) {
        playBuffer(ctx, clickBuffer, nextClickTime);
      } else {
        playSyntheticTick(ctx, nextClickTime, { frequency: 1800, duration: 0.04 });
      }
      nextClickTime += 60 / getBpm();
    }
  }

  return {
    async start() {
      const ctx = getContext();
      clickBuffer = await loadBuffer(ctx, 'assets/audio/click.mp3').catch(() => null);
      nextClickTime = ctx.currentTime + 0.05;
      scheduleTick();
      timerId = window.setInterval(scheduleTick, LOOKAHEAD_INTERVAL_MS);
    },
    stop() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    },
    get isRunning() {
      return timerId !== null;
    },
  };
}

// Listen: plays the generated grid once as a plain rhythm (percussion on
// every attack), highlighting the currently-sounding step via rAF reading
// ctx.currentTime, never by counting frames (§6).
export function playSequenceOnce(grid, bpm, { onStep, onEnd } = {}) {
  const ctx = getContext();
  const sixteenth = 15 / bpm;
  const startAt = ctx.currentTime + 0.1;

  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] === 'N') {
      playSyntheticTick(ctx, startAt + i * sixteenth, { frequency: 900, duration: 0.06 });
    }
  }

  const totalDuration = grid.length * sixteenth;
  let rafId = null;
  let stopped = false;

  function frame() {
    if (stopped) return;
    const elapsed = ctx.currentTime - startAt;
    if (elapsed >= totalDuration) {
      onStep?.(-1);
      onEnd?.();
      return;
    }
    if (elapsed >= 0) {
      onStep?.(Math.floor(elapsed / sixteenth));
    }
    rafId = window.requestAnimationFrame(frame);
  }
  rafId = window.requestAnimationFrame(frame);

  return {
    stop() {
      stopped = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      onStep?.(-1);
    },
  };
}
