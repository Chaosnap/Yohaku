import { useEffect } from 'react';
import { IoMusicalNotesOutline } from 'react-icons/io5';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import { loadShortcuts, type ShortcutAction } from '@/helpers/shortcuts';
import Dropdown from '@/components/Dropdown';
import Menu from '@/components/Menu';
import AmbientPanel from '@/yohaku/ambient/AmbientPanel';
import Cover from './Cover';
import { SeekBar, Transport } from './Controls';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

interface MiniPlayerProps {
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

/** What plays, its controls and the ambient scenes, in the reader's music menu. */
const MiniPlayer: React.FC<MiniPlayerProps> = ({ setIsDropdownOpen }) => {
  const _ = useTranslation();
  const appService = usePlayback();
  const track = useMusicStore((state) => state.queue[state.playback.index]);

  // A book in a window of its own: the library window may have started other music since.
  useEffect(() => {
    if (appService) useMusicStore.getState().reload(appService);
  }, [appService]);

  const shortcuts = loadShortcuts();
  const keyOf = (action: ShortcutAction) => shortcuts[action].keys[0]?.toUpperCase() ?? '';
  const hints = [
    { key: keyOf('onMusicPlayPause'), label: _('Play / Pause') },
    { key: keyOf('onMusicPrevious'), label: _('Previous Track') },
    { key: keyOf('onMusicNext'), label: _('Next Track') },
  ];

  return (
    <Menu
      className='dropdown-content no-triangle bgcolor-base-200 z-20 mt-1.5 w-72 border p-4 shadow-2xl'
      onCancel={() => setIsDropdownOpen?.(false)}
    >
      <div className='flex items-center gap-3'>
        <Cover path={track?.cover} title={track?.title ?? ''} className='w-12 shrink-0 rounded' />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{track?.title ?? _('Not Playing')}</p>
          <p className='text-base-content/60 truncate text-xs'>{track?.artist}</p>
        </div>
      </div>
      <div className='mt-3'>
        <SeekBar />
      </div>
      <Transport />
      <div className='mt-4'>
        <AmbientPanel scenesOnly />
      </div>
      {!appService?.isMobile && (
        <div className='text-base-content/60 mt-4 flex justify-between gap-2 text-xs'>
          {hints.map(({ key, label }) => (
            <span key={label} className='flex items-center gap-1'>
              <kbd className='kbd kbd-xs'>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      )}
    </Menu>
  );
};

interface MusicTogglerProps {
  onToggle?: (isOpen: boolean) => void;
}

/** The reader's music button, so music is at hand while reading. */
const MusicToggler: React.FC<MusicTogglerProps> = ({ onToggle }) => {
  const _ = useTranslation();
  const iconSize18 = useResponsiveSize(18);
  return (
    <Dropdown
      label={_('Music')}
      containerClassName='h-8'
      className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
      buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0 mt-0'
      toggleButton={<IoMusicalNotesOutline size={iconSize18} />}
      onToggle={onToggle}
    >
      <MiniPlayer />
    </Dropdown>
  );
};

export default MusicToggler;
