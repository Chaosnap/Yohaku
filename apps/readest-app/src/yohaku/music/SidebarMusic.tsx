import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { MdPause, MdPlayArrow, MdSkipNext } from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import FavoriteButton from './FavoriteButton';
import LyricsView from './LyricsView';
import { favoriteTracks, sortSongs, type MusicTrack } from './library';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

type View = 'queue' | 'all' | 'favorites';

/** The panel's view, kept on this device. */
const VIEW_KEY = 'yohakuSidebarMusicView';
const VIEWS: View[] = ['queue', 'all', 'favorites'];

const storedView = (): View => {
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    return VIEWS.find((view) => view === stored) ?? 'queue';
  } catch {
    return 'queue';
  }
};

/** Three bars over the cover of the song that plays, pulsing while it plays. */
const Equalizer: React.FC<{ playing: boolean }> = ({ playing }) => (
  <span className='absolute inset-0 flex items-end justify-center gap-[2px] rounded-md bg-black/40 pb-2'>
    {[10, 16, 12].map((height, bar) => (
      <span
        key={bar}
        className={clsx('w-[3px] rounded-full bg-white', playing && 'animate-pulse')}
        style={{ height, animationDelay: `${bar * 180}ms` }}
      />
    ))}
  </span>
);

interface SongRowProps {
  track: MusicTrack;
  current: boolean;
  playing: boolean;
  onPlay: () => void;
}

const SongRow: React.FC<SongRowProps> = ({ track, current, playing, onPlay }) => {
  const _ = useTranslation();
  const iconSize16 = useResponsiveSize(16);
  return (
    <li className='relative'>
      <button
        type='button'
        className={clsx(
          'hover:bg-base-300/60 flex w-full items-center gap-2.5 rounded-lg py-1.5 pe-9 ps-2',
          'text-start',
          current && 'bg-base-300/40',
        )}
        onClick={onPlay}
      >
        <span className='relative w-9 shrink-0'>
          <Cover path={track.cover} title={track.title} className='w-9 rounded-md' />
          {current && <Equalizer playing={playing} />}
        </span>
        <span className='min-w-0 flex-1'>
          <span className={clsx('block truncate text-sm', current && 'font-semibold')}>
            {track.title}
          </span>
          <span className='text-base-content/55 block truncate text-xs'>
            {track.artist || _('Unknown Artist')}
          </span>
        </span>
      </button>
      <FavoriteButton
        track={track}
        size={iconSize16}
        className='text-base-content/50 hover:text-base-content absolute end-1.5 top-1/2 -translate-y-1/2'
      />
    </li>
  );
};

/** What plays, at the head of the panel, to pause or skip without leaving the book. */
const NowPlaying: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const playing = useMusicStore((state) => state.playback.playing);
  const iconSize22 = useResponsiveSize(22);
  if (!appService) return null;

  const { toggle, next } = useMusicStore.getState();
  const playLabel = playing ? _('Pause') : _('Play');
  return (
    <div className='flex shrink-0 items-center gap-3 px-3 py-3'>
      <Cover
        path={track?.cover}
        title={track?.title ?? ''}
        className='not-eink:shadow-md w-11 shrink-0 rounded-lg'
      />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold'>{track?.title ?? _('Not Playing')}</p>
        <p className='text-base-content/60 truncate text-xs'>
          {track ? track.artist || _('Unknown Artist') : ''}
        </p>
      </div>
      <button
        type='button'
        className='hover:bg-base-300/60 shrink-0 rounded-full p-1.5'
        aria-label={playLabel}
        title={playLabel}
        onClick={() => toggle(appService)}
      >
        {playing ? <MdPause size={iconSize22} /> : <MdPlayArrow size={iconSize22} />}
      </button>
      <button
        type='button'
        className='hover:bg-base-300/60 shrink-0 rounded-full p-1.5'
        aria-label={_('Next Track')}
        title={_('Next Track')}
        onClick={() => next(appService)}
      >
        <MdSkipNext size={iconSize22} />
      </button>
    </div>
  );
};

/** A book in a window of its own: the library window may have changed the music since. */
const useFreshMusic = () => {
  const appService = usePlayback();
  useEffect(() => {
    if (appService) useMusicStore.getState().reload(appService);
  }, [appService]);
  return appService;
};

/**
 * The reader sidebar's songs, beside the table of contents: what plays, then
 * the queue, all the songs or the favorites, to change songs without leaving
 * the book.
 */
const SidebarMusic: React.FC = () => {
  const _ = useTranslation();
  const appService = useFreshMusic();
  const library = useMusicStore((state) => state.library);
  const queue = useMusicStore((state) => state.queue);
  const index = useMusicStore((state) => state.playback.index);
  const playing = useMusicStore((state) => state.playback.playing);
  const [view, setView] = useState<View>(storedView);
  const all = useMemo(() => sortSongs(library.tracks), [library.tracks]);
  const favorites = useMemo(() => favoriteTracks(library), [library]);

  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  const current = queue[index];
  const views: { id: View; label: string }[] = [
    { id: 'queue', label: _('Queue') },
    { id: 'all', label: _('All') },
    { id: 'favorites', label: _('Favorites') },
  ];
  // The queue shows what plays now and what comes after it, not the songs already played.
  const upNext = queue.slice(index);
  const list = view === 'queue' ? upNext : view === 'favorites' ? favorites : all;
  const empty: Record<View, string> = {
    queue: _('Nothing is queued. Choose a song from All.'),
    all: _('No songs yet. Add music in the music library.'),
    favorites: _('Tap the heart beside a song to keep it here.'),
  };

  const play = (i: number) => {
    if (!appService) return;
    if (view === 'queue') useMusicStore.getState().skipTo(appService, index + i);
    // A song chosen from all the songs queues it and the ones after it, not the whole list.
    else useMusicStore.getState().play(appService, list.slice(i), 0);
  };

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <NowPlaying />
      <div
        role='tablist'
        className='bg-base-300/50 mx-3 mb-2 flex shrink-0 gap-0.5 rounded-lg p-0.5'
      >
        {views.map(({ id, label }) => (
          <button
            key={id}
            type='button'
            role='tab'
            aria-selected={view === id}
            className={clsx(
              'min-w-0 flex-1 truncate rounded-md px-1 py-1 text-xs',
              view === id
                ? 'bg-base-100 text-base-content not-eink:shadow-sm'
                : 'text-base-content/60 hover:text-base-content',
            )}
            onClick={() => choose(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-3'>
        {list.length === 0 && (
          <p className='text-base-content/55 px-3 py-8 text-center text-xs'>{empty[view]}</p>
        )}
        <ul>
          {list.map((track, i) => (
            <SongRow
              key={`${track.id}-${i}`}
              track={track}
              current={view === 'queue' ? i === 0 : track.id === current?.id}
              playing={playing}
              onPlay={() => play(i)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

/** The reader sidebar's lyrics, beside the songs: what plays, and its words as they are sung. */
export const SidebarLyrics: React.FC = () => {
  useFreshMusic();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  return (
    <div className='flex h-full min-h-0 flex-col'>
      <NowPlaying />
      <LyricsView track={track} className='min-h-0 flex-1' />
    </div>
  );
};

export default SidebarMusic;
