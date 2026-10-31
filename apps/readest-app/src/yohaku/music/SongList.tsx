import clsx from 'clsx';
import { LiaInfoCircleSolid } from 'react-icons/lia';
import { PiPlus } from 'react-icons/pi';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import FavoriteButton from './FavoriteButton';
import { formatDuration, type MusicTrack } from './library';
import { useMusicStore } from './store';

interface SongListProps {
  tracks: MusicTrack[];
  /** An album's songs show their track number in place of the cover and album. */
  numbered?: boolean;
  onShowDetails: (track: MusicTrack) => void;
  /** A last row that imports songs. */
  onAdd?: () => void;
}

/** Songs; choosing one plays the list from there. */
const SongList: React.FC<SongListProps> = ({ tracks, numbered, onShowDetails, onAdd }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const iconSize16 = useResponsiveSize(16);
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
        <li key={track.id} className='relative'>
          <button
            className={clsx(
              'hover:bg-base-300/50 flex w-full items-center gap-3',
              'rounded-lg py-1.5 pe-[4.5rem] ps-2 text-start',
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
          <div className='text-base-content/50 absolute end-2 top-1/2 flex -translate-y-1/2 items-center'>
            <FavoriteButton track={track} size={iconSize16} className='hover:text-base-content' />
            <button
              className='hover:text-base-content p-1'
              aria-label={_('Show Details')}
              title={_('Show Details')}
              onClick={() => onShowDetails(track)}
            >
              <LiaInfoCircleSolid size={iconSize16} />
            </button>
          </div>
        </li>
      ))}
      {onAdd && (
        <li>
          <button
            className='hover:bg-base-300/50 text-base-content/70 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start'
            onClick={onAdd}
          >
            <span className='eink-bordered bg-base-100/50 flex aspect-square w-10 shrink-0 items-center justify-center rounded'>
              <PiPlus aria-hidden className='size-5' />
            </span>
            <span className='text-sm'>{_('Import Files')}</span>
          </button>
        </li>
      )}
    </ul>
  );
};

export default SongList;
