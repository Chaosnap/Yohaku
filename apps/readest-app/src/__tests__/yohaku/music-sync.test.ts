import { describe, expect, it, vi } from 'vitest';
import type { AppService } from '@/types/system';
import type { TrackInfo } from '@/yohaku/audio/engine';
import { EMPTY_LIBRARY, toTracks } from '@/yohaku/music/library';
import { useMusicStore } from '@/yohaku/music/store';

/** What each synced folder holds now; a folder left out reads as empty. */
const onDisk: Record<string, TrackInfo[]> = {};

vi.mock('@/yohaku/audio', () => ({
  getAudioEngine: () => ({
    scan: async (paths: string[]) => paths.flatMap((path) => onDisk[path] ?? []),
  }),
}));

const files = new Map<string, string>();
const appService = {
  exists: async (path: string) => files.has(path),
  readFile: async (path: string) => files.get(path),
  writeFile: async (path: string, _base: string, text: string) => {
    files.set(path, text);
  },
  createDir: async () => {},
} as unknown as AppService;

const info = (uri: string, title = uri.split('/').pop()!): TrackInfo => ({
  uri,
  title,
  artist: '',
  album: '',
  trackNo: 0,
  discNo: 0,
  durationMs: 0,
});

describe('syncing the music library at startup', () => {
  it('reads every folder again, but keeps the songs of a folder that reads as empty', async () => {
    const known = toTracks([info('/Music/a.flac'), info('/Drive/b.flac')], [], 1);
    useMusicStore.setState({
      library: { ...EMPTY_LIBRARY, folders: ['/Music', '/Drive'], tracks: known },
    });
    // A song was retagged and one added in /Music; the drive with /Drive is not plugged in.
    onDisk['/Music'] = [info('/Music/a.flac', 'Aubade'), info('/Music/c.flac')];

    await useMusicStore.getState().syncAtStartup(appService);

    const { tracks } = useMusicStore.getState().library;
    expect(tracks.map(({ uri, title }) => `${uri} ${title}`).sort()).toEqual([
      '/Drive/b.flac b.flac',
      '/Music/a.flac Aubade',
      '/Music/c.flac c.flac',
    ]);
    // When a song was first added is kept.
    expect(tracks.find(({ uri }) => uri === '/Music/a.flac')?.addedAt).toBe(1);
    expect(JSON.parse(files.get('yohaku/music-library.json')!).tracks).toHaveLength(3);
  });
});
