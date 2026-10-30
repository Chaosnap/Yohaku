import { FIXED_LAYOUT_FORMATS, type Book, type ViewSettings } from '@/types/book';
import {
  DEFAULT_BOOK_STYLE,
  DEFAULT_CJK_VIEW_SETTINGS,
  DEFAULT_MOBILE_VIEW_SETTINGS,
} from '@/services/constants';
import { isYohakuBuild } from './build';

type TypesettingKey = 'lineHeight' | 'paragraphMargin' | 'textIndent' | 'fullJustification';
type Typesetting = Partial<Pick<ViewSettings, TypesettingKey>>;

/**
 * Typesetting defaults for the languages Yohaku is made for. Chinese indents a
 * paragraph by two characters and Japanese by one, with no space between
 * paragraphs; English sets paragraphs apart with a little space instead. Both
 * CJK languages are justified and need more leading than Latin text.
 */
export const LANGUAGE_TYPESETTING = {
  zh: { lineHeight: 1.8, paragraphMargin: 0.5, textIndent: 2, fullJustification: true },
  ja: { lineHeight: 1.8, paragraphMargin: 0, textIndent: 1, fullJustification: true },
  en: { lineHeight: 1.5, paragraphMargin: 0.6, textIndent: 0 },
} satisfies Record<string, Typesetting>;

const typesettingFor = (language: string | null | undefined): Typesetting | undefined => {
  const code = (language ?? '').split('-')[0]!.toLowerCase();
  return code === 'zh' || code === 'ja' || code === 'en' ? LANGUAGE_TYPESETTING[code] : undefined;
};

/** Where a first launch takes a value from when its language sets none. */
const FALLBACK_DEFAULTS: Typesetting[] = [
  DEFAULT_BOOK_STYLE,
  DEFAULT_MOBILE_VIEW_SETTINGS,
  DEFAULT_CJK_VIEW_SETTINGS,
];

/** The global defaults of a first launch, after the language of the interface. */
export const getInterfaceTypesetting = (): Typesetting => {
  if (!isYohakuBuild() || typeof window === 'undefined') return {};
  const language = localStorage?.getItem('i18nextLng') || navigator.language;
  return typesettingFor(language) ?? {};
};

/**
 * The typesetting a book takes from its own language, layered between the
 * global settings and the book's own. It covers only the settings whose global
 * value is still what a first launch in the interface language set, so a value
 * the user chose keeps winning. bookService applies it when loading and when
 * saving a book's config, so it is never written into the config and follows
 * later changes to the globals.
 */
export const getBookTypesetting = (book: Book, globals: ViewSettings): Typesetting => {
  if (!isYohakuBuild() || FIXED_LAYOUT_FORMATS.has(book.format)) return {};
  const typesetting = typesettingFor(book.primaryLanguage);
  const ui = getInterfaceTypesetting();
  if (!typesetting || typesetting === ui) return {};
  const isUnchanged = (name: TypesettingKey) => {
    if (name in ui) return ui[name] === globals[name];
    return FALLBACK_DEFAULTS.some((defaults) => defaults[name] === globals[name]);
  };
  return Object.fromEntries(
    Object.entries(typesetting).filter(([key]) => isUnchanged(key as TypesettingKey)),
  ) as Typesetting;
};
