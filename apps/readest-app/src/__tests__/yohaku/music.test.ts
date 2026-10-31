import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SystemSettings } from '@/types/settings';
import { fileName } from '@/yohaku/audio/engine';
import {
  formatDuration,
  groupAlbums,
  isUnder,
  mergeTracks,
  searchTracks,
  sortSongs,
  toTracks,
  trackId,
  type MusicTrack,
} from '@/yohaku/music/library';
import { getYohakuSettings } from '@/yohaku/settings';

const ANDROID_URI =
  'content://com.android.externalstorage.documents/document/primary%3AMusic%2FRain.ogg';
const ANDROID_FOLDER = 'content://com.android.externalstorage.documents/tree/primary%3AMusic';

const track = (uri: string, tags: Partial<MusicTrack> = {}): MusicTrack => ({
  uri,
  title: fileName(uri),
  artist: '',
  album: '',
  trackNo: 0,
  discNo: 0,
  durationMs: 0,
  id: trackId(uri),
  addedAt: 0,
  ...tags,
});

describe('music file names', () => {
  it('are the last part of a path or a content URI', () => {
    expect(fileName('/Users/yuki/Music/Nocturne.flac')).toBe('Nocturne.flac');
    expect(fileName('C:\\Music\\Gymnopédie.mp3')).toBe('Gymnopédie.mp3');
    expect(fileName(ANDROID_URI)).toBe('Rain.ogg');
    expect(fileName(ANDROID_FOLDER)).toBe('Music');
  });
});

describe('music settings', () => {
  it('start with no ambient sounds', () => {
    expect(getYohakuSettings({} as SystemSettings).ambientLayers).toEqual([]);
  });

  it('drop the ambient files of earlier versions, which are not Yohaku sounds', () => {
    const earlier = { uri: '/Music/rain.ogg', name: 'rain.ogg', volume: 0.6 };
    const rain = { id: 'rain', volume: 0.7 };
    const yohaku = { ambientLayers: [earlier, rain] };
    const settings = { yohaku } as unknown as SystemSettings;
    expect(getYohakuSettings(settings).ambientLayers).toEqual([rain]);
  });
});

describe('the music library', () => {
  it('knows which synced folder a song is in', () => {
    expect(isUnder('/Music/Satie/Gymnopédie.flac', '/Music')).toBe(true);
    expect(isUnder('/Music/Satie/Gymnopédie.flac', '/Music/')).toBe(true);
    expect(isUnder('/Musical/Song.flac', '/Music')).toBe(false);
    expect(isUnder('C:\\Music\\Song.mp3', 'C:\\Music')).toBe(true);
    const songUri = `${ANDROID_FOLDER}/document/primary%3AMusic%2FRain.ogg`;
    expect(isUnder(songUri, ANDROID_FOLDER)).toBe(true);
  });

  it('keeps when a song was first added, and one entry per file', () => {
    const known = [track('/Music/a.flac', { addedAt: 1 })];
    const scanned = [track('/Music/a.flac', { title: 'A' }), track('/Music/b.flac')];
    const found = toTracks(scanned, known, 5);
    expect(found.map(({ addedAt }) => addedAt)).toEqual([1, 5]);
    const merged = mergeTracks(known, found);
    expect(merged).toHaveLength(2);
    expect(merged[0]!.title).toBe('A');
  });

  it('groups songs into albums, in disc and track order', () => {
    const songs = [
      track('/m/3.flac', { artist: 'Satie', album: 'Piano', trackNo: 2, cover: '/c.jpg' }),
      track('/m/1.flac', { artist: 'Satie', album: 'Piano', trackNo: 1 }),
      track('/m/2.flac', { artist: 'Debussy', album: 'Préludes', trackNo: 1 }),
      track('/m/single.flac', { artist: 'Satie' }),
    ];
    const albums = groupAlbums(songs);
    expect(albums.map(({ title }) => title)).toEqual(['Préludes', 'Piano']);
    expect(albums[1]!.tracks.map(({ uri }) => uri)).toEqual(['/m/1.flac', '/m/3.flac']);
    expect(albums[1]!.cover).toBe('/c.jpg');
  });

  it('sorts songs by title and finds them by any of their tags', () => {
    const songs = [
      track('/m/b.flac', { title: 'Nocturne', artist: 'Chopin' }),
      track('/m/a.flac', { title: 'Clair de lune', artist: 'Debussy', album: 'Suite' }),
    ];
    expect(sortSongs(songs).map(({ title }) => title)).toEqual(['Clair de lune', 'Nocturne']);
    expect(searchTracks(songs, 'debussy SUITE')).toHaveLength(1);
    expect(searchTracks(songs, 'chopin suite')).toHaveLength(0);
    expect(searchTracks(songs, '  ')).toHaveLength(2);
  });

  it('shows durations as a clock does', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });
});

describe('music shortcuts', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('have keys no other action uses, in a Music section of their own', async () => {
    vi.stubEnv('NEXT_PUBLIC_YOHAKU_BUILD', 'true');
    vi.resetModules();
    const { SHORTCUT_SECTIONS, getDefaultShortcuts } = await import('@/helpers/shortcuts');
    expect(SHORTCUT_SECTIONS).toContain('Music');
    const shortcuts = getDefaultShortcuts();
    const music = ['onMusicPlayPause', 'onMusicNext', 'onMusicPrevious'] as const;
    expect(music.map((action) => shortcuts[action].keys)).toEqual([['m'], ['.'], [',']]);
    const others = Object.entries(shortcuts).filter(([action]) => !action.startsWith('onMusic'));
    const taken = others.flatMap(([, entry]) => entry.keys);
    for (const key of ['m', '.', ',']) expect(taken).not.toContain(key);
  });
});
