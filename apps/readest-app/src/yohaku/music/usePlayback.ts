import { useEffect } from 'react';
import { useEnv } from '@/context/EnvContext';
import type { AppService } from '@/types/system';
import { useMusicStore } from './store';

/** Loads the music library. */
export const loadMusic = (appService: AppService) => useMusicStore.getState().load(appService);

/**
 * Loads the music library and keeps the playback state fresh while a player
 * is on screen: the engine is asked once a second.
 */
export const usePlayback = () => {
  const { appService } = useEnv();

  useEffect(() => {
    if (!appService) return;
    const { refresh } = useMusicStore.getState();
    loadMusic(appService);
    refresh(appService);
    const timer = setInterval(() => refresh(appService), 1000);
    return () => clearInterval(timer);
  }, [appService]);

  return appService;
};
