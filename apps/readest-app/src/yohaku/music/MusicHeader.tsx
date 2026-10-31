import clsx from 'clsx';
import { useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { IoDocumentsOutline, IoFolderOpenOutline } from 'react-icons/io5';
import { MdSync } from 'react-icons/md';
import { PiPlus } from 'react-icons/pi';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTrafficLight } from '@/hooks/useTrafficLight';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/store/themeStore';
import Dropdown from '@/components/Dropdown';
import Menu from '@/components/Menu';
import MenuItem from '@/components/MenuItem';
import WindowButtons from '@/components/WindowButtons';
import LibrarySwitcher from '@/yohaku/LibrarySwitcher';
import { useMusicStore } from './store';

interface AddMusicMenuProps {
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

/** The music library's two ways in: a folder kept in sync, or files one by one. */
const AddMusicMenu: React.FC<AddMusicMenuProps> = ({ setIsDropdownOpen }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { addFolder, importFiles } = useMusicStore.getState();
  const close = () => setIsDropdownOpen?.(false);

  return (
    <Menu className='dropdown-content no-triangle z-20 mt-2 shadow-2xl' onCancel={close}>
      <MenuItem
        label={_('Sync a Folder')}
        description={_('Every song in it, kept up to date')}
        Icon={<IoFolderOpenOutline className='h-5 w-5' />}
        onClick={() => {
          close();
          if (appService) addFolder(appService);
        }}
      />
      <MenuItem
        label={_('Import Files')}
        description={_('Songs one by one')}
        Icon={<IoDocumentsOutline className='h-5 w-5' />}
        onClick={() => {
          close();
          if (appService) importFiles(appService);
        }}
      />
    </Menu>
  );
};

interface MusicHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/** The music library's title bar, laid out as the book library's. */
const MusicHeader: React.FC<MusicHeaderProps> = ({ query, onQueryChange }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { safeAreaInsets: insets, systemUIVisible, statusBarHeight } = useThemeStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const { isTrafficLightVisible } = useTrafficLight(headerRef);
  const iconSize18 = useResponsiveSize(18);
  const syncing = useMusicStore((state) => state.syncing);
  const library = useMusicStore((state) => state.library);

  const sources = library.folders.length + library.files.length;
  const windowButtonVisible = appService?.hasWindowBar && !isTrafficLightVisible;
  const sync = () => {
    if (appService) useMusicStore.getState().sync(appService);
  };

  return (
    <div
      ref={headerRef}
      className={clsx(
        'titlebar z-10 flex h-[52px] w-full shrink-0 items-center py-2 pr-4 sm:h-[44px]',
        windowButtonVisible ? 'sm:pr-4' : 'sm:pr-6',
        isTrafficLightVisible ? 'pl-16' : 'pl-0 sm:pl-2',
      )}
      style={{
        marginTop: appService?.hasSafeAreaInset
          ? `max(${insets?.top ?? 0}px, ${systemUIVisible ? statusBarHeight : 0}px)`
          : '0px',
      }}
    >
      <div className='exclude-title-bar-mousedown flex w-full min-w-0 items-center gap-2 ps-4'>
        <LibrarySwitcher current='music' />
        <div className='relative flex h-9 min-w-0 flex-1 items-center sm:h-7'>
          <FaSearch className='text-base-content/55 absolute start-3 size-3.5' />
          <input
            type='text'
            value={query}
            placeholder={_('Search Music...')}
            spellCheck='false'
            className={clsx(
              'search-input input h-9 w-full rounded-full ps-9 sm:h-7',
              'bg-base-300/45 border-0 font-sans text-sm font-light',
              'placeholder:text-base-content/50 truncate focus:outline-hidden focus:ring-0',
            )}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <Dropdown
          label={_('Add Music')}
          className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
          buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
          toggleButton={<PiPlus role='none' size={iconSize18} />}
        >
          <AddMusicMenu />
        </Dropdown>
        <button
          className='btn btn-ghost h-8 min-h-8 w-8 p-0'
          aria-label={_('Sync Now')}
          title={_('Sync Now')}
          disabled={syncing || sources === 0}
          onClick={sync}
        >
          <MdSync size={iconSize18} className={clsx(syncing && 'animate-spin')} />
        </button>
      </div>
      {appService?.hasWindowBar && (
        <WindowButtons
          headerRef={headerRef}
          showMinimize={windowButtonVisible}
          showMaximize={windowButtonVisible}
          showClose={windowButtonVisible}
        />
      )}
    </div>
  );
};

export default MusicHeader;
