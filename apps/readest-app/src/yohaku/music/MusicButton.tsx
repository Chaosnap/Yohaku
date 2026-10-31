import clsx from 'clsx';
import { IoMusicalNotesOutline } from 'react-icons/io5';
import { useTranslation } from '@/hooks/useTranslation';
import Button from '@/components/Button';
import { useMusicStore } from './store';

/**
 * The reader footer's music button, where Readest has its read-aloud button:
 * it turns the footer into the music's controls (FooterMusicBar), and back.
 */
const MusicButton: React.FC = () => {
  const _ = useTranslation();
  const open = useMusicStore((state) => state.readerMusicBar);
  return (
    <Button
      label={_('Music')}
      icon={<IoMusicalNotesOutline className={clsx(open && 'text-blue-500')} />}
      onClick={() => useMusicStore.getState().setReaderMusicBar(!open)}
    />
  );
};

export default MusicButton;
