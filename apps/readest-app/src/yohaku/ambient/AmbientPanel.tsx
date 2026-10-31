import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useMusicStore } from '@/yohaku/music/store';
import { AMBIENT_SCENES, AMBIENT_SOUNDS, type AmbientChoice } from './sounds';
import type { AmbientSoundId } from './synth';

const DEFAULT_VOLUME = 0.5;
/** A volume is applied once the slider rests for a moment. */
const VOLUME_DELAY_MS = 150;

function chipClass(active: boolean) {
  return clsx(
    'eink-bordered inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs',
    active ? 'bg-base-content text-base-100' : 'bg-base-300/60 hover:bg-base-300',
  );
}

interface AmbientPanelProps {
  /** Only the scenes, for the reader's read-aloud menu. */
  scenesOnly?: boolean;
}

/**
 * Yohaku's ambient sounds, all made by the app itself. A scene turns on
 * several at once; each sound can also be turned on and mixed by itself.
 * They play by themselves, beside the music, reading aloud or nothing, and
 * start silent each time Yohaku opens.
 */
const AmbientPanel: React.FC<AmbientPanelProps> = ({ scenesOnly }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const layers = useMusicStore((state) => state.ambient);
  // A sound is made the first time it is turned on, which takes a moment.
  const [making, setMaking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Another window may have turned sounds on since.
  useEffect(() => {
    if (appService) useMusicStore.getState().loadAmbient(appService);
  }, [appService]);

  const apply = (next: AmbientChoice[], delay = 0) => {
    const adding = next.some(({ id }) => !layers.some((layer) => layer.id === id));
    useMusicStore.setState({ ambient: next });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!appService) return;
      setMaking(adding);
      await useMusicStore.getState().setAmbient(appService, next);
      setMaking(false);
    }, delay);
  };

  const volumeOf = (id: AmbientSoundId) => layers.find((layer) => layer.id === id)?.volume;
  const isActive = (scene: AmbientChoice[]) =>
    scene.length === layers.length && scene.every(({ id, volume }) => volumeOf(id) === volume);

  const toggleSound = (id: AmbientSoundId) => {
    const others = layers.filter((layer) => layer.id !== id);
    apply(others.length < layers.length ? others : [...layers, { id, volume: DEFAULT_VOLUME }]);
  };

  const setVolume = (id: AmbientSoundId, volume: number) => {
    const next = layers.map((layer) => (layer.id === id ? { ...layer, volume } : layer));
    apply(next, VOLUME_DELAY_MS);
  };

  return (
    <div className='w-full'>
      <div className='flex items-center gap-2'>
        <h3 className='text-base-content/60 text-xs font-semibold uppercase tracking-wider'>
          {_('Ambient Sounds')}
        </h3>
        {making && <span className='loading loading-spinner loading-xs' />}
      </div>
      <p className='text-base-content/50 mt-1 text-xs'>
        {_('Made by Yohaku. They play by themselves, or beside music or reading aloud.')}
      </p>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {AMBIENT_SCENES.map(({ label, icon: Icon, layers: scene }) => {
          const active = isActive(scene);
          return (
            <button
              key={label}
              aria-pressed={active}
              className={chipClass(active)}
              onClick={() => apply(active ? [] : scene)}
            >
              <Icon aria-hidden className='size-3.5 shrink-0' />
              {_(label)}
            </button>
          );
        })}
        {layers.length > 0 && (
          <button className={chipClass(false)} onClick={() => apply([])}>
            {_('Off')}
          </button>
        )}
      </div>
      {!scenesOnly && (
        <ul className='mt-3 flex flex-col'>
          {AMBIENT_SOUNDS.map(({ id, label, icon: Icon }) => {
            const volume = volumeOf(id);
            return (
              <li key={id} className='flex items-center gap-3 py-1.5'>
                <input
                  type='checkbox'
                  className='toggle toggle-sm'
                  checked={volume !== undefined}
                  aria-label={_(label)}
                  onChange={() => toggleSound(id)}
                />
                <span className='flex w-32 shrink-0 items-center gap-1.5 text-sm'>
                  <Icon aria-hidden className='text-base-content/70 size-4 shrink-0' />
                  <span className='truncate'>{_(label)}</span>
                </span>
                <input
                  type='range'
                  className='range range-xs flex-1'
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume ?? DEFAULT_VOLUME}
                  disabled={volume === undefined}
                  aria-label={_('{{sound}} Volume', { sound: _(label) })}
                  onChange={(event) => setVolume(id, Number(event.target.value))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AmbientPanel;
