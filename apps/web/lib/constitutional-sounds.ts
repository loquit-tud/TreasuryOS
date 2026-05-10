/** Very short UI tones — only call after a user gesture (e.g. button click) so AudioContext is allowed. */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function blip(freq: number, duration: number, gain: number) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

/** Constitutional lock / rejection — low, decisive */
export function playConstitutionalLock() {
  blip(155, 0.12, 0.045);
  setTimeout(() => blip(98, 0.18, 0.035), 70);
}

/** Defensive approval — softer */
export function playConstitutionalClear() {
  blip(440, 0.06, 0.022);
  setTimeout(() => blip(660, 0.08, 0.018), 50);
}

/** Stress inject */
export function playStressPulse() {
  blip(220, 0.15, 0.03);
}
