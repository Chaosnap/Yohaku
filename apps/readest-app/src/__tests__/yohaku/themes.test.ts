import { describe, expect, it } from 'vitest';
import tinycolor from 'tinycolor2';
import { themes } from '@/styles/themes';
import { YOHAKU_THEMES } from '@/yohaku/themes';

describe('Yohaku reading themes', () => {
  it('follow Readest’s Default theme', () => {
    const names = themes.slice(0, 4).map(({ name }) => name);
    expect(names).toEqual(['default', 'warm-paper', 'moon-white', 'ink-night']);
  });

  it.each(YOHAKU_THEMES)('$name reads comfortably in both schemes', ({ light, dark }) => {
    for (const { bg, fg, primary } of [light, dark]) {
      expect(tinycolor.readability(bg, fg)).toBeGreaterThan(10);
      expect(tinycolor.readability(bg, primary)).toBeGreaterThan(4.5);
    }
  });

  it('are light by day and dark by night', () => {
    for (const { light, dark } of YOHAKU_THEMES) {
      expect(tinycolor(light.bg).isLight()).toBe(true);
      expect(tinycolor(dark.bg).isDark()).toBe(true);
    }
  });
});
