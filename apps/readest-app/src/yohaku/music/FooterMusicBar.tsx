import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import {
  RiHeartFill,
  RiHeartLine,
  RiPauseLine,
  RiPlayLine,
  RiSkipBackLine,
  RiSkipForwardLine,
  RiVolumeDownLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from 'react-icons/ri';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { Insets } from '@/types/misc';
import Button from '@/components/Button';
import ModalPortal from '@/components/ModalPortal';
import MusicButton from './MusicButton';
import PlayerSheet from './PlayerSheet';
import { formatDuration } from './library';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

/**
 * The reader's footer as the music's controls: the footer's music button turns
 * it into this, and back. It is made of the footer's own parts (its buttons,
 * its "now / all" label and its slider), so it reads as the same bar.
 */

/** What plays, kept fresh; the song opens the full player. */
const useMusicBar = () => {
  const appService = usePlayback();
  const [showPlayer, setShowPlayer] = useState(false);

  // A book in a window of its own: the library window may have started other music since.
  useEffect(() => {
    if (appService) useMusicStore.getState().reload(appService);
  }, [appService]);

  const player = showPlayer && appService && (
    <ModalPortal showOverlay={false}>
      <PlayerSheet showShortcuts={!appService.isMobile} onClose={() => setShowPlayer(false)} />
    </ModalPortal>
  );
  return { appService, openPlayer: () => setShowPlayer(true), player };
};

const Transport: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const playing = useMusicStore((state) => state.playback.playing);
  if (!appService) return null;

  const { previous, toggle, next } = useMusicStore.getState();
  return (
    <>
      <Button
        icon={<RiSkipBackLine />}
        label={_('Previous Track')}
        onClick={() => previous(appService)}
      />
      <Button
        icon={playing ? <RiPauseLine /> : <RiPlayLine />}
        label={playing ? _('Pause') : _('Play')}
        onClick={() => toggle(appService)}
      />
      <Button
        icon={<RiSkipForwardLine />}
        label={_('Next Track')}
        onClick={() => next(appService)}
      />
    </>
  );
};

interface SongProps {
  onOpen: () => void;
  className?: string;
}

const Song: React.FC<SongProps> = ({ onOpen, className }) => {
  const _ = useTranslation();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  return (
    <button
      type='button'
      className={clsx('min-w-0 truncate text-sm', className)}
      title={_('Now Playing')}
      onClick={onOpen}
    >
      {track ? track.title : _('Not Playing')}
      {track && (
        <span className='text-base-content/60'> · {track.artist || _('Unknown Artist')}</span>
      )}
    </button>
  );
};

const Favorite: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const favorite = useMusicStore((state) => !!track && state.library.favorites.includes(track.id));
  if (!appService || !track) return null;

  return (
    <Button
      icon={favorite ? <RiHeartFill className='text-red-500' /> : <RiHeartLine />}
      label={favorite ? _('Remove from Favorites') : _('Add to Favorites')}
      onClick={() => useMusicStore.getState().toggleFavorite(appService, track)}
    />
  );
};

/** How long the volume slider stays once the pointer has left it, or a finger has lifted. */
const VOLUME_LINGER_MS = 1200;

/**
 * The music's volume: the button opens a slider standing above it, made of the
 * footer's own slider and colours, with the level and a mute button. It goes
 * away by itself a moment after the pointer leaves it, and at once on a tap
 * elsewhere. The wheel over it turns the volume too.
 */
const Volume: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const volume = useMusicStore((state) => state.volume);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What unmuting goes back to.
  const before = useRef(volume > 0 ? volume : 1);

  const stay = () => {
    if (hide.current) clearTimeout(hide.current);
  };
  const leave = () => {
    stay();
    hide.current = setTimeout(() => setOpen(false), VOLUME_LINGER_MS);
  };

  useEffect(
    () => () => {
      if (hide.current) clearTimeout(hide.current);
    },
    [],
  );

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
  const Icon = volume === 0 ? RiVolumeMuteLine : volume < 0.5 ? RiVolumeDownLine : RiVolumeUpLine;
  const muteLabel = volume === 0 ? _('Unmute') : _('Mute');

  return (
    <span
      ref={box}
      className='relative flex'
      onPointerEnter={stay}
      onPointerLeave={leave}
      onWheel={(event) => change(volume - Math.sign(event.deltaY) * 0.05)}
    >
      <Button icon={<Icon />} label={_('Volume')} onClick={() => setOpen(!open)} />
      {open && (
        <span
          dir='ltr'
          className={clsx(
            'eink-bordered absolute bottom-full left-1/2 z-10 mb-2 flex w-10 -translate-x-1/2',
            'flex-col items-center gap-1 rounded-full border py-2.5',
            'not-eink:bg-base-100 not-eink:border-base-300/50 not-eink:shadow-xs',
          )}
        >
          <span className='text-base-content/70 text-xs tabular-nums'>
            {Math.round(volume * 100)}
          </span>
          <span className='relative h-28 w-full'>
            <input
              type='range'
              className='text-base-content absolute left-1/2 top-1/2 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-90'
              min={0}
              max={1}
              step={0.01}
              value={volume}
              aria-label={_('Volume')}
              aria-orientation='vertical'
              onChange={(event) => change(Number(event.target.value))}
            />
          </span>
          <Button
            icon={<Icon />}
            label={muteLabel}
            onClick={() => change(volume === 0 ? before.current : 0)}
          />
        </span>
      )}
    </span>
  );
};

interface DesktopMusicBarProps {
  forceMobileLayout: boolean;
  gridInsets: Insets;
}

/** In place of Readest's desktop footer: the music button keeps its place in the row. */
export const DesktopMusicBar: React.FC<DesktopMusicBarProps> = ({
  forceMobileLayout,
  gridInsets,
}) => {
  const _ = useTranslation();
  const { appService, openPlayer, player } = useMusicBar();
  const { positionMs, durationMs } = useMusicStore((state) => state.playback);
  const isMobile = window.innerWidth < 640 || window.innerHeight < 640;

  return (
    // Unlike Readest's row this one does not scroll: the volume's slider stands above it.
    <div
      className={clsx(
        'hidden h-8 w-full items-center gap-x-4 px-4',
        !forceMobileLayout && 'sm:flex',
      )}
      style={{ bottom: isMobile ? `${gridInsets.bottom * 0.33}px` : '0px' }}
    >
      <Transport />
      <Song onOpen={openPlayer} className='mx-2 max-w-[32%] shrink-0' />
      <span className='shrink-0 text-sm tabular-nums'>
        {formatDuration(positionMs)} / {formatDuration(durationMs)}
      </span>
      <input
        type='range'
        className='text-base-content mx-2 min-w-0 flex-1'
        min={0}
        max={Math.max(durationMs, 1)}
        value={Math.min(positionMs, durationMs)}
        disabled={durationMs === 0}
        aria-label={_('Playback Position')}
        onChange={(event) => {
          if (appService) useMusicStore.getState().seek(appService, Number(event.target.value));
        }}
      />
      <MusicButton />
      <Favorite />
      <Volume />
      {player}
    </div>
  );
};

interface MobileMusicBarProps {
  forceMobileLayout: boolean;
  gridInsets: Insets;
  insetStyle?: React.CSSProperties;
}

/** In place of Readest's mobile footer: the music button stays at the end of the row. */
export const MobileMusicBar: React.FC<MobileMusicBarProps> = ({
  forceMobileLayout,
  gridInsets,
  insetStyle,
}) => {
  const { appService, openPlayer, player } = useMusicBar();
  const isMobile = forceMobileLayout || window.innerWidth < 640 || window.innerHeight < 640;
  const navPadding = isMobile ? `${gridInsets.bottom * 0.33 + 16}px` : '0px';

  return (
    <div
      className={clsx(
        'not-eink:bg-base-200 eink:bg-base-100 z-30 mt-auto flex w-full items-center gap-4 px-8 py-4',
        'eink:border-base-content eink:border-t',
        !forceMobileLayout && 'sm:hidden',
      )}
      style={{
        paddingBottom: appService?.isAndroidApp
          ? `calc(env(safe-area-inset-bottom) + 16px)`
          : navPadding,
        ...insetStyle,
      }}
    >
      <Transport />
      <Song onOpen={openPlayer} className='flex-1 text-center' />
      <Volume />
      <MusicButton />
      {player}
    </div>
  );
};
