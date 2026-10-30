// No app imports: DocumentLoader loads this module while it parses a comic.

interface ComicArchive {
  entries: { filename: string }[];
  loadText: (name: string) => Promise<string | null>;
}

const isComicInfo = (filename: string) =>
  filename.split('/').pop()?.toLowerCase() === 'comicinfo.xml';

/**
 * The reading direction a comic's ComicInfo.xml gives: `Manga` is
 * `YesAndRightToLeft` for manga read right to left and `No` for a comic that is
 * not manga. `Yes` (manga, direction unstated) and `Unknown` give none.
 * https://anansi-project.github.io/docs/comicinfo/documentation#manga
 */
export const getComicInfoDirection = async ({ entries, loadText }: ComicArchive) => {
  // The archive root first, as foliate-js does for the rest of ComicInfo.xml.
  const entry =
    entries.find((e) => e.filename.toLowerCase() === 'comicinfo.xml') ??
    entries.find((e) => isComicInfo(e.filename));
  if (!entry) return undefined;
  const text = await loadText(entry.filename).catch(() => null);
  if (!text) return undefined;
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const manga = doc.getElementsByTagName('Manga')[0]?.textContent?.trim().toLowerCase();
  if (manga === 'yesandrighttoleft') return 'rtl';
  if (manga === 'no') return 'ltr';
  return undefined;
};
