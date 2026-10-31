import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { IoFileTray } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/store/themeStore';
import { getMenuPosition } from '@/app/library/components/ImportMenuPopup';
import Menu from '@/components/Menu';
import MenuItem from '@/components/MenuItem';
import { Overlay } from '@/components/Overlay';
import { useMusicStore } from './store';

const VIEWPORT_PADDING = 8;

interface MusicImportMenuProps {
  menuClassName?: string;
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

/**
 * The music library's two ways in, named and laid out as the book library's
 * import menu (ImportMenu): songs picked one by one, which on Android opens the
 * system's file manager, or a folder, which is then kept in sync.
 */
const MusicImportMenu: React.FC<MusicImportMenuProps> = ({ menuClassName, setIsDropdownOpen }) => {
  const _ = useTranslation();
  const { appService } = useEnv();

  const run = (action: 'importFiles' | 'addFolder') => {
    setIsDropdownOpen?.(false);
    if (appService) useMusicStore.getState()[action](appService);
  };

  return (
    <Menu
      className={clsx(
        'dropdown-content bg-base-100 rounded-box relative! z-[1] mt-3 p-2 shadow-sm',
        menuClassName,
      )}
      onCancel={() => setIsDropdownOpen?.(false)}
    >
      <MenuItem
        label={_('From Local File')}
        Icon={<IoFileTray className='h-5 w-5' />}
        onClick={() => run('importFiles')}
      />
      <MenuItem
        label={_('From Directory')}
        Icon={<IoFileTray className='h-5 w-5' />}
        onClick={() => run('addFolder')}
      />
    </Menu>
  );
};

interface MusicImportPopupProps {
  anchor: HTMLElement;
  onClose: () => void;
}

/** The menu by the button that opened it, as the book library's ImportMenuPopup places it. */
const MusicImportPopup: React.FC<MusicImportPopupProps> = ({ anchor, onClose }) => {
  const { safeAreaInsets: insets } = useThemeStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const { width, height } = menuRef.current.getBoundingClientRect();
    setPosition(
      getMenuPosition(
        anchor.getBoundingClientRect(),
        { width, height },
        {
          left: VIEWPORT_PADDING + (insets?.left ?? 0),
          top: VIEWPORT_PADDING + (insets?.top ?? 0),
          right: window.innerWidth - VIEWPORT_PADDING - (insets?.right ?? 0),
          bottom: window.innerHeight - VIEWPORT_PADDING - (insets?.bottom ?? 0),
        },
      ),
    );
  }, [anchor, insets]);

  return (
    <>
      <Overlay onDismiss={onClose} className='z-50' />
      <div
        ref={menuRef}
        className={clsx('fixed z-50 w-max', !position && 'invisible')}
        style={{ left: position?.left ?? 0, top: position?.top ?? 0 }}
      >
        <MusicImportMenu
          menuClassName='no-triangle mt-0!'
          setIsDropdownOpen={(open) => !open && onClose()}
        />
      </div>
    </>
  );
};

/** The empty music library's button, as the empty book library's: it opens the menu. */
export const ImportMusicButton: React.FC = () => {
  const _ = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        type='button'
        aria-haspopup='menu'
        className='btn btn-primary h-11 min-h-11 w-full max-w-xs rounded-lg'
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {_('Import Music')}
      </button>
      {anchor && <MusicImportPopup anchor={anchor} onClose={() => setAnchor(null)} />}
    </>
  );
};

export default MusicImportMenu;
