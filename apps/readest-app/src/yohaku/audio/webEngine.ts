import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { fileName, type AmbientLayer, type AudioEngine, type AudioFile } from './engine';

const AUDIO_EXTENSIONS = ['flac', 'mp3', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'aif', 'aiff'];
const FADE_STEP_MS = 50;

/**
 * The desktop for now: HTML audio in the WebView, which keeps playing while
 * the window is open. The native engine (Spike S4) replaces it in Phase 2.
 */
class WebEngine implements AudioEngine {
  private music = new Audio();
  private ambient: { audio: HTMLAudioElement; volume: number }[] = [];
  private queue: AudioFile[] = [];
  private ambientUris: string[] = [];
  private index = 0;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.music.addEventListener('ended', () => {
      if (this.index + 1 < this.queue.length) {
        this.load(this.index + 1);
        void this.play();
      } else {
        this.syncAmbient();
      }
    });
    this.music.addEventListener('play', () => this.syncAmbient());
    this.music.addEventListener('pause', () => this.syncAmbient());
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => void this.play());
      navigator.mediaSession.setActionHandler('pause', () => void this.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => void this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => void this.previous());
    }
  }

  async pickFiles() {
    const picked = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: AUDIO_EXTENSIONS }],
    });
    const paths = picked === null ? [] : Array.isArray(picked) ? picked : [picked];
    await this.allow(paths);
    return paths.map((path) => ({ uri: path, name: fileName(path) }));
  }

  async setQueue(tracks: AudioFile[], start: number) {
    await this.allow(tracks.map(({ uri }) => uri));
    this.queue = tracks;
    this.load(start);
  }

  async play() {
    if (this.queue.length === 0) return;
    await this.music.play();
  }

  async pause() {
    this.music.pause();
  }

  async next() {
    if (this.index + 1 >= this.queue.length) return;
    this.load(this.index + 1);
    await this.play();
  }

  async previous() {
    // As players do: back to the start, or to the track before when near it.
    if (this.music.currentTime > 3 || this.index === 0) {
      this.music.currentTime = 0;
      return;
    }
    this.load(this.index - 1);
    await this.play();
  }

  async skipTo(index: number) {
    this.load(index);
    await this.play();
  }

  async seekTo(positionMs: number) {
    this.music.currentTime = positionMs / 1000;
  }

  async setAmbient(layers: AmbientLayer[]) {
    const uris = layers.map(({ uri }) => uri);
    // The same sounds: only their volumes change, without restarting them.
    if (uris.join('\n') === this.ambientUris.join('\n')) {
      layers.forEach(({ volume }, i) => {
        this.ambient[i]!.volume = volume;
        this.ambient[i]!.audio.volume = volume;
      });
      return;
    }
    this.ambientUris = uris;
    await this.allow(uris);
    this.ambient.forEach(({ audio }) => audio.pause());
    this.ambient = layers.map(({ uri, volume }) => {
      const audio = new Audio(convertFileSrc(uri));
      audio.loop = true;
      audio.volume = volume;
      return { audio, volume };
    });
    this.syncAmbient();
  }

  async setSleepTimer(afterMs: number, fadeMs: number) {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    this.sleepTimer = null;
    if (afterMs <= 0) return;
    this.sleepTimer = setTimeout(() => this.fadeOut(fadeMs), afterMs);
  }

  async getState() {
    const duration = this.music.duration;
    return {
      playing: !this.music.paused,
      index: this.index,
      positionMs: this.music.currentTime * 1000,
      durationMs: Number.isFinite(duration) ? duration * 1000 : 0,
    };
  }

  private load(index: number) {
    const track = this.queue[index];
    if (!track) return;
    this.index = index;
    this.music.src = convertFileSrc(track.uri);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.name });
    }
  }

  /** The ambient layers play while the music plays. */
  private syncAmbient() {
    const playing = !this.music.paused;
    for (const { audio } of this.ambient) {
      if (playing) void audio.play().catch(() => {});
      else audio.pause();
    }
  }

  private fadeOut(fadeMs: number) {
    const steps = Math.max(1, Math.round(fadeMs / FADE_STEP_MS));
    const musicVolume = this.music.volume;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const gain = Math.max(0, 1 - step / steps);
      this.music.volume = musicVolume * gain;
      this.ambient.forEach(({ audio, volume }) => (audio.volume = volume * gain));
      if (step < steps) return;
      clearInterval(timer);
      this.music.pause();
      this.music.volume = musicVolume;
      this.ambient.forEach(({ audio, volume }) => (audio.volume = volume));
      this.sleepTimer = null;
    }, FADE_STEP_MS);
  }

  /** The WebView may only stream files the asset protocol allows. */
  private allow(paths: string[]) {
    return paths.length ? invoke('plugin:yohaku-audio|allow_files', { paths }) : Promise.resolve();
  }
}

let engine: WebEngine | null = null;

export const getWebEngine = () => {
  engine ??= new WebEngine();
  return engine;
};
