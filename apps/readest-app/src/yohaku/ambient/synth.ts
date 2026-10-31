/**
 * Yohaku's ambient sounds are synthesized, not recorded: each is a small
 * recipe of filtered noise and short events (rain drops, crackles, chirps)
 * rendered sample by sample into a seamless loop. The noise is seeded, so a
 * sound is the same every time it is made, and no recording needs a licence.
 */

export const SAMPLE_RATE = 32_000;
const LOOP_SECONDS = 30;
const CROSSFADE_SECONDS = 2;

export type AmbientSoundId =
  | 'rain'
  | 'eaves'
  | 'wind'
  | 'waves'
  | 'fire'
  | 'forest'
  | 'cicadas'
  | 'crickets'
  | 'stream'
  | 'vinyl';

type Random = () => number;

/** Mulberry32: a tiny seeded generator, uniform in [0, 1). */
const seeded = (seed: number): Random => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const between = (random: Random, low: number, high: number) => low + (high - low) * random();

type FilterType = 'lowpass' | 'highpass' | 'bandpass';

/** A biquad filter (RBJ cookbook); the band-pass peaks at 0 dB. */
class Biquad {
  private readonly type: FilterType;
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(type: FilterType, frequency: number, q = Math.SQRT1_2) {
    this.type = type;
    this.tune(frequency, q);
  }

  tune(frequency: number, q = Math.SQRT1_2) {
    const w = (2 * Math.PI * frequency) / SAMPLE_RATE;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    const coefficients = {
      lowpass: [(1 - cos) / 2, 1 - cos, (1 - cos) / 2],
      highpass: [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2],
      bandpass: [alpha, 0, -alpha],
    };
    const [b0, b1, b2] = coefficients[this.type] as [number, number, number];
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(x: number) {
    const feedforward = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2;
    const y = feedforward - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** A slow random wander between 0 and 1, changing about `rate` times a second. */
const drift = (random: Random, rate: number) => {
  let value = random();
  let target = random();
  const step = rate / SAMPLE_RATE;
  return () => {
    value += (target - value) * step * 4;
    if (Math.abs(target - value) < 0.02) target = random();
    return value;
  };
};

interface Canvas {
  left: Float32Array;
  right: Float32Array;
  random: Random;
  length: number;
}

/** A continuous bed of filtered noise, panned a little differently per side. */
const bed = (
  { left, right, random, length }: Canvas,
  filters: () => Biquad[],
  gain: (i: number) => number,
) => {
  const chains = [filters(), filters()];
  for (let i = 0; i < length; i++) {
    const g = gain(i);
    for (let side = 0; side < 2; side++) {
      let x = random() * 2 - 1;
      for (const filter of chains[side]!) x = filter.process(x);
      (side === 0 ? left : right)[i]! += x * g;
    }
  }
};

/** Adds events at random times, `rate` a second on average; each writes its own samples. */
const events = (canvas: Canvas, rate: number, event: (start: number, pan: number) => void) => {
  const { random, length } = canvas;
  let t = 0;
  for (;;) {
    t += (-Math.log(1 - random()) / rate) * SAMPLE_RATE;
    if (t >= length) return;
    event(Math.floor(t), random());
  }
};

/** Mixes one sample of an event into the canvas at a stereo position. */
const put = ({ left, right, length }: Canvas, i: number, value: number, pan: number) => {
  if (i >= length) return;
  left[i]! += value * Math.cos((pan * Math.PI) / 2);
  right[i]! += value * Math.sin((pan * Math.PI) / 2);
};

const drop = (canvas: Canvas, start: number, pan: number, frequency: number, ms: number) => {
  const { random } = canvas;
  const filter = new Biquad('bandpass', frequency, 1.5);
  const amplitude = between(random, 0.05, 0.25);
  const tau = (ms / 1000) * SAMPLE_RATE;
  for (let k = 0; k < tau * 6; k++) {
    put(canvas, start + k, filter.process(random() * 2 - 1) * amplitude * Math.exp(-k / tau), pan);
  }
};

const tone = (
  canvas: Canvas,
  start: number,
  pan: number,
  [from, to]: [number, number],
  ms: number,
  amplitude: number,
) => {
  const length = (ms / 1000) * SAMPLE_RATE;
  let phase = 0;
  for (let k = 0; k < length; k++) {
    const t = k / length;
    phase += (2 * Math.PI * (from + (to - from) * t)) / SAMPLE_RATE;
    put(canvas, start + k, Math.sin(phase) * amplitude * Math.sin(Math.PI * t) ** 2, pan);
  }
};

const RECIPES: Record<AmbientSoundId, (canvas: Canvas) => void> = {
  rain: (canvas) => {
    const flutter = drift(canvas.random, 0.5);
    const filters = () => [new Biquad('highpass', 400), new Biquad('lowpass', 6000)];
    bed(canvas, filters, () => 0.2 * (0.85 + 0.15 * flutter()));
    events(canvas, 40, (start, pan) => {
      const pitch = between(canvas.random, 1800, 5200);
      drop(canvas, start, pan, pitch, between(canvas.random, 3, 10));
    });
  },
  eaves: (canvas) => {
    bed(canvas, () => [new Biquad('highpass', 500), new Biquad('lowpass', 5000)], () => 0.1);
    events(canvas, 18, (start, pan) => {
      const pitch = between(canvas.random, 2000, 5000);
      drop(canvas, start, pan, pitch, between(canvas.random, 3, 8));
    });
    // Heavier drips from the eaves: a short plink, falling a little in pitch.
    events(canvas, 2.5, (start, pan) => {
      const pitch = between(canvas.random, 700, 1600);
      const amplitude = between(canvas.random, 0.15, 0.35);
      tone(canvas, start, pan, [pitch, pitch * 0.8], between(canvas.random, 30, 70), amplitude);
    });
  },
  wind: (canvas) => {
    const gust = drift(canvas.random, 0.12);
    const centre = drift(canvas.random, 0.2);
    const sides = [new Biquad('bandpass', 400, 0.8), new Biquad('bandpass', 450, 0.8)];
    const { left, right, random, length } = canvas;
    for (let i = 0; i < length; i++) {
      if (i % 64 === 0) {
        const frequency = 250 + 650 * centre();
        sides[0]!.tune(frequency, 0.8);
        sides[1]!.tune(frequency * 1.1, 0.8);
      }
      const gain = 0.6 * (0.2 + 0.8 * gust() ** 2);
      left[i]! += sides[0]!.process(random() * 2 - 1) * gain;
      right[i]! += sides[1]!.process(random() * 2 - 1) * gain;
    }
  },
  waves: (canvas) => {
    const { left, right, random, length } = canvas;
    const hiss = [new Biquad('highpass', 1500), new Biquad('highpass', 1500)];
    const body = [new Biquad('lowpass', 900), new Biquad('lowpass', 900)];
    let [brownLeft, brownRight] = [0, 0];
    let next = 0;
    let start = 0;
    for (let i = 0; i < length; i++) {
      if (i >= next) {
        start = i;
        next = i + between(random, 7, 11) * SAMPLE_RATE;
      }
      // Each wave rises for a second and a half, breaks, then draws back.
      const t = (i - start) / SAMPLE_RATE;
      const swell = 0.2 + 0.8 * (t < 1.5 ? (t / 1.5) ** 2 : Math.exp(-(t - 1.5) / 2.5));
      const foam = t < 1.5 ? 0 : Math.exp(-(t - 1.5) / 0.8) * 0.15;
      brownLeft = 0.997 * brownLeft + 0.03 * (random() * 2 - 1);
      brownRight = 0.997 * brownRight + 0.03 * (random() * 2 - 1);
      left[i]! += body[0]!.process(brownLeft) * swell * 0.9;
      right[i]! += body[1]!.process(brownRight) * swell * 0.9;
      left[i]! += hiss[0]!.process(random() * 2 - 1) * foam;
      right[i]! += hiss[1]!.process(random() * 2 - 1) * foam;
    }
  },
  fire: (canvas) => {
    bed(canvas, () => [new Biquad('lowpass', 250)], () => 1.2);
    bed(canvas, () => [new Biquad('lowpass', 3000)], () => 0.02);
    // Crackles: mostly small, now and then a loud one.
    events(canvas, 9, (start, pan) => {
      const filter = new Biquad('highpass', 1500);
      const amplitude = Math.min(0.6, 0.06 / Math.sqrt(canvas.random() + 0.01));
      const tau = between(canvas.random, 0.5, 2.5) * (SAMPLE_RATE / 1000);
      for (let k = 0; k < tau * 6; k++) {
        const x = filter.process(canvas.random() * 2 - 1);
        put(canvas, start + k, x * amplitude * Math.exp(-k / tau), pan);
      }
    });
    events(canvas, 0.6, (start, pan) => {
      const pitch = between(canvas.random, 400, 900);
      drop(canvas, start, pan, pitch, between(canvas.random, 10, 20));
    });
  },
  forest: (canvas) => {
    bed(canvas, () => [new Biquad('bandpass', 700, 0.6)], () => 0.12);
    // Birds: phrases of a few quick chirps, each a short pitch sweep.
    events(canvas, 0.35, (start, pan) => {
      const { random } = canvas;
      const pitch = between(random, 2500, 4500);
      const bend = between(random, 0.7, 1.4);
      let at = start;
      const chirps = 2 + Math.floor(random() * 5);
      for (let n = 0; n < chirps; n++) {
        const ms = between(random, 40, 120);
        tone(canvas, at, pan, [pitch, pitch * bend], ms, between(random, 0.05, 0.12));
        at += ((ms + between(random, 60, 180)) / 1000) * SAMPLE_RATE;
      }
    });
  },
  cicadas: (canvas) => {
    const { left, right, random, length } = canvas;
    const singers = [0.15, 0.85].map((pan) => ({
      pan,
      filter: new Biquad('bandpass', between(random, 4800, 6200), 4),
      pulse: between(random, 90, 140),
      swell: drift(random, 0.25),
    }));
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      for (const singer of singers) {
        const buzz = Math.sin(2 * Math.PI * singer.pulse * t) > 0 ? 1 : 0.15;
        const x = singer.filter.process(random() * 2 - 1) * buzz * singer.swell() * 0.5;
        left[i]! += x * Math.cos((singer.pan * Math.PI) / 2);
        right[i]! += x * Math.sin((singer.pan * Math.PI) / 2);
      }
    }
  },
  crickets: (canvas) => {
    bed(canvas, () => [new Biquad('lowpass', 2000)], () => 0.01);
    for (const pan of [0.2, 0.75]) {
      const { random } = canvas;
      const pitch = between(random, 4200, 4800);
      let at = Math.floor(random() * SAMPLE_RATE);
      while (at < canvas.length) {
        // A chirp of three or four short pulses.
        for (let pulse = 0; pulse < 3 + Math.floor(random() * 2); pulse++) {
          tone(canvas, at + pulse * 0.02 * SAMPLE_RATE, pan, [pitch, pitch], 12, 0.1);
        }
        at += Math.floor(between(random, 0.6, 1.0) * SAMPLE_RATE);
      }
    }
  },
  stream: (canvas) => {
    const ripple = drift(canvas.random, 8);
    bed(
      canvas,
      () => [new Biquad('bandpass', 900, 0.7), new Biquad('lowpass', 2500)],
      () => 0.35 * (0.5 + 0.5 * ripple()),
    );
    // Bubbles: quick rising tones.
    events(canvas, 6, (start, pan) => {
      const pitch = between(canvas.random, 250, 450);
      const ms = between(canvas.random, 25, 60);
      tone(canvas, start, pan, [pitch, pitch * 2.2], ms, between(canvas.random, 0.04, 0.1));
    });
  },
  vinyl: (canvas) => {
    bed(canvas, () => [new Biquad('highpass', 2000)], () => 0.015);
    bed(canvas, () => [new Biquad('lowpass', 40)], () => 0.08);
    events(canvas, 12, (start, pan) => {
      const filter = new Biquad('highpass', 1000);
      const amplitude = Math.min(0.3, 0.02 / Math.sqrt(canvas.random() + 0.005));
      for (let k = 0; k < 40; k++) {
        const x = filter.process(k === 0 ? 1 : 0) * amplitude * Math.exp(-k / 6);
        put(canvas, start + k, x, 0.4 + pan * 0.2);
      }
    });
  },
};

export const AMBIENT_SOUND_IDS = Object.keys(RECIPES) as AmbientSoundId[];

/**
 * Renders a sound as a seamless stereo loop: the recipe runs a little longer
 * than the loop, and that extra tail is crossfaded into the start, so the last
 * sample leads straight into the first. Levels are evened out to one loudness.
 */
export const renderAmbient = (id: AmbientSoundId, seed = 1) => {
  const loop = LOOP_SECONDS * SAMPLE_RATE;
  const fade = CROSSFADE_SECONDS * SAMPLE_RATE;
  const length = loop + fade;
  const canvas: Canvas = {
    left: new Float32Array(length),
    right: new Float32Array(length),
    random: seeded(seed * 7919 + AMBIENT_SOUND_IDS.indexOf(id) * 104729),
    length,
  };
  RECIPES[id](canvas);

  const channels = [new Float32Array(loop), new Float32Array(loop)];
  [canvas.left, canvas.right].forEach((source, c) => {
    for (let i = 0; i < loop; i++) {
      const x = i < fade ? i / fade : 1;
      const tail = i < fade ? source[loop + i]! : 0;
      channels[c]![i] = source[i]! * Math.sqrt(x) + tail * Math.sqrt(1 - x);
    }
  });

  let power = 0;
  for (const channel of channels) {
    for (const x of channel) power += x * x;
  }
  const rms = Math.sqrt(power / (2 * loop)) || 1;
  const gain = 0.08 / rms;
  for (const channel of channels) {
    for (let i = 0; i < loop; i++) channel[i] = Math.tanh(channel[i]! * gain);
  }
  return channels as [Float32Array, Float32Array];
};

/** 16-bit PCM WAV of a stereo signal, which every player decodes. */
export const encodeWav = ([left, right]: [Float32Array, Float32Array]) => {
  const frames = left.length;
  const buffer = new ArrayBuffer(44 + frames * 4);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + frames * 4, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * 4, true);
  for (let i = 0; i < frames; i++) {
    view.setInt16(44 + i * 4, Math.round(Math.max(-1, Math.min(1, left[i]!)) * 32767), true);
    view.setInt16(46 + i * 4, Math.round(Math.max(-1, Math.min(1, right[i]!)) * 32767), true);
  }
  return buffer;
};
