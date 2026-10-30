// Relative paths only: the Tailwind theme plugin loads this file without path aliases.
import type { BaseColor } from '../styles/themes';

interface ReadingTheme {
  name: string;
  label: string;
  light: BaseColor;
  dark: BaseColor;
}

/**
 * Yohaku's reading themes, listed right after Readest's Default theme
 * (styles/themes.ts derives the full palettes from these base colours). Body
 * text contrasts above 10:1 and the accent above 4.5:1 in both schemes.
 */
export const YOHAKU_THEMES: ReadingTheme[] = [
  {
    // 暖纸: unbleached paper under a lamp; at night, the same page in lamplight.
    name: 'warm-paper',
    label: 'Warm Paper',
    light: { bg: '#f5eedc', fg: '#3a3228', primary: '#9c5b2e' },
    dark: { bg: '#2b261f', fg: '#e3d6bc', primary: '#d9a35f' },
  },
  {
    // 月白: the pale blue-white of moonlight, and a moonlit night.
    name: 'moon-white',
    label: 'Moon White',
    light: { bg: '#eaf0f1', fg: '#263038', primary: '#2f6e8c' },
    dark: { bg: '#1d2429', fg: '#d3dee3', primary: '#8bb8cc' },
  },
  {
    // 墨夜: ink-black night with paper-coloured text, and light ink wash by day.
    name: 'ink-night',
    label: 'Ink Night',
    light: { bg: '#e9e7e2', fg: '#1f1e1c', primary: '#6b5a44' },
    dark: { bg: '#151515', fg: '#c9c3b5', primary: '#b8935a' },
  },
];
