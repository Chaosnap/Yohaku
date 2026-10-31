import { useEffect, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { loadShortcuts, type ShortcutAction } from '@/helpers/shortcuts';
import Dialog from '@/components/Dialog';
import AmbientPanel from '@/yohaku/ambient/AmbientPanel';
import Cover from './Cover';
import { SeekBar, Transport } from './Controls';
import { formatDuration } from './library';
import { useMusicStore } from './store';

const SLEEP_MINUTES = [0, 15, 30, 45, 60, 90];

/** Stops the music after a while, fading it out. */
const SleepTimer: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const minutes = useMusicStore((state) => state.sleepMinutes);
  const endsAt = useMusicStore((state) => state.sleepEndsAt);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!endsAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const left = endsAt ? endsAt - now : 0;
  const label = left > 0 ? `${_('Sleep Timer')} · ${formatDuration(left)}` : _('Sleep Timer');
  const choose = (value: number) => {
    if (appService) useMusicStore.getState().setSleepTimer(appService, value);
  };

  return (
    <label className='flex w-full items-center justify-between gap-3 text-sm'>
      <span className='tabular-nums'>{label}</span>
      <select
        className='select select-bordered select-sm'
        value={left > 0 ? minutes : 0}
        onChange={(event) => choose(Number(event.target.value))}
      >
        {SLEEP_MINUTES.map((option) => (
          <option key={option} value={option}>
            {option === 0 ? _('Off') : _('{{minutes}} min', { minutes: option })}
          </option>
        ))}
      </select>
    </label>
  );
};

/** The reader's music shortcuts. */
const ShortcutHints: React.FC = () => {
  const _ = useTranslation();
  const shortcuts = loadShortcuts();
  const keyOf = (action: ShortcutAction) => shortcuts[action].keys[0]?.toUpperCase() ?? '';
  const hints = [
    { key: keyOf('onMusicPlayPause'), label: _('Play / Pause') },
    { key: keyOf('onMusicPrevious'), label: _('Previous Track') },
    { key: keyOf('onMusicNext'), label: _('Next Track') },
  ];

  return (
    <div className='text-base-content/60 flex w-full justify-between gap-2 text-xs'>
      {hints.map(({ key, label }) => (
        <span key={label} className='flex items-center gap-1'>
          <kbd className='kbd kbd-xs'>{key}</kbd>
          {label}
        </span>
      ))}
    </div>
  );
};

interface PlayerSheetProps {
  /** In the reader, where the music shortcuts work. */
  showShortcuts?: boolean;
  onClose: () => void;
}

/** The player: the cover, where the song is, the sleep timer and the ambient sounds. */
const PlayerSheet: React.FC<PlayerSheetProps> = ({ showShortcuts, onClose }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const details = [track?.artist, track?.album].filter(Boolean).join(' · ');

  return (
    <Dialog
      isOpen
      title={_('Now Playing')}
      onClose={onClose}
      snapHeight={appService?.isMobile ? 0.92 : undefined}
      boxClassName='sm:w-[440px]! sm:max-w-[440px]! sm:h-auto! sm:max-h-[90%]'
    >
      <div className='flex flex-col items-center gap-5 px-2 pb-6'>
        <Cover
          path={track?.cover}
          title={track?.title ?? ''}
          className='not-eink:shadow-xl eink-bordered w-56 rounded-xl sm:w-64'
        />
        <div className='w-full min-w-0 text-center'>
          <p className='truncate text-lg font-semibold'>{track?.title ?? _('Not Playing')}</p>
          <p className='text-base-content/60 truncate text-sm'>{details}</p>
        </div>
        <SeekBar />
        <Transport large />
        <SleepTimer />
        <AmbientPanel />
        {showShortcuts && <ShortcutHints />}
      </div>
    </Dialog>
  );
};

export default PlayerSheet;
