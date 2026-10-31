import { useEffect } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import type { AppService } from '@/types/system';
import { getYohakuSettings } from '@/yohaku/settings';
import { useMusicStore } from './store';

/** Loads the music library, with the ambient sounds chosen last time. */
export const loadMusic = (appService: AppService) => {
  const { settings } = useSettingsStore.getState();
  return useMusicStore.getState().load(appService, getYohakuSettings(settings).ambientLayers);
};

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
