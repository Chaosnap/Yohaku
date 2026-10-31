import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Insets } from '@/types/misc';
import { useReaderStore } from '@/store/readerStore';
import { useThemeStore } from '@/store/themeStore';
import { isForcedMobileLayout } from '@/app/reader/utils/mobileLayout';
import { getTTSMiniPlayerBottomOffset } from '@/app/reader/utils/ttsMiniPlayerPosition';
import MusicCard from './MusicCard';
import PlayerSheet from './PlayerSheet';
import { useMusicStore } from './store';
import { usePlayback } from './usePlayback';

/** How long the player stays out after anything is done with it, playing or paused. */
const LINGER_MS = 5000;

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
  const playing = useMusicStore((state) => state.playback.playing);
  const [showPlayer, setShowPlayer] = useState(false);
  const [awake, setAwake] = useState(false);
  const sleep = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Under the pointer the player stays where it is: the footer it sat on hides as
  // the pointer leaves it.
  const [heldBottom, setHeldBottom] = useState<number | null>(null);
  const mounted = open && !showPlayer;
  const barVisible = hoveredBookKey === bookKey;
  // Out while the reader's bars are, and for a few seconds after anything is done with it.
  // An action panel of the mobile footer is open where the player would be.
  const visible = (barVisible || awake) && !(barVisible && bottomBarTab);

  const wake = useCallback(() => {
    setAwake(true);
    if (sleep.current) clearTimeout(sleep.current);
    sleep.current = setTimeout(() => setAwake(false), LINGER_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (sleep.current) clearTimeout(sleep.current);
    };
  }, []);

  // Out when it opens, the song changes, it plays or pauses, or the reader's bars go away.
  useEffect(() => {
    if (mounted) wake();
  }, [mounted, trackId, playing, barVisible, wake]);

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
            'absolute inset-x-4 z-40 sm:inset-x-0 sm:mx-auto sm:w-full sm:max-w-lg',
            'transition-[bottom,opacity,translate,scale] duration-500',
            'ease-[cubic-bezier(0.22,1,0.36,1)]',
            visible
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-4 scale-[0.97] opacity-0',
          )}
          style={{ bottom: `${bottom}px`, marginBottom: `${safeAreaMargin}px` }}
          onMouseEnter={() => setHeldBottom(bottom)}
          onMouseLeave={() => setHeldBottom(null)}
          onPointerMove={wake}
          onPointerDown={wake}
          onFocus={wake}
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
 * footer's music button or by music starting, and put away again a few
 * seconds after. With books side by side it is in the first one.
 */
const ReaderMusicBar: React.FC<ReaderMusicBarProps> = ({ bookKey, gridInsets }) => {
  const first = useReaderStore((state) => state.bookKeys[0] === bookKey);
  return first ? <MusicBar bookKey={bookKey} gridInsets={gridInsets} /> : null;
};

export default ReaderMusicBar;
