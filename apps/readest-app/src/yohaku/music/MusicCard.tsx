import {
  MdClose,
  MdPauseCircleFilled,
  MdPlayCircleFilled,
  MdSkipNext,
  MdSkipPrevious,
} from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import { formatDuration } from './library';
import { useMusicStore } from './store';

interface MusicCardProps {
  /** Opens the full player. */
  onExpand: () => void;
}

/**
 * What plays, as a small floating card laid out as Readest's read-aloud mini
 * player (TTSMiniPlayer, its full style): the cover, the song and how long is
 * left, the controls, and a line along the bottom edge for how far it is.
 */
const MusicCard: React.FC<MusicCardProps> = ({ onExpand }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const { playing, positionMs, durationMs } = useMusicStore((state) => state.playback);
  const iconSize20 = useResponsiveSize(20);
  const iconSize28 = useResponsiveSize(28);
  const iconSize40 = useResponsiveSize(40);
  if (!appService) return null;

  const { toggle, next, previous, stop } = useMusicStore.getState();
  const played = durationMs > 0 ? Math.min((positionMs / durationMs) * 100, 100) : 0;
  const left = durationMs > 0 ? `-${formatDuration(durationMs - positionMs)}` : '';
  const artist = track ? track.artist || _('Unknown Artist') : '';
  const byline = [artist, left].filter(Boolean).join(' · ');

  return (
    <div className='not-eink:bg-base-300 eink-bordered relative overflow-hidden rounded-2xl shadow-lg'>
      <div
        aria-hidden='true'
        className='not-eink:bg-neutral-content/15 eink:bg-base-100 eink:border-base-content eink:border-t eink:h-[5px] absolute inset-x-0 bottom-0 h-[3px]'
      >
        <div
          className='not-eink:bg-primary eink:bg-base-content absolute inset-y-0 left-0'
          style={{ width: `${played}%` }}
        />
      </div>
      <div className='text-base-content flex h-14 items-center gap-1 px-2'>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-center gap-2 text-start'
          aria-label={_('Now Playing')}
          title={_('Now Playing')}
          onClick={onExpand}
        >
          <Cover
            path={track?.cover}
            title={track?.title ?? ''}
            className='w-10 shrink-0 rounded-lg'
          />
          <span className='flex min-w-0 flex-col'>
            <span className='truncate text-sm'>{track?.title ?? _('Not Playing')}</span>
            {byline && (
              <span className='text-base-content/70 truncate text-xs tabular-nums'>{byline}</span>
            )}
          </span>
        </button>
        <div dir='ltr' className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            className='shrink-0 rounded-full p-1'
            aria-label={_('Previous Track')}
            title={_('Previous Track')}
            onClick={() => previous(appService)}
          >
            <MdSkipPrevious size={iconSize28} />
          </button>
          <button
            type='button'
            className='shrink-0 rounded-full p-0.5'
            aria-label={playing ? _('Pause') : _('Play')}
            title={playing ? _('Pause') : _('Play')}
            onClick={() => toggle(appService)}
          >
            {playing ? (
              <MdPauseCircleFilled size={iconSize40} />
            ) : (
              <MdPlayCircleFilled size={iconSize40} />
            )}
          </button>
          <button
            type='button'
            className='shrink-0 rounded-full p-1'
            aria-label={_('Next Track')}
            title={_('Next Track')}
            onClick={() => next(appService)}
          >
            <MdSkipNext size={iconSize28} />
          </button>
          <button
            type='button'
            className='shrink-0 rounded-full p-1'
            aria-label={_('Stop Music')}
            title={_('Stop Music')}
            onClick={() => stop(appService)}
          >
            <MdClose size={iconSize20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicCard;
