import type { BookFormat } from '@/types/book';
import type { SystemSettings } from '@/types/settings';
import { isYohakuBuild } from '@/yohaku/build';
import { getYohakuSettings } from '@/yohaku/settings';

/** The direction for a comic that has none of its own, from Yohaku's comics setting. */
export const getComicDefaultDirection = (
  format: BookFormat | undefined,
  settings: SystemSettings,
): 'rtl' | undefined => {
  if (!isYohakuBuild() || format !== 'CBZ') return undefined;
  return getYohakuSettings(settings).comicsRightToLeft ? 'rtl' : undefined;
};
