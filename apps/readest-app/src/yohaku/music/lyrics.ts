/**
 * Lyrics in the LRC form: `[mm:ss.xx]` before each line, and `<mm:ss.xx>`
 * before each word in the enhanced form. A line with the same time as the
 * line before is its translation, as many Chinese and Japanese lyrics files
 * have it. Lyrics without any time are shown as they are, without following
 * the song.
 */

export interface LyricWord {
  /** Milliseconds into the song. */
  time: number;
  text: string;
}

export interface LyricLine {
  /** Milliseconds into the song. A line without text is a pause in the singing. */
  time: number;
  text: string;
  translation?: string;
  /** Word by word, in the enhanced form; the last may be empty, to say when the line ends. */
  words?: LyricWord[];
}

export interface Lyrics {
  /** Whether the lines have times to follow the song by. */
  synced: boolean;
  lines: LyricLine[];
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const WORD_TAG = /<(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?>/g;
const OFFSET_TAG = /\[offset:\s*([+-]?\d+)\s*\]/i;
const INFO_TAG = /^\[[a-z]+:[^\]]*\]$/i;

const toMs = (minutes = '0', seconds = '0', fraction = '') =>
  (Number(minutes) * 60 + Number(seconds)) * 1000 + Number(fraction.padEnd(3, '0').slice(0, 3));

/** A lyrics file's text: UTF-8 or UTF-16, or else GBK, as many Chinese lyrics files are. */
export const decodeLyrics = (bytes: Uint8Array) => {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('gb18030').decode(bytes);
  }
};

const parseWords = (content: string, offset: number) => {
  const tags = [...content.matchAll(WORD_TAG)];
  if (tags.length === 0) return { text: content };
  const words: LyricWord[] = [];
  tags.forEach((tag, i) => {
    const start = (tag.index ?? 0) + tag[0].length;
    const end = tags[i + 1]?.index ?? content.length;
    const text = content.slice(start, end);
    const time = Math.max(0, toMs(tag[1], tag[2], tag[3]) - offset);
    // A tag with nothing after it ends the word before.
    if (text || i === tags.length - 1) words.push({ time, text });
  });
  return { text: words.map((word) => word.text).join(''), words };
};

/** Lyrics from a lyrics file or tag; null when there is nothing to show. */
export const parseLyrics = (source: string): Lyrics | null => {
  // A positive offset shows the lyrics that much earlier.
  const offset = Number(OFFSET_TAG.exec(source)?.[1] ?? 0);
  const timed: LyricLine[] = [];
  const plain: string[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || INFO_TAG.test(line)) continue;
    const times = [...line.matchAll(TIME_TAG)];
    if (times.length === 0) {
      plain.push(line);
      continue;
    }
    const { text, words } = parseWords(line.replace(TIME_TAG, '').trim(), offset);
    for (const time of times) {
      const ms = Math.max(0, toMs(time[1], time[2], time[3]) - offset);
      timed.push(words ? { time: ms, text, words } : { time: ms, text });
    }
  }
  if (timed.length === 0) {
    if (plain.length === 0) return null;
    return { synced: false, lines: plain.map((text) => ({ time: 0, text })) };
  }
  timed.sort((a, b) => a.time - b.time);
  const lines: LyricLine[] = [];
  for (const line of timed) {
    const previous = lines[lines.length - 1];
    const sameTime = previous && previous.time === line.time && previous.text && line.text;
    if (previous && sameTime && !previous.translation) previous.translation = line.text;
    else lines.push(line);
  }
  return { synced: true, lines };
};

/** The line being sung at `positionMs`: the last that has begun, or -1 before the first. */
export const activeLine = (lines: LyricLine[], positionMs: number) => {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if ((lines[middle]?.time ?? 0) <= positionMs) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
};
