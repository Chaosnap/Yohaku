import { describe, expect, it, vi } from 'vitest';
import { AMBIENT_SCENES, AMBIENT_SOUNDS, ambientIdOf } from '@/yohaku/ambient/sounds';
import { AMBIENT_SOUND_IDS, SAMPLE_RATE, encodeWav, renderAmbient } from '@/yohaku/ambient/synth';

const LOOP = 30 * SAMPLE_RATE;

// Each sound is 30 seconds of stereo, made sample by sample.
vi.setConfig({ testTimeout: 30_000 });

const power = (signal: Float32Array) => {
  let sum = 0;
  for (const x of signal) sum += x * x;
  return sum / signal.length;
};

describe('ambient sounds', () => {
  it('are all listed, and the scenes use only them', () => {
    expect(AMBIENT_SOUNDS.map(({ id }) => id)).toEqual(AMBIENT_SOUND_IDS);
    for (const { layers } of AMBIENT_SCENES) {
      for (const { id } of layers) expect(AMBIENT_SOUND_IDS).toContain(id);
    }
  });

  it('each have a symbol shown before the name', () => {
    for (const { icon } of [...AMBIENT_SOUNDS, ...AMBIENT_SCENES]) {
      expect(icon).toBeTypeOf('function');
    }
  });

  it('are known again from their loop files, wherever the cache is', () => {
    expect(ambientIdOf('/Users/yuki/Library/Caches/yohaku-ambient/eaves-1.wav')).toBe('eaves');
    expect(ambientIdOf('C:\\Users\\yuki\\AppData\\yohaku-ambient\\rain-3.wav')).toBe('rain');
    expect(ambientIdOf('/data/user/0/app/cache/yohaku-ambient/vinyl-12.wav')).toBe('vinyl');
    expect(ambientIdOf('/Music/thunder-1.wav')).toBeUndefined();
    expect(ambientIdOf('/Music/Rain.ogg')).toBeUndefined();
  });

  it.each(AMBIENT_SOUND_IDS)('render %s as an even, seamless 30 second loop', (id) => {
    const [left, right] = renderAmbient(id);
    expect(left).toHaveLength(LOOP);
    expect(right).toHaveLength(LOOP);
    // Every sound is made to one loudness; the soft limiter only ever lowers it.
    const level = Math.sqrt((power(left) + power(right)) / 2);
    expect(level).toBeGreaterThan(0.03);
    expect(level).toBeLessThan(0.081);
    for (const channel of [left, right]) {
      // The step from the last sample back to the first is like any other step.
      const steps = channel.slice(1).map((x, i) => Math.abs(x - channel[i]!));
      steps.sort((a, b) => a - b);
      const largest = steps[Math.floor(steps.length * 0.9999)]!;
      expect(Math.abs(channel[0]! - channel[LOOP - 1]!)).toBeLessThanOrEqual(2 * largest);
    }
  });

  it('come out the same every time for one seed, and differently for another', () => {
    const [first] = renderAmbient('stream');
    const [again] = renderAmbient('stream');
    const [other] = renderAmbient('stream', 2);
    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
  });
});

describe('encodeWav', () => {
  it('writes 16-bit stereo PCM after a WAV header', () => {
    const left = new Float32Array([0, 1, -1, 0.5]);
    const right = new Float32Array([0, -1, 2, -0.5]);
    const view = new DataView(encodeWav([left, right]));
    const text = (offset: number) =>
      String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(offset + i)));
    expect([text(0), text(8), text(12), text(36)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
    expect(view.byteLength).toBe(44 + 4 * 4);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint32(40, true)).toBe(16);
    const samples = Array.from({ length: 8 }, (_, i) => view.getInt16(44 + i * 2, true));
    expect(samples).toEqual([0, 0, 32767, -32767, -32767, 32767, 16384, -16383]);
  });
});
