import { LiaInfoCircleSolid } from 'react-icons/lia';
import { PiPlus } from 'react-icons/pi';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import type { Album } from './library';

interface AlbumGridProps {
  albums: Album[];
  onOpen: (album: Album) => void;
  onShowDetails: (album: Album) => void;
  /** A last tile that imports songs, as the book library's last tile imports books. */
  onAdd?: () => void;
}

/** Album covers in a grid, as the book library shows its books. */
const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, onOpen, onShowDetails, onAdd }) => {
  const _ = useTranslation();
  const iconSize16 = useResponsiveSize(16);
  return (
    <div
      className='grid gap-x-4 gap-y-6'
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
    >
      {albums.map((album) => (
        <div key={album.key} className='relative min-w-0'>
          <button className='flex w-full min-w-0 flex-col text-start' onClick={() => onOpen(album)}>
            <Cover
              path={album.cover}
              title={album.title}
              className='not-eink:shadow-md eink-bordered w-full rounded-md'
            />
            <span className='mt-2 w-full truncate pe-6 text-sm font-medium'>{album.title}</span>
            <span className='text-base-content/60 w-full truncate pe-6 text-xs'>
              {album.artist || _('Unknown Artist')}
            </span>
          </button>
          <button
            className='text-base-content/50 hover:text-base-content absolute bottom-0 end-0 p-1'
            aria-label={_('Show Details')}
            title={_('Show Details')}
            onClick={() => onShowDetails(album)}
          >
            <LiaInfoCircleSolid size={iconSize16} />
          </button>
        </div>
      ))}
      {onAdd && (
        <button
          className='eink-bordered bg-base-100/50 hover:bg-base-300/50 flex aspect-square w-full items-center justify-center rounded-md'
          aria-label={_('Import Files')}
          title={_('Import Files')}
          onClick={onAdd}
        >
          <PiPlus aria-hidden className='text-base-content/60 size-10' />
        </button>
      )}
    </div>
  );
};

export default AlbumGrid;
