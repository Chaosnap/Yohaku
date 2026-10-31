import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/store/themeStore';
import Cover from './Cover';
import { Transport } from './Controls';
import { useMusicStore } from './store';

interface NowPlayingBarProps {
  onOpen: () => void;
}

/** What plays, at the foot of the music library; it opens the player. */
const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ onOpen }) => {
  const _ = useTranslation();
  const insets = useThemeStore((state) => state.safeAreaInsets);
  const track = useMusicStore((state) => state.queue[state.playback.index]);
  const { positionMs, durationMs } = useMusicStore((state) => state.playback);
  if (!track) return null;

  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  return (
    <div
      className='bg-base-100 border-base-300 eink-bordered relative shrink-0 border-t'
      style={{ paddingBottom: insets?.bottom ?? 0 }}
    >
      <div className='bg-primary absolute start-0 top-0 h-0.5' style={{ width: `${progress}%` }} />
      <div className='flex items-center gap-3 px-4 py-2'>
        <button
          className='flex min-w-0 flex-1 items-center gap-3 text-start'
          title={_('Now Playing')}
          onClick={onOpen}
        >
          <Cover path={track.cover} title={track.title} className='w-10 shrink-0 rounded' />
          <span className='min-w-0'>
            <span className='block truncate text-sm font-medium'>{track.title}</span>
            <span className='text-base-content/60 block truncate text-xs'>
              {track.artist || _('Unknown Artist')}
            </span>
          </span>
        </button>
        <Transport />
      </div>
    </div>
  );
};

export default NowPlayingBar;
