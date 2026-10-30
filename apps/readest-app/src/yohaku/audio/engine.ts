/**
 * The music player's audio engine (docs/yohaku/02-architecture.md §3.2, in a
 * first form). Android plays in a native Media3 service that keeps going in
 * the background; the desktop plays in the WebView for now.
 */

export interface AudioFile {
  /** A content:// URI on Android, a file path on the desktop. */
  uri: string;
  name: string;
}

export interface AmbientLayer extends AudioFile {
  volume: number;
}

export interface PlaybackState {
  playing: boolean;
  index: number;
  positionMs: number;
  durationMs: number;
}

export interface AudioEngine {
  /** Asks the user for audio files; empty when they cancel. */
  pickFiles(): Promise<AudioFile[]>;
  setQueue(tracks: AudioFile[], start: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  skipTo(index: number): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  setAmbient(layers: AmbientLayer[]): Promise<void>;
  /** Fades everything out after `afterMs` over `fadeMs`, then pauses; 0 cancels. */
  setSleepTimer(afterMs: number, fadeMs: number): Promise<void>;
  getState(): Promise<PlaybackState>;
}

/** A readable name for a picked file: its last path segment, decoded. */
export const fileName = (uri: string) => {
  let name = uri;
  try {
    name = decodeURIComponent(uri);
  } catch {}
  // Content URIs often end in a document id such as `primary:Music/Song.flac`.
  return name.split(/[/\\:]/).pop() || name;
};
