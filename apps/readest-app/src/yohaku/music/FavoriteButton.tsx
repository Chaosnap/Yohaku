import clsx from 'clsx';
import { IoHeart, IoHeartOutline } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { MusicTrack } from './library';
import { useMusicStore } from './store';

interface FavoriteButtonProps {
  track: MusicTrack | undefined;
  size: number;
  className?: string;
}

/** A heart that keeps the song among the favorites, or takes it out again. */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({ track, size, className }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const favorite = useMusicStore((state) => !!track && state.library.favorites.includes(track.id));
  if (!appService || !track) return null;

  const label = favorite ? _('Remove from Favorites') : _('Add to Favorites');
  return (
    <button
      type='button'
      className={clsx('shrink-0 rounded-full p-1', className)}
      aria-label={label}
      aria-pressed={favorite}
      title={label}
      onClick={(event) => {
        // A song row plays when clicked; its heart only marks it.
        event.stopPropagation();
        useMusicStore.getState().toggleFavorite(appService, track);
      }}
    >
      {favorite ? <IoHeart size={size} className='text-red-500' /> : <IoHeartOutline size={size} />}
    </button>
  );
};

export default FavoriteButton;
