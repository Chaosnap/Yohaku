import { describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { YOHAKU_THEMES } from '@/yohaku/themes';
import { addYohakuTranslations, YOHAKU_NAMESPACE, YOHAKU_TRANSLATIONS } from '@/yohaku/i18n';

const makeI18n = async (lng: string) => {
  const instance = i18next.createInstance();
  await instance.init({
    lng,
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    fallbackNS: YOHAKU_NAMESPACE,
    keySeparator: false,
    nsSeparator: false,
    resources: { [lng]: { translation: { Default: 'Readest 的译文' } } },
  });
  addYohakuTranslations(instance);
  return instance;
};

describe('Yohaku translations', () => {
  it('give every language the same strings', () => {
    const keys = Object.values(YOHAKU_TRANSLATIONS).map((strings) => Object.keys(strings).sort());
    for (const other of keys.slice(1)) expect(other).toEqual(keys[0]);
  });

  it('name every Yohaku reading theme', () => {
    for (const strings of Object.values(YOHAKU_TRANSLATIONS)) {
      for (const { label } of YOHAKU_THEMES) expect(strings[label]).toBeTruthy();
    }
  });

  it('fill in what Readest does not translate, and leave what it does', async () => {
    const zh = await makeI18n('zh-CN');
    expect(zh.t('Warm Paper')).toBe('暖纸');
    expect(zh.t('Default')).toBe('Readest 的译文');
    const ja = await makeI18n('ja');
    expect(ja.t('Moon White')).toBe('月白');
    const tw = await makeI18n('zh-TW');
    expect(tw.t('Warm Paper')).toBe('暖紙');
  });

  it('fall back to the English key', async () => {
    const en = await makeI18n('en');
    expect(en.t('Ink Night')).toBe('Ink Night');
  });
});
