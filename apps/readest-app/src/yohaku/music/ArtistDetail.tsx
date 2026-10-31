import { IoChevronBack, IoPlay } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import AlbumGrid from './AlbumGrid';
import Cover from './Cover';
import SongList from './SongList';
import type { Album, Artist, MusicTrack } from './library';
import { useMusicStore } from './store';

interface ArtistDetailProps {
  artist: Artist;
  onBack: () => void;
  onOpenAlbum: (album: Album) => void;
  onShowAlbum: (album: Album) => void;
  onShowTrack: (track: MusicTrack) => void;
}

/** One artist: a button to play all their songs, their albums, then the songs themselves. */
const ArtistDetail: React.FC<ArtistDetailProps> = ({
  artist,
  onBack,
  onOpenAlbum,
  onShowAlbum,
  onShowTrack,
}) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { albums, tracks } = artist;
  const meta = [
    albums.length > 0 ? _('{{count}} Album(s)', { count: albums.length }) : '',
    _('{{count}} Song(s)', { count: tracks.length }),
  ]
    .filter(Boolean)
    .join(' · ');

  const play = () => {
    if (appService) useMusicStore.getState().play(appService, tracks, 0);
  };

  return (
    <div>
      <button className='btn btn-ghost btn-sm -ms-3 mb-3 gap-1 font-normal' onClick={onBack}>
        <IoChevronBack className='rtl:rotate-180' />
        {_('Artists')}
      </button>
      <div className='flex flex-col items-center gap-5 sm:flex-row sm:items-end'>
        <Cover
          path={artist.cover}
          title={artist.name}
          className='not-eink:shadow-lg eink-bordered w-40 shrink-0 rounded-full'
        />
        <div className='flex min-w-0 flex-col items-center sm:items-start'>
          <h2 className='text-center text-xl font-semibold sm:text-start'>
            {artist.name || _('Unknown Artist')}
          </h2>
          <p className='text-base-content/50 mt-1 text-xs'>{meta}</p>
          <button className='btn btn-primary btn-sm mt-4 gap-1' onClick={play}>
            <IoPlay />
            {_('Play')}
          </button>
        </div>
      </div>
      {albums.length > 0 && (
        <section className='mt-8'>
          <h3 className='text-base-content/60 mb-3 text-xs font-semibold uppercase tracking-wider'>
            {_('Albums')}
          </h3>
          <AlbumGrid albums={albums} onOpen={onOpenAlbum} onShowDetails={onShowAlbum} />
        </section>
      )}
      <section className='mt-8'>
        <h3 className='text-base-content/60 mb-2 text-xs font-semibold uppercase tracking-wider'>
          {_('Songs')}
        </h3>
        <SongList tracks={tracks} onShowDetails={onShowTrack} />
      </section>
    </div>
  );
};

export default ArtistDetail;
