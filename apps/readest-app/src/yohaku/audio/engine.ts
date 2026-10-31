/**
 * The music player's audio engine (docs/yohaku/02-architecture.md §3.2, in a
 * first form). Android plays in a native Media3 service that keeps going in
 * the background; the desktop plays in the WebView for now. Both read the
 * music library's files natively (tags and covers).
 */

/** What the platform reads from one audio file. */
export interface TrackInfo {
  /** A content:// URI on Android, a file path on the desktop. */
  uri: string;
  title: string;
  artist: string;
  album: string;
  trackNo: number;
  discNo: number;
  durationMs: number;
  /** A cached cover image (a file path), when the file has one. */
  cover?: string;
  /** Read since 1.5; a library synced before has none until it is synced again. */
  year?: number;
  genre?: string;
  /** Kilobits per second. */
  bitrate?: number;
  /** Hz. */
  sampleRate?: number;
  /** Bytes. */
  size?: number;
}

export interface QueueItem {
  uri: string;
  title: string;
  artist?: string;
  /** Shown on the lock screen and in the media notification. */
  cover?: string;
}

export interface AmbientSource {
  /** An audio file the engine loops. */
  uri: string;
  volume: number;
}

export interface PlaybackState {
  playing: boolean;
  index: number;
  positionMs: number;
  durationMs: number;
}

export interface AudioEngine {
  /** A folder to sync the library from; null when the user cancels. */
  pickFolder(): Promise<string | null>;
  /** Audio files to import one by one; empty when the user cancels. */
  pickFiles(): Promise<string[]>;
  /** The tracks in folders (searched recursively) and files, with their tags. */
  scan(paths: string[]): Promise<TrackInfo[]>;
  setQueue(tracks: QueueItem[], start: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  skipTo(index: number): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  /** Loops these sounds by themselves, beside the music or reading aloud; none stops them. */
  setAmbient(layers: AmbientSource[]): Promise<void>;
  /** The ambient sounds looping now. */
  getAmbient(): Promise<AmbientSource[]>;
  /**
   * Fades the music and the ambient sounds out after `afterMs` over `fadeMs`,
   * then pauses the music and stops the ambient sounds; 0 cancels.
   */
  setSleepTimer(afterMs: number, fadeMs: number): Promise<void>;
  getState(): Promise<PlaybackState>;
  /** The music's volume, 0 to 1; the ambient sounds keep their own. */
  setVolume(volume: number): Promise<void>;
  /** The song's lyrics: a `.lrc` file of the same name beside it, or its lyrics tag. */
  readLyrics(uri: string): Promise<string | null>;
}

/** A readable name for a path or content URI: its last segment, decoded. */
export const fileName = (uri: string) => {
  let name = uri;
  try {
    name = decodeURIComponent(uri);
  } catch {}
  // Content URIs often end in a document id such as `primary:Music/Song.flac`.
  return name.split(/[/\\:]/).pop() || name;
};
