import clsx from 'clsx';
import { MdOutlineHeadphones, MdPlayArrow, MdStop } from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import { loadShortcuts } from '@/helpers/shortcuts';
import { useReaderStore } from '@/store/readerStore';
import { eventDispatcher } from '@/utils/event';
import Dropdown from '@/components/Dropdown';
import Menu from '@/components/Menu';
import AmbientPanel from '@/yohaku/ambient/AmbientPanel';

const useReadingAloud = (bookKey: string) =>
  useReaderStore((state) => !!state.viewStates[bookKey]?.ttsEnabled);

interface ReadAloudMenuProps {
  bookKey: string;
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

/** Reading aloud, with Yohaku's ambient sounds to listen to beside it or alone. */
const ReadAloudMenu: React.FC<ReadAloudMenuProps> = ({ bookKey, setIsDropdownOpen }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const reading = useReadingAloud(bookKey);
  const key = loadShortcuts().onToggleTTS.keys[0]?.toUpperCase();
  const label = reading ? _('Stop reading aloud') : _('Read Aloud');

  // Readest's read-aloud player takes over at the foot of the page.
  const toggle = () => {
    eventDispatcher.dispatch(reading ? 'tts-stop' : 'tts-speak', { bookKey });
    setIsDropdownOpen?.(false);
  };

  return (
    <Menu
      className='dropdown-content no-triangle bgcolor-base-200 z-20 mt-1.5 w-72 border p-4 shadow-2xl'
      onCancel={() => setIsDropdownOpen?.(false)}
    >
      <div className='flex items-center gap-3'>
        <div className='bg-base-300 flex size-12 shrink-0 items-center justify-center rounded-lg'>
          <MdOutlineHeadphones className={clsx('size-6', reading && 'text-blue-500')} />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{_('Read Aloud')}</p>
          <p className='text-base-content/60 truncate text-xs'>
            {reading ? _('Reading aloud') : _('From the current page')}
          </p>
        </div>
        <button className='btn btn-circle btn-sm' aria-label={label} title={label} onClick={toggle}>
          {reading ? <MdStop size={18} /> : <MdPlayArrow size={18} />}
        </button>
      </div>
      <div className='mt-4'>
        <AmbientPanel scenesOnly />
      </div>
      {!appService?.isMobile && key && (
        <div className='text-base-content/60 mt-4 flex items-center gap-1 text-xs'>
          <kbd className='kbd kbd-xs'>{key}</kbd>
          {_('Toggle Text to Speech')}
        </div>
      )}
    </Menu>
  );
};

interface ReadAloudTogglerProps {
  bookKey: string;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * The reader's read-aloud button, at the top right where Yohaku 1.0 had its
 * music button; the ambient sounds stay here. Music moved to the footer.
 */
const ReadAloudToggler: React.FC<ReadAloudTogglerProps> = ({ bookKey, onToggle }) => {
  const _ = useTranslation();
  const iconSize18 = useResponsiveSize(18);
  const reading = useReadingAloud(bookKey);
  return (
    <Dropdown
      label={_('Read Aloud')}
      containerClassName='h-8'
      className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
      buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0 mt-0'
      toggleButton={
        <MdOutlineHeadphones size={iconSize18} className={clsx(reading && 'text-blue-500')} />
      }
      onToggle={onToggle}
    >
      <ReadAloudMenu bookKey={bookKey} />
    </Dropdown>
  );
};

export default ReadAloudToggler;
