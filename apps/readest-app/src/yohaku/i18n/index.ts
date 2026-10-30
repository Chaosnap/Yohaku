import type { i18n } from 'i18next';
import ja from './ja.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';

/**
 * Yohaku's own strings live in a namespace of their own, bundled with the app,
 * so Readest's translation files stay untouched and merging upstream never
 * conflicts on them. i18n.ts sets it as the fallback namespace: a key Readest
 * does not translate is looked up here. Keys are the English text, as in
 * Readest; English needs no file.
 */
export const YOHAKU_NAMESPACE = 'yohaku';

export const YOHAKU_TRANSLATIONS: Record<string, Record<string, string>> = {
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export const addYohakuTranslations = (instance: i18n) => {
  for (const [language, strings] of Object.entries(YOHAKU_TRANSLATIONS)) {
    instance.addResourceBundle(language, YOHAKU_NAMESPACE, strings, true, true);
  }
};
