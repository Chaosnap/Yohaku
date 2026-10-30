import i18n, { PostProcessorModule } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translatableLngs from '../../i18n-langs.json';
import { initReactI18next } from 'react-i18next';
import { isYohakuBuild, toYohakuBrand } from '@/yohaku/build';
import { addYohakuTranslations, YOHAKU_NAMESPACE } from '@/yohaku/i18n';

// 'en' is the source language and not listed in the translatable set.
const SUPPORTED_LNGS = ['en', ...translatableLngs];

const isBrowser = typeof window !== 'undefined';

// [yohaku] Readest's strings name the app; a Yohaku build shows its own name.
const yohakuBrand: PostProcessorModule = {
  type: 'postProcessor',
  name: 'yohakuBrand',
  process: (value: string) => toYohakuBrand(value),
};

const initI18n = async () => {
  if (isBrowser) {
    const HttpApi = (await import('i18next-http-backend')).default;
    i18n.use(HttpApi);
  }
  if (isYohakuBuild()) {
    i18n.use(yohakuBrand);
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...(isYohakuBuild() && { postProcess: ['yohakuBrand'] }),
      supportedLngs: SUPPORTED_LNGS,
      fallbackLng: {
        'zh-HK': ['zh-TW', 'en'],
        'pt-BR': ['pt', 'en'],
        kk: ['ru', 'en'],
        ky: ['ru', 'en'],
        tk: ['ru', 'en'],
        ug: ['ru', 'en'],
        tt: ['ru', 'en'],
        default: ['en'],
      },
      ns: ['translation'],
      defaultNS: 'translation',
      // [yohaku] Yohaku's own strings, bundled in the app (src/yohaku/i18n).
      fallbackNS: YOHAKU_NAMESPACE,
      ...(isBrowser && {
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
      }),
      detection: {
        order: ['querystring', 'localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      keySeparator: false,
      nsSeparator: false,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  // [yohaku] Bundled with the app, so they need no request and work offline.
  addYohakuTranslations(i18n);

  i18n.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined') {
      console.log('Language changed to', lng);
    }
  });
};

initI18n();

export default i18n;
