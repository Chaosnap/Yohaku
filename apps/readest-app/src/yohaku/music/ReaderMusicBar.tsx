import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { Insets } from '@/types/misc';
import { useReaderStore } from '@/store/readerStore';
import { useThemeStore } from '@/store/themeStore';
import { useMiniPlayerAutoHide } from '@/app/reader/components/tts/useMiniPlayerAutoHide';
import { isForcedMobileLayout } from '@/app/reader/utils/mobileLayout';
import { getTTSMiniPlayerBottomOffset } from '@/app/reader/utils/ttsMiniPlayerPosition';
import MusicCard from './MusicCard';
import PlayerSheet from './PlayerSheet';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

/** How long a new song shows the player, with the reader's bars away. */
const NEW_SONG_MS = 4000;

interface ReaderMusicBarProps {
  bookKey: string;
  gridInsets: Insets;
}

const MusicBar: React.FC<ReaderMusicBarProps> = ({ bookKey, gridInsets }) => {
  const appService = usePlayback();
  const isIPhoneDuo = useThemeStore((state) => state.isIPhoneDuo);
  const { hoveredBookKey, bottomBarTab, getViewSettings } = useReaderStore();
  const open = useMusicStore((state) => state.miniPlayerOpen);
  const trackId = useMusicStore((state) => state.queue[state.playback.index]?.id);
  const [showPlayer, setShowPlayer] = useState(false);
  const [newSong, setNewSong] = useState(false);
  const lastTrackId = useRef(trackId);
  // Under the pointer the player stays out, and where it is: the footer it sat on
  // hides as the pointer leaves it.
  const [heldBottom, setHeldBottom] = useState<number | null>(null);
  const mounted = open && !showPlayer;
  // Like the read-aloud player: out while the reader's bars are, then a few seconds more.
  const autoShown = useMiniPlayerAutoHide(bookKey, 'full', mounted);
  const shown = autoShown || heldBottom !== null || newSong;
  const barVisible = hoveredBookKey === bookKey;
  // An action panel of the mobile footer is open where the player would be.
  const visible = shown && !(barVisible && bottomBarTab);

  // A new song comes out for a moment, then hides again.
  useEffect(() => {
    if (trackId === lastTrackId.current) return;
    lastTrackId.current = trackId;
    if (!trackId) return;
    setNewSong(true);
    const timer = setTimeout(() => setNewSong(false), NEW_SONG_MS);
    return () => clearTimeout(timer);
  }, [trackId]);

  // A player put away under the pointer never hears it leave.
  useEffect(() => {
    if (!mounted) setHeldBottom(null);
  }, [mounted]);

  // A book in a window of its own: the library window may have started other music since.
  useEffect(() => {
    if (appService && mounted && visible) useMusicStore.getState().reload(appService);
  }, [appService, mounted, visible]);

  if (!appService) return null;
  const viewSettings = getViewSettings(bookKey);
  const safeAreaMargin = appService.hasSafeAreaInset ? gridInsets.bottom * 0.33 : 0;
  const usesMobileBar =
    isForcedMobileLayout(appService.isMobile, isIPhoneDuo) ||
    window.innerWidth < 640 ||
    window.innerHeight < 640;
  const offset = viewSettings
    ? getTTSMiniPlayerBottomOffset(viewSettings, { barVisible, usesMobileBar })
    : 16;
  // Yohaku shows no read-aloud player down here (it is in the header), so nothing to stack on.
  const bottom = heldBottom ?? offset;

  return (
    <>
      {mounted && (
        <div
          className={clsx(
            'absolute inset-x-4 z-40 sm:inset-x-0 sm:mx-auto sm:w-full sm:max-w-md',
            'transition-[bottom,opacity,transform] duration-300 ease-out',
            visible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0',
          )}
          style={{ bottom: `${bottom}px`, marginBottom: `${safeAreaMargin}px` }}
          onMouseEnter={() => setHeldBottom(bottom)}
          onMouseLeave={() => setHeldBottom(null)}
        >
          <MusicCard onExpand={() => setShowPlayer(true)} />
        </div>
      )}
      {showPlayer && (
        <PlayerSheet showShortcuts={!appService.isMobile} onClose={() => setShowPlayer(false)} />
      )}
    </>
  );
};

/**
 * The music player of the reader, above the footer, brought out by the
 * footer's music button or by music starting. With books side by side it is
 * in the first one.
 */
const ReaderMusicBar: React.FC<ReaderMusicBarProps> = ({ bookKey, gridInsets }) => {
  const first = useReaderStore((state) => state.bookKeys[0] === bookKey);
  return first ? <MusicBar bookKey={bookKey} gridInsets={gridInsets} /> : null;
};

export default ReaderMusicBar;
