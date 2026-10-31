import type { TrackInfo } from '@/yohaku/audio/engine';

export interface MusicTrack extends TrackInfo {
  id: string;
  addedAt: number;
}

/**
 * The music library: folders kept in sync (every audio file under them is in
 * it) and files imported one by one. Kept in a file of its own in the app's
 * data folder; the music files themselves are never copied or changed.
 */
export interface MusicLibrary {
  version: 1;
  folders: string[];
  files: string[];
  tracks: MusicTrack[];
  /** The last queue, as track ids, so a restarted app shows what is playing. */
  queue: string[];
}

export const EMPTY_LIBRARY: MusicLibrary = {
  version: 1,
  folders: [],
  files: [],
  tracks: [],
  queue: [],
};

export interface Album {
  key: string;
  title: string;
  artist: string;
  cover?: string;
  tracks: MusicTrack[];
}

/** A stable id for a file (FNV-1a of its path or URI). */
export const trackId = (uri: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < uri.length; i++) {
    hash ^= uri.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

/** Scanned tracks as library tracks, keeping when each was first added. */
export const toTracks = (scanned: TrackInfo[], known: MusicTrack[], now: number) => {
  const addedAt = new Map(known.map((track) => [track.uri, track.addedAt]));
  return scanned.map((info) => ({
    ...info,
    id: trackId(info.uri),
    addedAt: addedAt.get(info.uri) ?? now,
  }));
};

/** Tracks with later ones replacing earlier ones of the same file. */
export const mergeTracks = (...lists: MusicTrack[][]) => {
  const byUri = new Map<string, MusicTrack>();
  for (const track of lists.flat()) byUri.set(track.uri, track);
  return [...byUri.values()];
};

/** Whether a track's file lies under a synced folder: a path, or a folder URI on Android. */
export const isUnder = (uri: string, folder: string) => {
  const separator = folder.includes('\\') && !folder.includes('/') ? '\\' : '/';
  return uri.startsWith(folder.endsWith(separator) ? folder : folder + separator);
};

const byTrackOrder = (a: MusicTrack, b: MusicTrack) =>
  a.discNo - b.discNo || a.trackNo - b.trackNo || a.title.localeCompare(b.title);

/** Albums by artist then title; tracks without an album are only listed as songs. */
export const groupAlbums = (tracks: MusicTrack[]): Album[] => {
  const albums = new Map<string, Album>();
  for (const track of tracks) {
    if (!track.album) continue;
    const key = `${track.artist}\u0000${track.album}`;
    const album = albums.get(key) ?? {
      key,
      title: track.album,
      artist: track.artist,
      tracks: [],
    };
    album.cover ??= track.cover;
    album.tracks.push(track);
    albums.set(key, album);
  }
  const list = [...albums.values()];
  list.forEach((album) => album.tracks.sort(byTrackOrder));
  return list.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
};

export const sortSongs = (tracks: MusicTrack[]) =>
  [...tracks].sort((a, b) => a.title.localeCompare(b.title) || a.artist.localeCompare(b.artist));

export const searchTracks = (tracks: MusicTrack[], query: string) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return tracks;
  return tracks.filter((track) => {
    const text = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
};

/** A duration as m:ss, or h:mm:ss from an hour on. */
export const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const rest = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
};
