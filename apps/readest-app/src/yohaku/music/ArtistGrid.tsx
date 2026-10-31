import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import type { Artist } from './library';

interface ArtistGridProps {
  artists: Artist[];
  onOpen: (artist: Artist) => void;
}

/** Artists in a grid, each with a round cover from one of their albums. */
const ArtistGrid: React.FC<ArtistGridProps> = ({ artists, onOpen }) => {
  const _ = useTranslation();
  return (
    <div
      className='grid gap-x-4 gap-y-6'
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
    >
      {artists.map((artist) => (
        <button
          key={artist.name}
          className='flex min-w-0 flex-col items-center text-center'
          onClick={() => onOpen(artist)}
        >
          <Cover
            path={artist.cover}
            title={artist.name}
            className='not-eink:shadow-md eink-bordered w-full rounded-full'
          />
          <span className='mt-2 w-full truncate text-sm font-medium'>
            {artist.name || _('Unknown Artist')}
          </span>
          <span className='text-base-content/60 text-xs'>
            {_('{{count}} Song(s)', { count: artist.tracks.length })}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ArtistGrid;
