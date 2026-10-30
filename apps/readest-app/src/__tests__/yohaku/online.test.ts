import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTranslators } from '@/services/translators/providers';
import { allowsOnlineVoices, setOnlineVoicesSetting } from '@/yohaku/onlineVoices';

const translatorNames = () => getTranslators().map(({ name }) => name);

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.removeItem('yohakuOnlineVoices');
});

describe('online voices', () => {
  it('are Readest’s first choice for reading aloud', () => {
    expect(allowsOnlineVoices()).toBe(true);
  });

  it('wait in a Yohaku build until the user turns them on', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(allowsOnlineVoices()).toBe(false);
    setOnlineVoicesSetting(true);
    expect(allowsOnlineVoices()).toBe(true);
    setOnlineVoicesSetting(false);
    expect(allowsOnlineVoices()).toBe(false);
  });
});

describe('translation services', () => {
  it('include DeepL in Readest', () => {
    expect(translatorNames()).toContain('deepl');
  });

  it('leave out DeepL in a Yohaku build, as it needs a Readest account', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(translatorNames()).not.toContain('deepl');
    expect(translatorNames()).toEqual(expect.arrayContaining(['azure', 'google', 'yandex']));
  });
});
