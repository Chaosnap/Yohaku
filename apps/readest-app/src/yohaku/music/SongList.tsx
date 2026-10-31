import clsx from 'clsx';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import { formatDuration, type MusicTrack } from './library';
import { useMusicStore } from './store';

interface SongListProps {
  tracks: MusicTrack[];
  /** An album's songs show their track number in place of the cover and album. */
  numbered?: boolean;
}

/** Songs; choosing one plays the list from there. */
const SongList: React.FC<SongListProps> = ({ tracks, numbered }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const currentId = useMusicStore((state) => state.queue[state.playback.index]?.id);

  const play = (index: number) => {
    if (appService) useMusicStore.getState().play(appService, tracks, index);
  };
  const byline = (track: MusicTrack) => {
    const artist = track.artist || _('Unknown Artist');
    return numbered || !track.album ? artist : `${artist} · ${track.album}`;
  };

  return (
    <ul className='flex flex-col'>
      {tracks.map((track, index) => (
        <li key={track.id}>
          <button
            className={clsx(
              'hover:bg-base-300/50 flex w-full items-center gap-3',
              'rounded-lg px-2 py-1.5 text-start',
              track.id === currentId && 'text-primary font-medium',
            )}
            onClick={() => play(index)}
          >
            {numbered ? (
              <span className='text-base-content/50 w-6 shrink-0 text-end text-sm tabular-nums'>
                {track.trackNo || index + 1}
              </span>
            ) : (
              <Cover path={track.cover} title={track.title} className='w-10 shrink-0 rounded' />
            )}
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm'>{track.title}</span>
              <span className='text-base-content/60 block truncate text-xs'>{byline(track)}</span>
            </span>
            {track.durationMs > 0 && (
              <span className='text-base-content/50 shrink-0 text-xs tabular-nums'>
                {formatDuration(track.durationMs)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default SongList;
