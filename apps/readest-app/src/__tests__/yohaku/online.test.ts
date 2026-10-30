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

  // Azure and Yandex need an account only on the web, so this test (not in the
  // app) leaves them out too; the app keeps them.
  it('leave out those that need a Readest account in a Yohaku build', () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    expect(translatorNames()).not.toContain('deepl');
    expect(translatorNames()).toContain('google');
  });
});
