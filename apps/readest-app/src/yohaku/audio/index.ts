import type { AppService } from '@/types/system';
import { androidEngine } from './androidEngine';
import type { AudioEngine } from './engine';
import { getWebEngine } from './webEngine';
import { isMainWindow, remoteEngine } from './windows';

export const getAudioEngine = (appService: AppService): AudioEngine => {
  if (appService.isAndroidApp) return androidEngine;
  // On the desktop only the main window plays; the others control its player.
  return isMainWindow() ? getWebEngine() : remoteEngine;
};
