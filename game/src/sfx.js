// Tiny WebAudio blips, synthesised in code — no sound files, no network.
// The game plays fine with sound off; every call is guarded so a browser
// without audio (or without a user gesture yet) simply stays silent.
let audioContext = null;

function context() {
  if (audioContext) return audioContext;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audioContext = new AudioCtx();
  return audioContext;
}

/** Play one short sine blip at `frequency` Hz for `duration` seconds. */
export function blip(frequency, duration, volume) {
  try {
    const ctx = context();
    if (!ctx || ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume ?? 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio is decoration; never let it break the game.
  }
}

/** Unlock audio on the first user gesture so later blips can sound. */
export function unlockAudio() {
  try {
    const ctx = context();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  } catch {
    // Ignore: the game works without sound.
  }
}

export function playFound() {
  blip(660, 0.12);
  setTimeout(() => blip(880, 0.18), 70);
}

export function playMiss() {
  blip(180, 0.2, 0.1);
}

export function playClear() {
  blip(523, 0.14);
  setTimeout(() => blip(659, 0.14), 110);
  setTimeout(() => blip(784, 0.22), 220);
}
