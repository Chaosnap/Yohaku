import { invoke } from '@tauri-apps/api/core';
import { fileName, type AudioEngine, type PlaybackState } from './engine';

const call = <T = void>(command: string, args?: Record<string, unknown>) =>
  invoke<T>(`plugin:yohaku-audio|${command}`, args);

/** Android: commands for YohakuPlaybackService (tauri-plugin-yohaku-audio). */
export const androidEngine: AudioEngine = {
  pickFiles: async () => {
    const { uris } = await call<{ uris: string[] }>('pick_audio');
    return uris.map((uri) => ({ uri, name: fileName(uri) }));
  },
  setQueue: (tracks, start) => call('set_queue', { uris: tracks.map(({ uri }) => uri), start }),
  play: () => call('play'),
  pause: () => call('pause'),
  next: () => call('next'),
  previous: () => call('previous'),
  skipTo: (index) => call('skip_to', { index }),
  seekTo: (positionMs) => call('seek_to', { positionMs }),
  setAmbient: (layers) =>
    call('apply_ambient', { layers: layers.map(({ uri, volume }) => ({ uri, volume })) }),
  setSleepTimer: (afterMs, fadeMs) => call('set_sleep_timer', { afterMs, fadeMs }),
  getState: async () => {
    const state = await call<PlaybackState & { durationMs: number }>('get_state');
    // Media3 reports an unknown duration as a huge negative number.
    return { ...state, durationMs: Math.max(0, state.durationMs) };
  },
};
