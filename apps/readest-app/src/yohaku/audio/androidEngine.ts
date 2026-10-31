import { invoke } from '@tauri-apps/api/core';
import type { AudioEngine, PlaybackState, TrackInfo } from './engine';

const call = <T = void>(command: string, args?: Record<string, unknown>) =>
  invoke<T>(`plugin:yohaku-audio|${command}`, args);

/** Android: YohakuPlaybackService and the system's file pickers (tauri-plugin-yohaku-audio). */
export const androidEngine: AudioEngine = {
  pickFolder: async () => (await call<{ path?: string }>('pick_folder')).path ?? null,
  pickFiles: async () => (await call<{ paths: string[] }>('pick_files')).paths,
  scan: async (paths) => (await call<{ tracks: TrackInfo[] }>('scan_music', { paths })).tracks,
  setQueue: (tracks, start) =>
    call('set_queue', {
      uris: tracks.map(({ uri }) => uri),
      titles: tracks.map(({ title }) => title),
      artists: tracks.map(({ artist }) => artist ?? ''),
      covers: tracks.map(({ cover }) => cover ?? ''),
      start,
    }),
  play: () => call('play'),
  pause: () => call('pause'),
  next: () => call('next'),
  previous: () => call('previous'),
  skipTo: (index) => call('skip_to', { index }),
  seekTo: (positionMs) => call('seek_to', { positionMs }),
  setAmbient: (layers) => call('apply_ambient', { layers }),
  setSleepTimer: (afterMs, fadeMs) => call('set_sleep_timer', { afterMs, fadeMs }),
  getState: async () => {
    const state = await call<PlaybackState>('get_state');
    // Media3 reports an unknown duration as a huge negative number.
    return { ...state, durationMs: Math.max(0, state.durationMs) };
  },
};
