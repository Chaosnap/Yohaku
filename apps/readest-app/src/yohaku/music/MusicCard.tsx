import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import {
  IoClose,
  IoPause,
  IoPlay,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoVolumeHigh,
  IoVolumeLow,
  IoVolumeMute,
} from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import FavoriteButton from './FavoriteButton';
import { formatDuration } from './library';
import { useMusicStore } from './store';

/**
 * Clear frosted glass in the theme's own colour, lit along its top edge: what is
 * behind it shows through, blurred. E-ink keeps a plain card.
 */
const GLASS = clsx(
  'not-eink:bg-base-100/35 not-eink:backdrop-blur-2xl not-eink:backdrop-saturate-150',
  'not-eink:border not-eink:border-base-content/10',
  'not-eink:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_20px_44px_-20px_rgb(0_0_0/0.55)]',
  'eink-bordered',
);

const ICON_BUTTON = clsx(
  'text-base-content/65 hover:text-base-content grid size-8 shrink-0 place-items-center',
  'not-eink:hover:bg-base-content/10 not-eink:transition rounded-full active:scale-90',
);

/** The ring's length around the play button: a circle of radius 21 in a 44 box. */
const RING = 2 * Math.PI * 21;

interface PlayRingProps {
  playing: boolean;
  /** How far the song has played, from 0 to 1. */
  played: number;
  /** A new song starts its ring empty, instead of winding back to it. */
  trackId?: string;
}

/** Play or pause, in a ring that fills as the song plays. */
const PlayRing: React.FC<PlayRingProps> = ({ playing, played, trackId }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const iconSize = useResponsiveSize(17);
  if (!appService) return null;

  const label = playing ? _('Pause') : _('Play');
  return (
    <button
      type='button'
      className='not-eink:transition-transform relative grid size-11 shrink-0 place-items-center rounded-full active:scale-95'
      aria-label={label}
      title={label}
      onClick={() => useMusicStore.getState().toggle(appService)}
    >
      <svg viewBox='0 0 44 44' aria-hidden='true' className='absolute inset-0 size-full -rotate-90'>
        <circle
          cx='22'
          cy='22'
          r='21'
          fill='none'
          strokeWidth='2'
          className='stroke-base-content/15'
        />
        {played > 0 && (
          <circle
            key={trackId}
            cx='22'
            cy='22'
            r='21'
            fill='none'
            strokeWidth='2'
            strokeLinecap='round'
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - played)}
            className='stroke-base-content not-eink:transition-[stroke-dashoffset] not-eink:duration-1000 not-eink:ease-linear'
          />
        )}
      </svg>
      <span className='bg-base-content text-base-100 not-eink:shadow-md grid size-[34px] place-items-center rounded-full'>
        {playing ? <IoPause size={iconSize} /> : <IoPlay size={iconSize} className='ms-0.5' />}
      </span>
    </button>
  );
};

/** The music's volume: a slider above the card. The wheel over the button turns it too. */
const VolumeControl: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const volume = useMusicStore((state) => state.volume);
  const iconSize18 = useResponsiveSize(18);
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
  const Icon = volume === 0 ? IoVolumeMute : volume < 0.5 ? IoVolumeLow : IoVolumeHigh;
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
        <Icon size={iconSize18} />
      </button>
      {open && (
        <div
          className={clsx(
            'absolute bottom-full end-0 mb-3 flex w-56 items-center gap-2 rounded-2xl p-2',
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
            <Icon size={iconSize18} />
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
 * What plays in the music library, as a floating card of clear frosted glass:
 * the cover, which settles back while the song is paused, the song and how long
 * is left, and the controls, with how far the song is as a ring around the play
 * button; then the heart, the volume and stopping. The reader has no floating
 * player: its footer turns into the music's controls (FooterMusicBar).
 */
const MusicCard: React.FC<MusicCardProps> = ({ onExpand }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const { playing, positionMs, durationMs } = useMusicStore((state) => state.playback);
  const iconSize18 = useResponsiveSize(18);
  if (!appService) return null;

  const { next, previous, stop } = useMusicStore.getState();
  const played = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const left = durationMs > 0 ? `-${formatDuration(durationMs - positionMs)}` : '';
  const artist = track ? track.artist || _('Unknown Artist') : '';
  const byline = [artist, left].filter(Boolean).join(' · ');

  return (
    <div className={clsx('relative rounded-[26px]', GLASS)}>
      <div className='text-base-content flex h-[72px] items-center gap-3 pe-2 ps-3'>
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
            className={clsx(
              'ring-base-content/10 w-12 shrink-0 rounded-[14px] ring-1',
              'not-eink:shadow-[0_8px_18px_-8px_rgb(0_0_0/0.6)] not-eink:transition-transform',
              'not-eink:duration-500 not-eink:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              !playing && 'scale-[0.86]',
            )}
          />
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='truncate text-sm font-semibold tracking-tight'>
              {track?.title ?? _('Not Playing')}
            </span>
            {byline && (
              <span className='text-base-content/60 truncate text-xs tabular-nums'>{byline}</span>
            )}
          </span>
        </button>
        <div dir='ltr' className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            className={clsx(ICON_BUTTON, 'max-sm:hidden')}
            aria-label={_('Previous Track')}
            title={_('Previous Track')}
            onClick={() => previous(appService)}
          >
            <IoPlaySkipBack size={iconSize18} />
          </button>
          <PlayRing playing={playing} played={played} trackId={track?.id} />
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={_('Next Track')}
            title={_('Next Track')}
            onClick={() => next(appService)}
          >
            <IoPlaySkipForward size={iconSize18} />
          </button>
        </div>
        <span aria-hidden='true' className='bg-base-content/10 h-7 w-px shrink-0' />
        <div className='flex shrink-0 items-center'>
          <FavoriteButton track={track} size={iconSize18} className={ICON_BUTTON} />
          {!appService.isMobile && <VolumeControl />}
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={_('Stop Music')}
            title={_('Stop Music')}
            onClick={() => stop(appService)}
          >
            <IoClose size={iconSize18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicCard;
