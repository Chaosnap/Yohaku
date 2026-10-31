import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import {
  MdClose,
  MdPause,
  MdPlayArrow,
  MdSkipNext,
  MdSkipPrevious,
  MdVolumeDown,
  MdVolumeOff,
  MdVolumeUp,
} from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import FavoriteButton from './FavoriteButton';
import { formatDuration } from './library';
import { useMusicStore } from './store';

/** Frosted glass: what lies behind shows through, blurred. E-ink keeps a plain card. */
export const GLASS = clsx(
  'not-eink:bg-base-100/60 not-eink:backdrop-blur-2xl not-eink:backdrop-saturate-150',
  'not-eink:border not-eink:border-base-content/10',
  'not-eink:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.4)] eink-bordered',
);

const ICON_BUTTON = clsx(
  'text-base-content/75 hover:text-base-content shrink-0 rounded-full p-1.5',
  'not-eink:hover:bg-base-content/10 not-eink:transition-colors',
);

/** The music's volume: a slider above the card. The wheel over the button turns it too. */
const VolumeControl: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const volume = useMusicStore((state) => state.volume);
  const iconSize20 = useResponsiveSize(20);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // What unmuting goes back to.
  const before = useRef(volume > 0 ? volume : 1);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  if (!appService) return null;
  const change = (value: number) => {
    const next = Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
    if (next > 0) before.current = next;
    useMusicStore.getState().setVolume(appService, next);
  };
  const Icon = volume === 0 ? MdVolumeOff : volume < 0.5 ? MdVolumeDown : MdVolumeUp;
  const muteLabel = volume === 0 ? _('Unmute') : _('Mute');

  return (
    <div
      ref={box}
      className='relative'
      onWheel={(event) => change(volume - Math.sign(event.deltaY) * 0.05)}
    >
      <button
        type='button'
        className={ICON_BUTTON}
        aria-label={_('Volume')}
        aria-expanded={open}
        title={_('Volume')}
        onClick={() => setOpen(!open)}
      >
        <Icon size={iconSize20} />
      </button>
      {open && (
        <div
          className={clsx(
            'absolute bottom-full end-0 mb-3 flex w-56 items-center gap-2 rounded-2xl px-2 py-2',
            GLASS,
          )}
        >
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={muteLabel}
            title={muteLabel}
            onClick={() => change(volume === 0 ? before.current : 0)}
          >
            <Icon size={iconSize20} />
          </button>
          <input
            type='range'
            className='range range-xs flex-1'
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label={_('Volume')}
            onChange={(event) => change(Number(event.target.value))}
          />
          <span className='text-base-content/60 w-7 shrink-0 text-end text-xs tabular-nums'>
            {Math.round(volume * 100)}
          </span>
        </div>
      )}
    </div>
  );
};

interface MusicCardProps {
  /** Opens the full player. */
  onExpand: () => void;
}

/**
 * What plays, as a small floating card of frosted glass: the cover, the song
 * and how long is left, the controls, the heart and the volume, and a thin
 * line along the bottom for how far the song is.
 */
const MusicCard: React.FC<MusicCardProps> = ({ onExpand }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const { playing, positionMs, durationMs } = useMusicStore((state) => state.playback);
  const iconSize20 = useResponsiveSize(20);
  const iconSize24 = useResponsiveSize(24);
  const iconSize26 = useResponsiveSize(26);
  if (!appService) return null;

  const { toggle, next, previous, stop } = useMusicStore.getState();
  const played = durationMs > 0 ? Math.min((positionMs / durationMs) * 100, 100) : 0;
  const left = durationMs > 0 ? `-${formatDuration(durationMs - positionMs)}` : '';
  const artist = track ? track.artist || _('Unknown Artist') : '';
  const byline = [artist, left].filter(Boolean).join(' · ');
  const playLabel = playing ? _('Pause') : _('Play');

  return (
    <div className={clsx('relative rounded-[22px]', GLASS)}>
      <div className='text-base-content flex h-16 items-center gap-2 pe-2 ps-2.5'>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-center gap-3 text-start'
          aria-label={_('Now Playing')}
          title={_('Now Playing')}
          onClick={onExpand}
        >
          <Cover
            path={track?.cover}
            title={track?.title ?? ''}
            className='not-eink:shadow-md w-11 shrink-0 rounded-xl'
          />
          <span className='flex min-w-0 flex-col'>
            <span className='truncate text-sm font-medium'>{track?.title ?? _('Not Playing')}</span>
            {byline && (
              <span className='text-base-content/60 truncate text-xs tabular-nums'>{byline}</span>
            )}
          </span>
        </button>
        <div dir='ltr' className='flex shrink-0 items-center gap-0.5'>
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={_('Previous Track')}
            title={_('Previous Track')}
            onClick={() => previous(appService)}
          >
            <MdSkipPrevious size={iconSize24} />
          </button>
          <button
            type='button'
            className={clsx(
              'bg-base-content text-base-100 mx-0.5 flex size-10 shrink-0 items-center',
              'not-eink:shadow-md not-eink:transition-transform justify-center rounded-full',
              'active:scale-95',
            )}
            aria-label={playLabel}
            title={playLabel}
            onClick={() => toggle(appService)}
          >
            {playing ? <MdPause size={iconSize26} /> : <MdPlayArrow size={iconSize26} />}
          </button>
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={_('Next Track')}
            title={_('Next Track')}
            onClick={() => next(appService)}
          >
            <MdSkipNext size={iconSize24} />
          </button>
        </div>
        <div className='flex shrink-0 items-center'>
          <FavoriteButton track={track} size={iconSize20} className={ICON_BUTTON} />
          {!appService.isMobile && <VolumeControl />}
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={_('Stop Music')}
            title={_('Stop Music')}
            onClick={() => stop(appService)}
          >
            <MdClose size={iconSize20} />
          </button>
        </div>
      </div>
      <div
        aria-hidden='true'
        className='bg-base-content/10 eink:bg-base-100 absolute inset-x-4 bottom-1.5 h-[3px] overflow-hidden rounded-full'
      >
        <div
          className='not-eink:bg-base-content/60 eink:bg-base-content h-full rounded-full'
          style={{ width: `${played}%` }}
        />
      </div>
    </div>
  );
};

export default MusicCard;
