import { describe, expect, it } from 'vitest';
import { activeLine, decodeLyrics, parseLyrics } from '@/yohaku/music/lyrics';

describe('lyrics', () => {
  it('follow the song by the times of their lines', () => {
    const source = '[ti:Song]\n[00:01.50]First\n[00:03.20][01:00.00]Again\n[00:05]Last';
    const lyrics = parseLyrics(source);
    expect(lyrics?.synced).toBe(true);
    expect(lyrics?.lines.map(({ time, text }) => [time, text])).toEqual([
      [1500, 'First'],
      [3200, 'Again'],
      [5000, 'Last'],
      [60000, 'Again'],
    ]);
  });

  it('take a line at the time of the line before as its translation', () => {
    const lyrics = parseLyrics('[00:10.00]雪国\n[00:10.00]Snow Country\n[00:12.00]');
    expect(lyrics?.lines).toEqual([
      { time: 10000, text: '雪国', translation: 'Snow Country' },
      { time: 12000, text: '' },
    ]);
  });

  it('move by their offset, and keep the times of their words', () => {
    const source = '[offset:500]\n[00:02.00]<00:02.00>Hello <00:02.60>world<00:03.10>';
    const line = parseLyrics(source)?.lines[0];
    expect(line?.time).toBe(1500);
    expect(line?.text).toBe('Hello world');
    expect(line?.words).toEqual([
      { time: 1500, text: 'Hello ' },
      { time: 2100, text: 'world' },
      { time: 2600, text: '' },
    ]);
  });

  it('without any time are shown as they are, and without any line are none', () => {
    expect(parseLyrics('One\n\nTwo')).toEqual({
      synced: false,
      lines: [
        { time: 0, text: 'One' },
        { time: 0, text: 'Two' },
      ],
    });
    expect(parseLyrics('[ar:Someone]\n\n')).toBeNull();
  });

  it('know the line being sung', () => {
    const lines = parseLyrics('[00:01.00]a\n[00:02.00]b\n[00:03.00]c')?.lines ?? [];
    expect(activeLine(lines, 500)).toBe(-1);
    expect(activeLine(lines, 1000)).toBe(0);
    expect(activeLine(lines, 2999)).toBe(1);
    expect(activeLine(lines, 99_000)).toBe(2);
  });

  it('are read as UTF-8 or UTF-16, or else as GBK', () => {
    expect(decodeLyrics(new TextEncoder().encode('\uFEFF[00:01.00]歌'))).toBe('[00:01.00]歌');
    expect(decodeLyrics(new Uint8Array([0xff, 0xfe, 0x4c, 0x6b]))).toBe('歌');
    expect(decodeLyrics(new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]))).toBe('你好');
  });
});
