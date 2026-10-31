import { useEffect } from 'react';
import { useEnv } from '@/context/EnvContext';
import { isMainWindow } from '@/yohaku/audio/windows';
import { isYohakuBuild } from '@/yohaku/build';
import { useMusicStore } from './store';
import { loadMusic } from './usePlayback';

/** Yohaku settles in before the folders are read. */
const STARTUP_DELAY_MS = 4000;

let started = false;

/**
 * Once a launch, a few seconds in, the music library reads its synced folders
 * again, so songs added or deleted while Yohaku was closed come and go without
 * pressing Sync. On the desktop the library window does it for every window.
 */
export const useMusicStartupSync = () => {
  const { appService } = useEnv();

  useEffect(() => {
    if (!appService || !isYohakuBuild() || started) return;
    if (appService.hasWindow && !isMainWindow()) return;
    const timer = setTimeout(async () => {
      started = true;
      await loadMusic(appService);
      await useMusicStore.getState().syncAtStartup(appService);
    }, STARTUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [appService]);
};
