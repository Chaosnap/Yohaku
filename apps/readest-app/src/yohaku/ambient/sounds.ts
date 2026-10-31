import type { IconType } from 'react-icons';
import {
  PiBug,
  PiCloudRain,
  PiDrop,
  PiFire,
  PiFishSimple,
  PiHouseLine,
  PiMoonStars,
  PiSnowflake,
  PiSun,
  PiSunHorizon,
  PiTree,
  PiVinylRecord,
  PiWaves,
  PiWind,
} from 'react-icons/pi';
import type { AppService } from '@/types/system';
import { stubTranslation as _ } from '@/utils/misc';
import { AMBIENT_SOUND_IDS, encodeWav, renderAmbient, type AmbientSoundId } from './synth';

export interface AmbientChoice {
  id: AmbientSoundId;
  volume: number;
}

/**
 * Yohaku's ambient sounds (docs/yohaku/02-architecture.md §4.1), all
 * synthesized. Each has a symbol shown before its name, so the sound is
 * known at a glance.
 */
export const AMBIENT_SOUNDS: { id: AmbientSoundId; label: string; icon: IconType }[] = [
  { id: 'rain', label: _('Rain'), icon: PiCloudRain },
  { id: 'eaves', label: _('Rain on the Eaves'), icon: PiHouseLine },
  { id: 'wind', label: _('Wind'), icon: PiWind },
  { id: 'waves', label: _('Waves'), icon: PiWaves },
  { id: 'fire', label: _('Fireplace'), icon: PiFire },
  { id: 'forest', label: _('Forest'), icon: PiTree },
  { id: 'cicadas', label: _('Cicadas'), icon: PiBug },
  { id: 'crickets', label: _('Night Insects'), icon: PiMoonStars },
  { id: 'stream', label: _('Stream'), icon: PiDrop },
  { id: 'vinyl', label: _('Vinyl Crackle'), icon: PiVinylRecord },
];

/** The default scenes (§4.2). */
export const AMBIENT_SCENES: { label: string; icon: IconType; layers: AmbientChoice[] }[] = [
  {
    label: _('Rainy Night'),
    icon: PiCloudRain,
    layers: [
      { id: 'eaves', volume: 0.7 },
      { id: 'wind', volume: 0.3 },
    ],
  },
  {
    label: _('Summer Afternoon'),
    icon: PiSun,
    layers: [
      { id: 'cicadas', volume: 0.5 },
      { id: 'forest', volume: 0.3 },
    ],
  },
  {
    label: _('Seaside at Dusk'),
    icon: PiSunHorizon,
    layers: [
      { id: 'waves', volume: 0.7 },
      { id: 'wind', volume: 0.4 },
    ],
  },
  {
    label: _('Night Aquarium'),
    icon: PiFishSimple,
    layers: [{ id: 'stream', volume: 0.6 }],
  },
  {
    label: _('Winter Study'),
    icon: PiSnowflake,
    layers: [
      { id: 'fire', volume: 0.6 },
      { id: 'wind', volume: 0.35 },
    ],
  },
];

/** Bumped whenever a recipe changes, so the cached loops are made again. */
const RECIPES_VERSION = 1;

/** The sound's loop as a file in the app cache, made the first time it is needed. */
export const ambientFile = async (appService: AppService, id: AmbientSoundId) => {
  const path = `yohaku-ambient/${id}-${RECIPES_VERSION}.wav`;
  if (!(await appService.exists(path, 'Cache'))) {
    await appService.createDir('yohaku-ambient', 'Cache', true);
    await appService.writeFile(path, 'Cache', encodeWav(renderAmbient(id)));
  }
  return appService.resolveFilePath(path, 'Cache');
};

/** Which of Yohaku's sounds a loop file plays, read from its name (`rain-1.wav`). */
export const ambientIdOf = (uri: string) => {
  const id = /([a-z]+)-\d+\.wav$/.exec(uri)?.[1];
  return AMBIENT_SOUND_IDS.find((known) => known === id);
};
