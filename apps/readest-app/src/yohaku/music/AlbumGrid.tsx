import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import type { Album } from './library';

interface AlbumGridProps {
  albums: Album[];
  onOpen: (album: Album) => void;
}

/** Album covers in a grid, as the book library shows its books. */
const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, onOpen }) => {
  const _ = useTranslation();
  return (
    <div
      className='grid gap-x-4 gap-y-6'
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
    >
      {albums.map((album) => (
        <button
          key={album.key}
          className='flex min-w-0 flex-col text-start'
          onClick={() => onOpen(album)}
        >
          <Cover
            path={album.cover}
            title={album.title}
            className='not-eink:shadow-md eink-bordered w-full rounded-md'
          />
          <span className='mt-2 truncate text-sm font-medium'>{album.title}</span>
          <span className='text-base-content/60 truncate text-xs'>
            {album.artist || _('Unknown Artist')}
          </span>
        </button>
      ))}
    </div>
  );
};

export default AlbumGrid;
