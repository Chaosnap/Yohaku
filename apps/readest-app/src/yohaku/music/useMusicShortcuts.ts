import { useEffect } from 'react';
import { useEnv } from '@/context/EnvContext';
import useShortcuts from '@/hooks/useShortcuts';
import { isYohakuBuild } from '@/yohaku/build';
import { useMusicStore } from './store';
import { loadMusic } from './usePlayback';

type Control = 'toggle' | 'next' | 'previous';

/** The music shortcuts in the reader: by default M plays or pauses, comma and period skip. */
export const useMusicShortcuts = () => {
  const { appService } = useEnv();

  useEffect(() => {
    if (appService && isYohakuBuild()) loadMusic(appService);
  }, [appService]);

  const control = (action: Control) => () => {
    if (appService) useMusicStore.getState()[action](appService);
  };
  const actions = {
    onMusicPlayPause: control('toggle'),
    onMusicNext: control('next'),
    onMusicPrevious: control('previous'),
  };
  useShortcuts(isYohakuBuild() ? actions : {}, [appService]);
};
