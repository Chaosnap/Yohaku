import type { AppService } from '@/types/system';
import { stubTranslation as _ } from '@/utils/misc';
import { encodeWav, renderAmbient, type AmbientSoundId } from './synth';

export interface AmbientChoice {
  id: AmbientSoundId;
  volume: number;
}

/** Yohaku's ambient sounds (docs/yohaku/02-architecture.md §4.1), all synthesized. */
export const AMBIENT_SOUNDS: { id: AmbientSoundId; label: string }[] = [
  { id: 'rain', label: _('Rain') },
  { id: 'eaves', label: _('Rain on the Eaves') },
  { id: 'wind', label: _('Wind') },
  { id: 'waves', label: _('Waves') },
  { id: 'fire', label: _('Fireplace') },
  { id: 'forest', label: _('Forest') },
  { id: 'cicadas', label: _('Cicadas') },
  { id: 'crickets', label: _('Night Insects') },
  { id: 'stream', label: _('Stream') },
  { id: 'vinyl', label: _('Vinyl Crackle') },
];

/** The default scenes (§4.2). */
export const AMBIENT_SCENES: { label: string; layers: AmbientChoice[] }[] = [
  {
    label: _('Rainy Night'),
    layers: [
      { id: 'eaves', volume: 0.7 },
      { id: 'wind', volume: 0.3 },
    ],
  },
  {
    label: _('Summer Afternoon'),
    layers: [
      { id: 'cicadas', volume: 0.5 },
      { id: 'forest', volume: 0.3 },
    ],
  },
  {
    label: _('Seaside at Dusk'),
    layers: [
      { id: 'waves', volume: 0.7 },
      { id: 'wind', volume: 0.4 },
    ],
  },
  {
    label: _('Night Aquarium'),
    layers: [{ id: 'stream', volume: 0.6 }],
  },
  {
    label: _('Winter Study'),
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
