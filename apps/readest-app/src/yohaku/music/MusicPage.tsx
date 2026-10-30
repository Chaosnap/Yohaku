'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoClose, IoPause, IoPlay } from 'react-icons/io5';
import { IoPlaySkipBack, IoPlaySkipForward } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { androidEngine } from '@/yohaku/audio/androidEngine';
import { getWebEngine } from '@/yohaku/audio/webEngine';
import type { AmbientLayer, AudioEngine, PlaybackState } from '@/yohaku/audio/engine';
import { getYohakuSettings, saveYohakuSettings } from '@/yohaku/settings';

const SLEEP_MINUTES = [0, 15, 30, 45, 60, 90];
const SLEEP_FADE_MS = 30_000;
const MAX_AMBIENT = 3;
const STOPPED: PlaybackState = { playing: false, index: 0, positionMs: 0, durationMs: 0 };

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Yohaku's music player, in its first form: the user's own audio files in a
 * queue, up to three ambient sounds looping beside them and a sleep timer. On
 * Android it plays in a background media service, so it keeps going with the
 * screen locked; the gramophone room (Phase 4) is built on top of it.
 */
export default function MusicPage() {
  const _ = useTranslation();
  const router = useAppRouter();
  const { envConfig, appService } = useEnv();
  const { settings } = useSettingsStore();
  const insets = useThemeStore((state) => state.safeAreaInsets);
  const { musicTracks: tracks, ambientLayers: ambient } = getYohakuSettings(settings);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [playback, setPlayback] = useState(STOPPED);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appService) setEngine(appService.isAndroidApp ? androidEngine : getWebEngine());
  }, [appService]);

  // The engine reports where it is once a second; the slider moves between.
  useEffect(() => {
    if (!engine) return;
    const refresh = () => engine.getState().then(setPlayback, () => {});
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, [engine]);

  const run = async (action: (engine: AudioEngine) => Promise<unknown>) => {
    if (!engine) return;
    try {
      setError('');
      await action(engine);
      setPlayback(await engine.getState());
    } catch (e) {
      setError(String(e));
    }
  };

  const addTracks = () =>
    run(async (engine) => {
      const picked = await engine.pickFiles();
      if (picked.length === 0) return;
      const next = [...tracks, ...picked];
      await saveYohakuSettings(envConfig, { musicTracks: next });
      if (!playback.playing) await engine.setQueue(next, tracks.length);
    });

  const playTrack = (index: number) =>
    run(async (engine) => {
      await engine.setQueue(tracks, index);
      await engine.play();
    });

  const removeTrack = (index: number) =>
    run(async (engine) => {
      const next = tracks.filter((_track, i) => i !== index);
      await saveYohakuSettings(envConfig, { musicTracks: next });
      if (!playback.playing && next.length > 0) await engine.setQueue(next, 0);
    });

  const togglePlay = () =>
    run(async (engine) => {
      if (playback.playing) return engine.pause();
      // Nothing queued yet in this session: start from the first track.
      if (playback.durationMs === 0 && tracks.length > 0) {
        await engine.setQueue(tracks, Math.min(playback.index, tracks.length - 1));
      }
      await engine.play();
    });

  const saveAmbient = (layers: AmbientLayer[]) =>
    run(async (engine) => {
      await saveYohakuSettings(envConfig, { ambientLayers: layers });
      await engine.setAmbient(layers);
    });

  const addAmbient = () =>
    run(async (engine) => {
      const picked = await engine.pickFiles();
      const room = MAX_AMBIENT - ambient.length;
      const layers = picked.slice(0, room).map((file) => ({ ...file, volume: 0.6 }));
      if (layers.length > 0) await saveAmbient([...ambient, ...layers]);
    });

  const setVolume = (index: number, volume: number) =>
    saveAmbient(ambient.map((layer, i) => (i === index ? { ...layer, volume } : layer)));

  const setSleep = (minutes: number) =>
    run(async (engine) => {
      setSleepMinutes(minutes);
      await engine.setSleepTimer(minutes * 60_000, SLEEP_FADE_MS);
    });

  const current = tracks[playback.index];
  const section = 'text-base-content/60 mb-2 mt-6 text-xs font-semibold uppercase tracking-wider';

  return (
    <div
      className='bg-base-100 text-base-content h-full min-h-screen overflow-y-auto px-5 pb-10'
      style={{ paddingTop: (insets?.top ?? 0) + 16 }}
    >
      <div className='flex items-center gap-2'>
        <button
          className='btn btn-ghost btn-sm btn-square'
          aria-label={_('Back')}
          onClick={() => router.push('/library')}
        >
          <IoArrowBack size={20} />
        </button>
        <h1 className='text-lg font-semibold'>{_('Music')}</h1>
      </div>

      <div className='bg-base-200 mt-4 rounded-2xl p-5'>
        <p className='truncate text-base font-medium'>
          {current && playback.durationMs > 0 ? current.name : _('Not Playing')}
        </p>
        <input
          type='range'
          className='range range-xs mt-4 w-full'
          min={0}
          max={Math.max(playback.durationMs, 1)}
          value={Math.min(playback.positionMs, playback.durationMs)}
          disabled={playback.durationMs === 0}
          onChange={(e) => run((engine) => engine.seekTo(Number(e.target.value)))}
        />
        <div className='text-base-content/60 flex justify-between text-xs'>
          <span>{formatTime(playback.positionMs)}</span>
          <span>{formatTime(playback.durationMs)}</span>
        </div>
        <div className='mt-3 flex items-center justify-center gap-6'>
          <button
            className='btn btn-ghost btn-circle'
            aria-label={_('Previous')}
            onClick={() => run((engine) => engine.previous())}
          >
            <IoPlaySkipBack size={22} />
          </button>
          <button
            className='btn btn-primary btn-circle btn-lg'
            aria-label={playback.playing ? _('Pause') : _('Play')}
            disabled={tracks.length === 0}
            onClick={togglePlay}
          >
            {playback.playing ? <IoPause size={26} /> : <IoPlay size={26} />}
          </button>
          <button
            className='btn btn-ghost btn-circle'
            aria-label={_('Next')}
            onClick={() => run((engine) => engine.next())}
          >
            <IoPlaySkipForward size={22} />
          </button>
        </div>
        <label className='mt-4 flex items-center justify-between text-sm'>
          {_('Sleep Timer')}
          <select
            className='select select-bordered select-sm'
            value={sleepMinutes}
            onChange={(e) => setSleep(Number(e.target.value))}
          >
            {SLEEP_MINUTES.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes === 0 ? _('Off') : _('{{minutes}} min', { minutes })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className='text-error mt-3 text-sm'>{error}</p>}

      <div className='flex items-center justify-between'>
        <p className={section}>{_('Ambient Sounds')}</p>
        <button
          className='btn btn-ghost btn-xs mt-4'
          disabled={ambient.length >= MAX_AMBIENT}
          onClick={addAmbient}
        >
          {_('Add Sound')}
        </button>
      </div>
      {ambient.length === 0 && (
        <p className='text-base-content/60 text-sm'>
          {_('Rain, wind or any recording: up to three sounds loop beside the music.')}
        </p>
      )}
      {ambient.map((layer, index) => (
        <div key={layer.uri} className='flex items-center gap-3 py-2'>
          <span className='w-1/3 truncate text-sm'>{layer.name}</span>
          <input
            type='range'
            className='range range-xs flex-1'
            min={0}
            max={1}
            step={0.05}
            value={layer.volume}
            aria-label={layer.name}
            onChange={(e) => setVolume(index, Number(e.target.value))}
          />
          <button
            className='btn btn-ghost btn-xs btn-square'
            aria-label={_('Remove')}
            onClick={() => saveAmbient(ambient.filter((_layer, i) => i !== index))}
          >
            <IoClose size={16} />
          </button>
        </div>
      ))}

      <div className='flex items-center justify-between'>
        <p className={section}>{_('Tracks')}</p>
        <button className='btn btn-ghost btn-xs mt-4' onClick={addTracks}>
          {_('Add Music')}
        </button>
      </div>
      {tracks.length === 0 && (
        <p className='text-base-content/60 text-sm'>
          {_(
            'Add your own audio files. On Android, music keeps playing with the screen locked.',
          )}
        </p>
      )}
      <ul>
        {tracks.map((track, index) => (
          <li key={`${index}-${track.uri}`} className='flex items-center gap-2'>
            <button
              className={clsx(
                'flex-1 truncate rounded-lg px-2 py-2 text-left text-sm',
                'hover:bg-base-200',
                index === playback.index && playback.durationMs > 0 && 'text-primary font-medium',
              )}
              onClick={() => playTrack(index)}
            >
              {track.name}
            </button>
            <button
              className='btn btn-ghost btn-xs btn-square'
              aria-label={_('Remove')}
              onClick={() => removeTrack(index)}
            >
              <IoClose size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
