import { create } from 'zustand';
import type { AppService } from '@/types/system';
import { getAudioEngine } from '@/yohaku/audio';
import type { AmbientSource, AudioEngine, PlaybackState } from '@/yohaku/audio/engine';
import { ambientFile, ambientIdOf, type AmbientChoice } from '@/yohaku/ambient/sounds';
import { eventDispatcher } from '@/utils/event';
import {
  EMPTY_LIBRARY,
  isUnder,
  mergeTracks,
  toTracks,
  type MusicLibrary,
  type MusicTrack,
} from './library';

const LIBRARY_DIR = 'yohaku';
const LIBRARY_FILE = `${LIBRARY_DIR}/music-library.json`;
const SLEEP_FADE_MS = 30_000;
const STOPPED: PlaybackState = { playing: false, index: 0, positionMs: 0, durationMs: 0 };

interface MusicState {
  library: MusicLibrary;
  loaded: boolean;
  syncing: boolean;
  queue: MusicTrack[];
  playback: PlaybackState;
  /** The ambient sounds playing now, by themselves or beside the music. */
  ambient: AmbientChoice[];
  /** Whether the small player is out; music that starts playing brings it out. */
  miniPlayerOpen: boolean;
  sleepMinutes: number;
  /** When the sleep timer starts fading the music out, while it is set. */
  sleepEndsAt: number | null;
  /** Reads the library once. */
  load: (appService: AppService) => Promise<void>;
  /** Reads the library again: another window may have changed it, or what plays. */
  reload: (appService: AppService) => Promise<void>;
  addFolder: (appService: AppService) => Promise<void>;
  importFiles: (appService: AppService) => Promise<void>;
  sync: (appService: AppService) => Promise<void>;
  removeFolder: (appService: AppService, folder: string) => Promise<void>;
  removeTrack: (appService: AppService, track: MusicTrack) => Promise<void>;
  play: (appService: AppService, tracks: MusicTrack[], index: number) => Promise<void>;
  toggle: (appService: AppService) => Promise<void>;
  next: (appService: AppService) => Promise<void>;
  previous: (appService: AppService) => Promise<void>;
  seek: (appService: AppService, positionMs: number) => Promise<void>;
  /** Pauses the music and puts the small player away. */
  stop: (appService: AppService) => Promise<void>;
  setMiniPlayerOpen: (open: boolean) => void;
  refresh: (appService: AppService) => Promise<void>;
  /** Asks the engine which ambient sounds play: another window may have turned them on. */
  loadAmbient: (appService: AppService) => Promise<void>;
  setAmbient: (appService: AppService, layers: AmbientChoice[]) => Promise<void>;
  setSleepTimer: (appService: AppService, minutes: number) => Promise<void>;
}

/**
 * The music library, what plays and the ambient sounds, shared by the music
 * library page and the reader's players. An action that fails says why in a
 * toast.
 */
export const useMusicStore = create<MusicState>((set, get) => {
  const save = async (appService: AppService, library: MusicLibrary) => {
    set({ library });
    await appService.createDir(LIBRARY_DIR, 'Data', true);
    await appService.writeFile(LIBRARY_FILE, 'Data', JSON.stringify(library));
  };

  const attempt = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      eventDispatcher.dispatch('toast', { type: 'error', message: String(error) });
    }
  };

  /** Takes the engine's state; music that starts playing brings the small player out. */
  const take = (playback: PlaybackState) =>
    set((state) => ({
      playback,
      miniPlayerOpen: state.miniPlayerOpen || (playback.playing && !state.playback.playing),
    }));

  /** Runs an engine action, then takes the engine's state. */
  const control = (appService: AppService, action: (engine: AudioEngine) => Promise<void>) =>
    attempt(async () => {
      const engine = getAudioEngine(appService);
      await action(engine);
      take(await engine.getState());
    });

  const applyAmbient = async (appService: AppService, layers: AmbientChoice[]) => {
    // Each loop is made once, the first time it is used, then read from the cache.
    const sources: AmbientSource[] = [];
    for (const { id, volume } of layers) {
      sources.push({ uri: await ambientFile(appService, id), volume });
    }
    await getAudioEngine(appService).setAmbient(sources);
  };

  const readLibrary = (appService: AppService) =>
    attempt(async () => {
      if (!(await appService.exists(LIBRARY_FILE, 'Data'))) return;
      const text = (await appService.readFile(LIBRARY_FILE, 'Data', 'text')) as string;
      const library: MusicLibrary = { ...EMPTY_LIBRARY, ...JSON.parse(text) };
      const byId = new Map(library.tracks.map((track) => [track.id, track]));
      const queue = library.queue.flatMap((id) => byId.get(id) ?? []);
      set({ library, queue });
    });

  let loading: Promise<void> | null = null;

  const scanInto = async (appService: AppService, paths: string[], replace = false) => {
    const { library } = get();
    set({ syncing: true });
    try {
      const scanned = await getAudioEngine(appService).scan(paths);
      const found = toTracks(scanned, library.tracks, Date.now());
      return replace ? mergeTracks(found) : mergeTracks(library.tracks, found);
    } finally {
      set({ syncing: false });
    }
  };

  return {
    library: EMPTY_LIBRARY,
    loaded: false,
    syncing: false,
    queue: [],
    playback: STOPPED,
    ambient: [],
    miniPlayerOpen: false,
    sleepMinutes: 0,
    sleepEndsAt: null,

    load: (appService) => {
      loading ??= (async () => {
        await readLibrary(appService);
        set({ loaded: true });
      })();
      return loading;
    },

    reload: (appService) => readLibrary(appService),

    addFolder: (appService) =>
      attempt(async () => {
        const folder = await getAudioEngine(appService).pickFolder();
        if (!folder) return;
        const tracks = await scanInto(appService, [folder]);
        const { library } = get();
        const folders = [...new Set([...library.folders, folder])];
        await save(appService, { ...library, folders, tracks });
      }),

    importFiles: (appService) =>
      attempt(async () => {
        const paths = await getAudioEngine(appService).pickFiles();
        if (paths.length === 0) return;
        const tracks = await scanInto(appService, paths);
        const { library } = get();
        const files = [...new Set([...library.files, ...paths])];
        await save(appService, { ...library, files, tracks });
      }),

    // Reads every synced folder and imported file again: new files appear,
    // deleted ones go, changed tags are picked up.
    sync: (appService) =>
      attempt(async () => {
        const { library } = get();
        const paths = [...library.folders, ...library.files];
        if (paths.length === 0) return;
        const tracks = await scanInto(appService, paths, true);
        await save(appService, { ...get().library, tracks });
      }),

    removeFolder: (appService, folder) =>
      attempt(async () => {
        const { library } = get();
        const folders = library.folders.filter((path) => path !== folder);
        const tracks = library.tracks.filter(
          (track) => !isUnder(track.uri, folder) || library.files.includes(track.uri),
        );
        await save(appService, { ...library, folders, tracks });
      }),

    removeTrack: (appService, track) =>
      attempt(async () => {
        const { library } = get();
        const files = library.files.filter((path) => path !== track.uri);
        const tracks = library.tracks.filter(({ id }) => id !== track.id);
        await save(appService, { ...library, files, tracks });
      }),

    play: (appService, tracks, index) =>
      control(appService, async (engine) => {
        await engine.setQueue(tracks, index);
        await engine.play();
        set({ queue: tracks });
        const queue = tracks.map(({ id }) => id);
        await save(appService, { ...get().library, queue });
      }),

    toggle: (appService) =>
      control(appService, async (engine) => {
        // Asked fresh: the music may have been paused from the lock screen or media keys.
        const playback = await engine.getState();
        if (playback.playing) return engine.pause();
        if (playback.durationMs > 0) return engine.play();
        // Nothing loaded in the engine yet: start the last queue, or the library.
        const { queue, library } = get();
        const tracks = queue.length > 0 ? queue : library.tracks;
        if (tracks.length === 0) return;
        await engine.setQueue(tracks, Math.min(playback.index, tracks.length - 1));
        await engine.play();
        set({ queue: tracks });
      }),

    next: (appService) => control(appService, (engine) => engine.next()),
    previous: (appService) => control(appService, (engine) => engine.previous()),
    seek: (appService, positionMs) => control(appService, (engine) => engine.seekTo(positionMs)),

    stop: async (appService) => {
      set({ miniPlayerOpen: false });
      await control(appService, (engine) => engine.pause());
    },

    setMiniPlayerOpen: (open) => set({ miniPlayerOpen: open }),

    refresh: async (appService) => {
      try {
        take(await getAudioEngine(appService).getState());
      } catch {}
    },

    loadAmbient: (appService) =>
      attempt(async () => {
        const sources = await getAudioEngine(appService).getAmbient();
        const ambient = sources.flatMap(({ uri, volume }) => {
          const id = ambientIdOf(uri);
          return id ? [{ id, volume }] : [];
        });
        set({ ambient });
      }),

    setAmbient: (appService, layers) =>
      attempt(async () => {
        set({ ambient: layers });
        await applyAmbient(appService, layers);
      }),

    setSleepTimer: (appService, minutes) =>
      attempt(async () => {
        await getAudioEngine(appService).setSleepTimer(minutes * 60_000, SLEEP_FADE_MS);
        const sleepEndsAt = minutes > 0 ? Date.now() + minutes * 60_000 : null;
        set({ sleepMinutes: minutes, sleepEndsAt });
      }),
  };
});
