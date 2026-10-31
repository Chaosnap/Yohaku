import clsx from 'clsx';
import { IoPause, IoPlay, IoPlaySkipBack, IoPlaySkipForward } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDuration } from './library';
import { useMusicStore } from './store';

interface TransportProps {
  large?: boolean;
}

/** Previous track, play or pause, and next track. */
export const Transport: React.FC<TransportProps> = ({ large }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const playing = useMusicStore((state) => state.playback.playing);
  if (!appService) return null;

  const { toggle, next, previous } = useMusicStore.getState();
  const skipClass = clsx('btn btn-ghost btn-circle', !large && 'btn-sm');
  const playClass = clsx('btn btn-circle', large ? 'btn-primary btn-lg' : 'btn-ghost btn-sm');
  const skipSize = large ? 22 : 16;
  const playSize = large ? 28 : 18;
  const playLabel = playing ? _('Pause') : _('Play');
  return (
    <div className='flex items-center justify-center gap-2'>
      <button
        className={skipClass}
        aria-label={_('Previous Track')}
        title={_('Previous Track')}
        onClick={() => previous(appService)}
      >
        <IoPlaySkipBack size={skipSize} />
      </button>
      <button
        className={playClass}
        aria-label={playLabel}
        title={playLabel}
        onClick={() => toggle(appService)}
      >
        {playing ? <IoPause size={playSize} /> : <IoPlay size={playSize} />}
      </button>
      <button
        className={skipClass}
        aria-label={_('Next Track')}
        title={_('Next Track')}
        onClick={() => next(appService)}
      >
        <IoPlaySkipForward size={skipSize} />
      </button>
    </div>
  );
};

/** How far the song has played, with a slider to move through it. */
export const SeekBar: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { positionMs, durationMs } = useMusicStore((state) => state.playback);

  const seek = (ms: number) => {
    if (appService) useMusicStore.getState().seek(appService, ms);
  };

  return (
    <div className='w-full'>
      <input
        type='range'
        className='range range-xs w-full'
        min={0}
        max={Math.max(durationMs, 1)}
        value={Math.min(positionMs, durationMs)}
        disabled={durationMs === 0}
        aria-label={_('Playback Position')}
        onChange={(event) => seek(Number(event.target.value))}
      />
      <div className='text-base-content/60 flex justify-between text-xs tabular-nums'>
        <span>{formatDuration(positionMs)}</span>
        <span>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );
};
