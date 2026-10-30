import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SystemSettings } from '@/types/settings';
import { getComicInfoDirection } from '@/yohaku/reader/comicInfo';
import { getComicDefaultDirection } from '@/yohaku/reader/comics';

const comicInfo = (manga: string) =>
  `<?xml version="1.0"?><ComicInfo><Title>Ch. 1</Title><Manga>${manga}</Manga></ComicInfo>`;

const directionOf = (files: Record<string, string>) =>
  getComicInfoDirection({
    entries: [...Object.keys(files), '001.jpg'].map((filename) => ({ filename })),
    loadText: async (name: string) => files[name] ?? null,
  });

const comicsRtl = (on: boolean) => ({ yohaku: { comicsRightToLeft: on } }) as SystemSettings;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('reading direction from ComicInfo.xml', () => {
  it('reads manga marked right to left from right to left', async () => {
    const files = { 'ComicInfo.xml': comicInfo('YesAndRightToLeft') };
    expect(await directionOf(files)).toBe('rtl');
  });

  it('reads a comic that is not manga from left to right', async () => {
    expect(await directionOf({ 'ComicInfo.xml': comicInfo('No') })).toBe('ltr');
  });

  it('leaves the direction open when ComicInfo.xml does not give one', async () => {
    expect(await directionOf({ 'ComicInfo.xml': comicInfo('Yes') })).toBe(undefined);
    expect(await directionOf({ 'ComicInfo.xml': '<ComicInfo/>' })).toBe(undefined);
    expect(await directionOf({ 'ComicInfo.xml': 'not xml' })).toBe(undefined);
    expect(await directionOf({})).toBe(undefined);
  });

  it('finds ComicInfo.xml in a folder', async () => {
    const files = { 'Vol 1/comicinfo.xml': comicInfo('YesAndRightToLeft') };
    expect(await directionOf(files)).toBe('rtl');
  });
});

describe('the comics setting', () => {
  it('turns comics with no direction of their own right to left', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(getComicDefaultDirection('CBZ', comicsRtl(true))).toBe('rtl');
    expect(getComicDefaultDirection('CBZ', comicsRtl(false))).toBe(undefined);
    expect(getComicDefaultDirection('CBZ', {} as SystemSettings)).toBe(undefined);
  });

  it('applies to comics only, and only in a Yohaku build', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(getComicDefaultDirection('EPUB', comicsRtl(true))).toBe(undefined);
    vi.unstubAllEnvs();
    expect(getComicDefaultDirection('CBZ', comicsRtl(true))).toBe(undefined);
  });
});
