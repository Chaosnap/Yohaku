'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { IoMusicalNotesOutline } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/store/themeStore';
import AlbumDetail from './AlbumDetail';
import AlbumGrid from './AlbumGrid';
import MusicHeader from './MusicHeader';
import NowPlayingBar from './NowPlayingBar';
import PlayerSheet from './PlayerSheet';
import SongList from './SongList';
import Sources from './Sources';
import { groupAlbums, searchTracks, sortSongs } from './library';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

type Tab = 'albums' | 'songs' | 'folders';

/** The first visit: the two ways to bring music in. */
const EmptyLibrary: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  if (!appService) return null;

  const { addFolder, importFiles } = useMusicStore.getState();
  return (
    <div className='flex flex-1 items-center justify-center px-6 text-center'>
      <div className='flex max-w-md flex-col items-center'>
        <IoMusicalNotesOutline aria-hidden className='text-base-content/60 mb-10 size-16' />
        <h1 className='mb-5 text-balance text-4xl font-semibold leading-tight tracking-tight'>
          {_('Start your music library')}
        </h1>
        <p className='text-base-content/70 mb-12 text-pretty text-base leading-relaxed'>
          {_('Sync a folder to bring in every song in it, or import songs one by one.')}
        </p>
        <div className='flex w-full max-w-xs flex-col gap-3'>
          <button
            className='btn btn-primary h-11 min-h-11 rounded-lg'
            onClick={() => addFolder(appService)}
          >
            {_('Sync a Folder')}
          </button>
          <button
            className='btn btn-ghost h-11 min-h-11 rounded-lg'
            onClick={() => importFiles(appService)}
          >
            {_('Import Files')}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * The music library (docs/yohaku/02-architecture.md §3): songs from synced
 * folders and from files imported one by one, by album or by song, with the
 * player and Yohaku's ambient sounds. On Android the music plays in a
 * background media service and keeps going with the screen locked.
 */
export default function MusicPage() {
  const _ = useTranslation();
  const appService = usePlayback();
  const { safeAreaInsets: insets, isRoundedWindow } = useThemeStore();
  const library = useMusicStore((state) => state.library);
  const loaded = useMusicStore((state) => state.loaded);
  const syncing = useMusicStore((state) => state.syncing);
  const [tab, setTab] = useState<Tab | null>(null);
  const [query, setQuery] = useState('');
  const [albumKey, setAlbumKey] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  useTheme({ systemUIVisible: true, appThemeColor: 'base-200' });

  const tracks = useMemo(() => searchTracks(library.tracks, query), [library.tracks, query]);
  const albums = useMemo(() => groupAlbums(tracks), [tracks]);
  const songs = useMemo(() => sortSongs(tracks), [tracks]);

  if (!appService || !insets) return <div className='full-height bg-base-200' />;

  const isEmpty = library.folders.length + library.files.length === 0;
  const current = tab ?? (albums.length > 0 ? 'albums' : 'songs');
  const album = albums.find(({ key }) => key === albumKey);
  const tabs: { id: Tab; label: string }[] = [
    { id: 'albums', label: _('Albums') },
    { id: 'songs', label: _('Songs') },
    { id: 'folders', label: _('Folders') },
  ];
  const showTab = (id: Tab) => {
    setTab(id);
    setAlbumKey(null);
  };

  return (
    <div
      className={clsx(
        'text-base-content full-height bg-base-200 flex select-none flex-col overflow-hidden',
        appService.hasRoundedWindow && isRoundedWindow && 'window-border rounded-window',
      )}
    >
      <MusicHeader query={query} onQueryChange={setQuery} />
      <progress
        className={clsx('progress progress-success h-1 shrink-0', !syncing && 'invisible')}
        aria-label={_('Syncing')}
      />
      {isEmpty && loaded && <EmptyLibrary />}
      {!isEmpty && (
        <>
          <div role='tablist' className='flex shrink-0 gap-1 px-4 pb-3 sm:px-6'>
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                role='tab'
                aria-selected={current === id}
                className={clsx(
                  'rounded-full px-3 py-1 text-sm',
                  current === id ? 'bg-base-content text-base-100' : 'hover:bg-base-300/60',
                )}
                onClick={() => showTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className='min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6'
            style={{ marginLeft: insets.left, marginRight: insets.right }}
          >
            {current === 'albums' && album && (
              <AlbumDetail album={album} onBack={() => setAlbumKey(null)} />
            )}
            {current === 'albums' && !album && (
              <AlbumGrid albums={albums} onOpen={({ key }) => setAlbumKey(key)} />
            )}
            {current === 'songs' && <SongList tracks={songs} />}
            {current === 'folders' && <Sources />}
            {current !== 'folders' && tracks.length === 0 && (
              <p className='text-base-content/60 py-10 text-center text-sm'>{_('No Songs')}</p>
            )}
          </div>
        </>
      )}
      <NowPlayingBar onOpen={() => setShowPlayer(true)} />
      {showPlayer && <PlayerSheet onClose={() => setShowPlayer(false)} />}
    </div>
  );
}
