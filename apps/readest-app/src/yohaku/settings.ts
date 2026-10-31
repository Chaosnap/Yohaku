import type { EnvConfigType } from '@/services/environment';
import type { SystemSettings } from '@/types/settings';
import { useSettingsStore } from '@/store/settingsStore';
import type { AmbientChoice } from '@/yohaku/ambient/sounds';
import { AMBIENT_SOUND_IDS } from '@/yohaku/ambient/synth';

/** Settings only Yohaku has, kept in Readest's settings file under `yohaku`. */
export interface YohakuSettings {
  /** Comics that set no reading direction of their own open right to left. */
  comicsRightToLeft: boolean;
  /** The ambient sounds playing beside the music, with their volumes. */
  ambientLayers: AmbientChoice[];
}

export const DEFAULT_YOHAKU_SETTINGS: YohakuSettings = {
  comicsRightToLeft: false,
  ambientLayers: [],
};

export const getYohakuSettings = (settings: SystemSettings | null | undefined): YohakuSettings => {
  const yohaku = { ...DEFAULT_YOHAKU_SETTINGS, ...settings?.yohaku };
  // Before 1.0 the ambient sounds were the user's own files; only Yohaku's own sounds remain.
  const ambientLayers = yohaku.ambientLayers.filter(({ id }) => AMBIENT_SOUND_IDS.includes(id));
  return { ...yohaku, ambientLayers };
};

export const saveYohakuSettings = async (
  envConfig: EnvConfigType,
  changes: Partial<YohakuSettings>,
) => {
  const { settings, setSettings, saveSettings } = useSettingsStore.getState();
  const next: SystemSettings = { ...settings, yohaku: { ...settings.yohaku, ...changes } };
  setSettings(next);
  await saveSettings(envConfig, next);
};
