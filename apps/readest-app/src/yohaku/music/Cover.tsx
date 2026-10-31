import clsx from 'clsx';
import { convertFileSrc } from '@tauri-apps/api/core';
import { IoMusicalNotes } from 'react-icons/io5';

interface CoverProps {
  path?: string;
  title: string;
  className?: string;
}

/** An album cover from the cache, or a quiet placeholder when there is none. */
const Cover: React.FC<CoverProps> = ({ path, title, className }) => (
  <div className={clsx('bg-base-300 relative aspect-square overflow-hidden', className)}>
    {path ? (
      <img
        src={convertFileSrc(path)}
        alt={title}
        loading='lazy'
        decoding='async'
        className='h-full w-full object-cover'
      />
    ) : (
      <div className='text-base-content/30 flex h-full w-full items-center justify-center'>
        <IoMusicalNotes className='h-1/3 w-1/3' />
      </div>
    )}
  </div>
);

export default Cover;
