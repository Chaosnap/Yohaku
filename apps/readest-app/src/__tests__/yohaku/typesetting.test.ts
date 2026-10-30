import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Book, BookFormat, ViewSettings } from '@/types/book';
import type { SystemSettings } from '@/types/settings';
import type { FileSystem } from '@/types/system';
import { loadBookConfig, saveBookConfig } from '@/services/bookService';
import {
  getBookTypesetting,
  getInterfaceTypesetting,
  LANGUAGE_TYPESETTING as TYPESETTING,
} from '@/yohaku/typesetting';

// What a first launch with a Chinese interface sets the globals to.
const chinese = { zoomLevel: 100, wordSpacing: 0, ...TYPESETTING.zh } as ViewSettings;

const makeBook = (hash: string, language: string, format: BookFormat = 'EPUB'): Book => ({
  hash,
  format,
  primaryLanguage: language,
  title: hash,
  author: '',
  createdAt: 1,
  updatedAt: 1,
});

const makeFs = () => {
  const files = new Map<string, string>();
  const fs = {
    exists: async (path: string) => files.has(path),
    readFile: async (path: string) => files.get(path) ?? '',
    writeFile: async (path: string, _base: string, content: string) => {
      files.set(path, content);
    },
  } as unknown as FileSystem;
  return { fs, files };
};

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
  localStorage.setItem('i18nextLng', 'zh-CN');
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.removeItem('i18nextLng');
});

describe('typesetting for the interface language', () => {
  it('starts a first launch from that language', () => {
    expect(getInterfaceTypesetting()).toEqual(TYPESETTING.zh);
    localStorage.setItem('i18nextLng', 'ja');
    expect(getInterfaceTypesetting()).toEqual(TYPESETTING.ja);
    localStorage.setItem('i18nextLng', 'de');
    expect(getInterfaceTypesetting()).toEqual({});
  });

  it('is Readest’s own outside a Yohaku build', () => {
    vi.unstubAllEnvs();
    expect(getInterfaceTypesetting()).toEqual({});
  });
});

describe('typesetting for a book’s language', () => {
  it('gives an English book English typesetting', () => {
    const english = makeBook('persuasion', 'en');
    expect(getBookTypesetting(english, chinese)).toEqual(TYPESETTING.en);
  });

  it('gives a Japanese book one-character indents and no paragraph spacing', () => {
    const japanese = makeBook('yukiguni', 'ja-JP');
    expect(getBookTypesetting(japanese, chinese)).toMatchObject({ textIndent: 1 });
    expect(getBookTypesetting(japanese, chinese)).toMatchObject({ paragraphMargin: 0 });
  });

  it('keeps a value the user chose', () => {
    const english = makeBook('persuasion', 'en');
    const globals = { ...chinese, lineHeight: 2.2 };
    expect(getBookTypesetting(english, globals)).not.toHaveProperty('lineHeight');
  });

  it('adds nothing for the interface language, comics, PDFs or other languages', () => {
    expect(getBookTypesetting(makeBook('zh', 'zh-Hans'), chinese)).toEqual({});
    expect(getBookTypesetting(makeBook('cbz', 'en', 'CBZ'), chinese)).toEqual({});
    expect(getBookTypesetting(makeBook('pdf', 'en', 'PDF'), chinese)).toEqual({});
    expect(getBookTypesetting(makeBook('de', 'de'), chinese)).toEqual({});
  });

  it('is never written into the book’s config, so global changes reach the book', async () => {
    const { fs, files } = makeFs();
    const book = makeBook('persuasion', 'en');
    const settings = { globalViewSettings: chinese } as SystemSettings;

    const config = await loadBookConfig(fs, book, settings);
    expect(config.viewSettings?.lineHeight).toBe(1.5);
    config.progress = [3, 240];
    await saveBookConfig(fs, book, config, settings);
    const saved = JSON.parse(files.get('persuasion/config.json')!);
    expect(saved.viewSettings).toEqual({});

    const changed = { globalViewSettings: { ...chinese, lineHeight: 2.2 } } as SystemSettings;
    const reloaded = await loadBookConfig(fs, book, changed);
    expect(reloaded.viewSettings?.lineHeight).toBe(2.2);
    expect(reloaded.viewSettings?.textIndent).toBe(0);
    expect(reloaded.progress).toEqual([3, 240]);
  });
});
