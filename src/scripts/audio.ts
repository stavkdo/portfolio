/*
  A synthesised cello.
  The string is built from its overtones directly: a strong, round
  fundamental and low overtones, with the high ones fading away fast, the
  way a wound gut-and-steel string sounds through a wooden body (a raw
  sawtooth is far too buzzy). The body warms the low-mids and softens the
  highs; a gentle low-pass keeps it dark; a slow swell and late vibrato make
  it breathe. The room echo is built from smoothed noise, so it stays warm
  instead of hissing.
*/

/* ==================================================================
   THE STRINGS' SOUND: change these numbers to change how they sound.
   Save the file and the page reloads with the new sound.
================================================================== */
export const CELLO = {
  /** The four open strings, low to high, in Hz: C2, G2, D3, A3. */
  notes: [65.41, 98.0, 146.83, 220.0],

  /** Overall volume, 0 to 1. */
  volume: 0.9,
  /** How long a note rings when you cross a string, in seconds. */
  noteLength: 1.6,
  /** How long the note takes to swell in, in seconds. Shorter = quicker response, longer = softer (try 0.02 to 0.15). */
  attack: 0.03,
  /** How long the note takes to fade out, in seconds. */
  release: 0.45,

  /**
   * Warmth: how quickly the overtones fade. Higher = rounder and darker,
   * lower = brighter and more nasal (try 1.4 to 2.2).
   */
  warmth: 2,
  /** Brightness ceiling, in Hz. Lower = darker and warmer (try 900 to 2500). */
  brightness: 900,

  /** Vibrato speed in wobbles per second (cellists use about 5 to 6). */
  vibratoSpeed: 5.4,
  /** Vibrato depth in cents. 0 turns it off. */
  vibratoDepth: 9,
  /** How long before the vibrato starts, in seconds. */
  vibratoDelay: 0.3,

  /** A soft woody "grip" as the bow catches the string, 0 to 0.05. 0 turns it off. */
  bowGrip: 0.012,

  /** How much room echo, 0 to 1. */
  reverb: 0.22,
  /** How long the room echo lasts, in seconds. */
  reverbLength: 2.4,

  /**
   * The wooden body: [frequency in Hz, boost or cut in dB, width].
   * The low boosts make it full and warm; the cuts above 2 kHz remove the metallic edge.
   */
  body: [
    [110, 3, 1.0],
    [230, 6, 1.1],
    [420, 3, 1.3],
    [900, -2, 1.0],
    [2500, -6, 0.8],
    [4200, -10, 0.7],
  ] as [number, number, number][],
};
/* ================================================================== */

let ctx: AudioContext | null = null;
let master: GainNode;
let noise: AudioBuffer;
let wave: PeriodicWave;
let enabled = false;

/** The string's overtones: each harmonic quieter than the last, the low ones a little fuller. */
function stringWave(c: AudioContext) {
  const N = 28;
  const real = new Float32Array(N + 1);
  const imag = new Float32Array(N + 1);
  for (let n = 1; n <= N; n++) {
    const fuller = n >= 2 && n <= 5 ? 1.25 : 1; // the cello's strong low partials
    const amp = fuller / Math.pow(n, CELLO.warmth);
    // spread the overtones' starting points so they never all peak together (sharp peaks clip and crackle)
    const phase = (n * n * Math.PI) / N;
    real[n] = amp * Math.sin(phase);
    imag[n] = amp * Math.cos(phase);
  }
  return c.createPeriodicWave(real, imag);
}

function init() {
  if (ctx) return;
  ctx = new AudioContext({ latencyHint: "interactive" });
  master = ctx.createGain();
  master.gain.value = CELLO.volume;
  wave = stringWave(ctx);

  // Overlapping notes add up; a soft compressor evens them out and a limiter catches every peak,
  // so a fast strum never clips (clipping is the crackly, electric sound)
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.3;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.2;
  const out = ctx.createGain();
  out.gain.value = 0.85;
  limiter.connect(out).connect(ctx.destination);

  // A warm room: smoothed noise for the impulse response, and a dark filter on the echo
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * CELLO.reverbLength);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let smooth = 0;
    for (let i = 0; i < len; i++) {
      smooth = smooth * 0.82 + (Math.random() * 2 - 1) * 0.18;
      d[i] = smooth * Math.pow(1 - i / len, 3);
    }
  }
  verb.buffer = ir;
  const verbTone = ctx.createBiquadFilter();
  verbTone.type = "lowpass";
  verbTone.frequency.value = 2200;
  const wet = ctx.createGain();
  wet.gain.value = CELLO.reverb * 2.5; // smoothed noise is quieter, so it needs more gain

  master.connect(comp);
  comp.connect(limiter);
  comp.connect(verb);
  verb.connect(verbTone).connect(wet).connect(limiter);

  // Half a second of noise, reused for the bow's grip
  noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
  const n = noise.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
}

/** Run a signal through the cello body's resonances, then a gentle two-stage low-pass. */
function body(c: AudioContext, input: AudioNode, output: AudioNode, brightness: number, freq: number) {
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 45;
  input.connect(hp);
  let node: AudioNode = hp;
  for (const [f, gain, q] of CELLO.body) {
    const b = c.createBiquadFilter();
    b.type = "peaking";
    b.frequency.value = f;
    b.gain.value = gain;
    b.Q.value = q;
    node.connect(b);
    node = b;
  }
  for (let k = 0; k < 2; k++) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.max(brightness, freq * 2.5); // high notes keep their own voice
    lp.Q.value = 0.5; // no resonant peak, so no whistle
    node.connect(lp);
    node = lp;
  }
  node.connect(output);
}

type Voice = { release: (at?: number) => void };

type BowOptions = {
  /** start time in AudioContext seconds (default: now) */
  when?: number;
  /** how long the bow keeps moving, in seconds */
  dur?: number;
  /** loudness, 0 to 1 */
  level?: number;
  /** how long the note takes to speak, in seconds */
  attack?: number;
  /** whether vibrato comes in */
  vibrato?: boolean;
};

function bowNote(freq: number, opts: BowOptions = {}): Voice | null {
  if (!enabled || !ctx) return null;
  const c = ctx;
  const when = opts.when ?? c.currentTime;
  const dur = opts.dur ?? CELLO.noteLength;
  const level = (opts.level ?? 0.5) * 0.2;
  const attack = opts.attack ?? CELLO.attack;

  const out = c.createGain();
  out.gain.value = 0;
  out.connect(master);

  const mix = c.createGain();
  body(c, mix, out, CELLO.brightness, freq);

  // Vibrato: comes in late, like a player settling into the note
  const vib = c.createOscillator();
  vib.frequency.value = CELLO.vibratoSpeed;
  const vibDepth = c.createGain();
  vibDepth.gain.setValueAtTime(0, when);
  if (opts.vibrato !== false && CELLO.vibratoDepth > 0) {
    vibDepth.gain.setValueAtTime(0, when + CELLO.vibratoDelay);
    vibDepth.gain.linearRampToValueAtTime(CELLO.vibratoDepth, when + CELLO.vibratoDelay + 0.5);
  }
  vib.connect(vibDepth);

  // The string
  const osc = c.createOscillator();
  osc.setPeriodicWave(wave);
  osc.frequency.value = freq;
  vibDepth.connect(osc.detune);
  osc.connect(mix);

  // The bow's grip: a short, low, woody breath at the start, no hiss
  const sources: AudioScheduledSourceNode[] = [osc, vib];
  if (CELLO.bowGrip > 0) {
    const grip = c.createBufferSource();
    grip.buffer = noise;
    const gripTone = c.createBiquadFilter();
    gripTone.type = "bandpass";
    gripTone.frequency.value = Math.min(900, freq * 3);
    gripTone.Q.value = 1.2;
    const gripGain = c.createGain();
    gripGain.gain.setValueAtTime(0, when);
    gripGain.gain.linearRampToValueAtTime(CELLO.bowGrip, when + 0.02);
    gripGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    grip.connect(gripTone).connect(gripGain).connect(mix);
    sources.push(grip);
  }

  // The swell: eases in, then settles slightly
  out.gain.setValueAtTime(0, when);
  out.gain.setTargetAtTime(level, when, attack / 3);
  out.gain.setTargetAtTime(level * 0.88, when + attack * 1.5, 0.3);

  sources.forEach((s) => s.start(when));

  let released = false;
  const release = (at: number, time: number) => {
    if (released) return;
    released = true;
    const t = Math.max(at, c.currentTime);
    if (out.gain.cancelAndHoldAtTime) out.gain.cancelAndHoldAtTime(t);
    else {
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value || level * 0.88, t);
    }
    out.gain.setTargetAtTime(0, t, time / 4);
    sources.forEach((s) => s.stop(t + time + 0.1));
  };
  // schedule the natural end, but leave the voice free to be cut short
  release(when + dur, CELLO.release);
  released = false;

  return { release: (at?: number) => release(at ?? c.currentTime, 0.18) };
}

export const audio = {
  get enabled() {
    return enabled;
  },

  get now() {
    return ctx ? ctx.currentTime : 0;
  },

  async setEnabled(on: boolean) {
    if (on) {
      init();
      if (ctx!.state === "suspended") await ctx!.resume();
    }
    enabled = on;
  },

  bow: bowNote,
};
