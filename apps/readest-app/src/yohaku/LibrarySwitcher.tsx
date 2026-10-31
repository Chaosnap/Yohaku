'use client';

import clsx from 'clsx';
import { IoLibraryOutline, IoMusicalNotesOutline } from 'react-icons/io5';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useTranslation } from '@/hooks/useTranslation';

interface LibrarySwitcherProps {
  current: 'books' | 'music';
}

/** Switches the start page between the book library and the music library. */
const LibrarySwitcher: React.FC<LibrarySwitcherProps> = ({ current }) => {
  const _ = useTranslation();
  const router = useAppRouter();
  const tabs = [
    { id: 'books', label: _('Books'), Icon: IoLibraryOutline, href: '/library' },
    { id: 'music', label: _('Music'), Icon: IoMusicalNotesOutline, href: '/music' },
  ] as const;

  return (
    <div
      role='tablist'
      aria-label={_('Library')}
      className='bg-base-300/45 me-2 flex h-9 shrink-0 items-center rounded-full p-0.5 sm:h-7'
    >
      {tabs.map(({ id, label, Icon, href }) => (
        <button
          key={id}
          role='tab'
          aria-selected={current === id}
          title={label}
          className={clsx(
            'flex h-full items-center gap-1.5 rounded-full px-3 text-sm',
            current === id
              ? 'bg-base-100 text-base-content shadow-sm'
              : 'text-base-content/60 hover:text-base-content',
          )}
          onClick={() => current !== id && router.push(href)}
        >
          <Icon className='h-4 w-4' />
          <span className='hidden sm:inline'>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default LibrarySwitcher;
