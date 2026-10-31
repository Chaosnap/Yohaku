import { IoChevronBack, IoPlay } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import Cover from './Cover';
import SongList from './SongList';
import { formatDuration, type Album } from './library';
import { useMusicStore } from './store';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

/** One album: its cover, a button to play it, and its songs in order. */
const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const duration = album.tracks.reduce((total, track) => total + track.durationMs, 0);
  const count = _('{{count}} Song(s)', { count: album.tracks.length });
  const meta = duration > 0 ? `${count} · ${formatDuration(duration)}` : count;

  const play = () => {
    if (appService) useMusicStore.getState().play(appService, album.tracks, 0);
  };

  return (
    <div>
      <button className='btn btn-ghost btn-sm -ms-3 mb-3 gap-1 font-normal' onClick={onBack}>
        <IoChevronBack className='rtl:rotate-180' />
        {_('Albums')}
      </button>
      <div className='flex flex-col items-center gap-5 sm:flex-row sm:items-end'>
        <Cover
          path={album.cover}
          title={album.title}
          className='not-eink:shadow-lg eink-bordered w-48 shrink-0 rounded-lg'
        />
        <div className='flex min-w-0 flex-col items-center sm:items-start'>
          <h2 className='text-center text-xl font-semibold sm:text-start'>{album.title}</h2>
          <p className='text-base-content/70 mt-1'>{album.artist || _('Unknown Artist')}</p>
          <p className='text-base-content/50 mt-1 text-xs'>{meta}</p>
          <button className='btn btn-primary btn-sm mt-4 gap-1' onClick={play}>
            <IoPlay />
            {_('Play')}
          </button>
        </div>
      </div>
      <div className='mt-6'>
        <SongList tracks={album.tracks} numbered />
      </div>
    </div>
  );
};

export default AlbumDetail;
