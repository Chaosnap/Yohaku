import type { EnvConfigType } from '@/services/environment';
import type { SystemSettings } from '@/types/settings';
import { useSettingsStore } from '@/store/settingsStore';
import type { AmbientLayer, AudioFile } from '@/yohaku/audio/engine';

/** Settings only Yohaku has, kept in Readest's settings file under `yohaku`. */
export interface YohakuSettings {
  /** Comics that set no reading direction of their own open right to left. */
  comicsRightToLeft: boolean;
  /** The music player's tracks, in order. */
  musicTracks: AudioFile[];
  /** Up to three sounds looping beside the music. */
  ambientLayers: AmbientLayer[];
}

export const DEFAULT_YOHAKU_SETTINGS: YohakuSettings = {
  comicsRightToLeft: false,
  musicTracks: [],
  ambientLayers: [],
};

export const getYohakuSettings = (settings: SystemSettings | null | undefined): YohakuSettings => ({
  ...DEFAULT_YOHAKU_SETTINGS,
  ...settings?.yohaku,
});

export const saveYohakuSettings = async (
  envConfig: EnvConfigType,
  changes: Partial<YohakuSettings>,
) => {
  const { settings, setSettings, saveSettings } = useSettingsStore.getState();
  const next: SystemSettings = { ...settings, yohaku: { ...settings.yohaku, ...changes } };
  setSettings(next);
  await saveSettings(envConfig, next);
};
