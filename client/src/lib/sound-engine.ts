/**
 * Sound Engine — Web Audio API micro-interaction chimes
 * Opt-in, muted by default. Calm technology: never startling, always gentle.
 * 
 * All sounds are synthesized — no external audio files needed.
 */

type SoundName = "click" | "success" | "navigate" | "error" | "ambient-start" | "ambient-stop" | "hover";

let audioCtx: AudioContext | null = null;
let _enabled = false;
let _volume = 0.15; // Quiet by default

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function createGain(ctx: AudioContext, vol: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.value = vol * _volume;
  gain.connect(ctx.destination);
  return gain;
}

// ── Sound definitions (all synthesized) ──

function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.3);
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

function playSuccess() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Three-note ascending chime (C5-E5-G5)
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.25);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.25 * _volume, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
    osc.connect(gain);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.35);
  });
}

function playNavigate() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.2);
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

function playError() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Two descending tones
  [330, 262].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.2);
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.2 * _volume, now + i * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);
    osc.connect(gain);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.25);
  });
}

function playHover() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.08);
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
}

// ── Ambient drone (background pad) ──
let ambientOscs: OscillatorNode[] = [];
let ambientGains: GainNode[] = [];
let ambientRunning = false;

function startAmbient() {
  const ctx = getCtx();
  if (!ctx || ambientRunning) return;
  ambientRunning = true;

  // Soft C minor chord pad: C3 + Eb3 + G3
  const freqs = [130.81, 155.56, 196.0];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02 * _volume, ctx.currentTime + 2);
    gain.connect(ctx.destination);
    osc.connect(gain);
    osc.start();
    ambientOscs.push(osc);
    ambientGains.push(gain);
  });
}

function stopAmbient() {
  const ctx = getCtx();
  if (!ctx || !ambientRunning) return;
  const now = ctx.currentTime;
  ambientGains.forEach((g) => {
    g.gain.linearRampToValueAtTime(0, now + 1);
  });
  ambientOscs.forEach((o) => {
    o.stop(now + 1.1);
  });
  ambientOscs = [];
  ambientGains = [];
  ambientRunning = false;
}

// ── Public API ──
const sounds: Record<SoundName, () => void> = {
  click: playClick,
  success: playSuccess,
  navigate: playNavigate,
  error: playError,
  hover: playHover,
  "ambient-start": startAmbient,
  "ambient-stop": stopAmbient,
};

export function playSound(name: SoundName) {
  if (!_enabled) return;
  sounds[name]?.();
}

export function setSoundEnabled(enabled: boolean) {
  _enabled = enabled;
  if (!enabled) stopAmbient();
}

export function isSoundEnabled(): boolean {
  return _enabled;
}

export function setSoundVolume(vol: number) {
  _volume = Math.max(0, Math.min(1, vol));
}

export function getSoundVolume(): number {
  return _volume;
}
