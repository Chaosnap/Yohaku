import { useEffect } from 'react';
import { emitTo } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEnv } from '@/context/EnvContext';
import { isYohakuBuild } from '@/yohaku/build';
import type { AmbientSource, AudioEngine, PlaybackState, TrackInfo } from './engine';
import { getWebEngine } from './webEngine';

/**
 * On the desktop the music plays in the main window, the library, which stays
 * while the app runs (macOS only hides it when it is closed). A book open in a
 * window of its own, as Readest opens books by default, plays nothing itself:
 * its engine passes every call to the main window and waits for the answer, so
 * the reader's music button and shortcuts control the one player.
 */

const MAIN_WINDOW = 'main';
const CALL_EVENT = 'yohaku-audio-call';
const REPLY_EVENT = 'yohaku-audio-reply';
/** A call the main window does not answer in time fails, as when it has been closed. */
const CALL_TIMEOUT_MS = 10_000;

type Method = keyof AudioEngine;

interface Call {
  id: number;
  from: string;
  method: Method;
  args: unknown[];
}

interface Reply {
  id: number;
  result?: unknown;
  error?: string;
}

export const isMainWindow = () => getCurrentWindow().label === MAIN_WINDOW;

/** In the main window: runs the other windows' calls on its own engine. */
export const useAudioHost = () => {
  const { appService } = useEnv();

  useEffect(() => {
    if (!appService?.hasWindow || !isYohakuBuild() || !isMainWindow()) return;
    const unlisten = getCurrentWebview().listen<Call>(CALL_EVENT, async ({ payload }) => {
      const { id, from, method, args } = payload;
      const engine = getWebEngine() as unknown as Record<Method, (...args: unknown[]) => unknown>;
      let reply: Reply;
      try {
        reply = { id, result: await engine[method](...args) };
      } catch (error) {
        reply = { id, error: String(error) };
      }
      await emitTo(from, REPLY_EVENT, reply);
    });
    return () => {
      unlisten.then((stop) => stop());
    };
  }, [appService]);
};

const waiting = new Map<number, (reply: Reply) => void>();
let listening: Promise<unknown> | null = null;
let nextId = 0;

const callMain = async <T>(method: Method, ...args: unknown[]): Promise<T> => {
  listening ??= getCurrentWebview().listen<Reply>(REPLY_EVENT, ({ payload }) => {
    waiting.get(payload.id)?.(payload);
  });
  await listening;
  const id = nextId++;
  const reply = new Promise<Reply>((resolve) => {
    waiting.set(id, resolve);
    setTimeout(() => resolve({ id, error: 'The main window did not answer' }), CALL_TIMEOUT_MS);
  });
  const call: Call = { id, from: getCurrentWindow().label, method, args };
  await emitTo(MAIN_WINDOW, CALL_EVENT, call);
  const { result, error } = await reply;
  waiting.delete(id);
  if (error !== undefined) throw new Error(error);
  return result as T;
};

/** The engine of every window but the main one. */
export const remoteEngine: AudioEngine = {
  pickFolder: () => callMain<string | null>('pickFolder'),
  pickFiles: () => callMain<string[]>('pickFiles'),
  scan: (paths) => callMain<TrackInfo[]>('scan', paths),
  setQueue: (tracks, start) => callMain<void>('setQueue', tracks, start),
  play: () => callMain<void>('play'),
  pause: () => callMain<void>('pause'),
  next: () => callMain<void>('next'),
  previous: () => callMain<void>('previous'),
  skipTo: (index) => callMain<void>('skipTo', index),
  seekTo: (positionMs) => callMain<void>('seekTo', positionMs),
  setAmbient: (layers) => callMain<void>('setAmbient', layers),
  getAmbient: () => callMain<AmbientSource[]>('getAmbient'),
  setSleepTimer: (afterMs, fadeMs) => callMain<void>('setSleepTimer', afterMs, fadeMs),
  getState: () => callMain<PlaybackState>('getState'),
};
