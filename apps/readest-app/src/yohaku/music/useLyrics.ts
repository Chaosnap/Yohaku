import { useEffect, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { getAudioEngine } from '@/yohaku/audio';
import type { MusicTrack } from './library';
import { parseLyrics, type Lyrics } from './lyrics';

/** Lyrics read while the app runs, by track id; null for a song that has none. */
const cache = new Map<string, Lyrics | null>();

/** The song's lyrics, read from its files the first time they are wanted. */
export const useLyrics = (track: MusicTrack | undefined) => {
  const { appService } = useEnv();
  const [read, setRead] = useState<{ id: string; lyrics: Lyrics | null } | null>(null);
  const id = track?.id;

  useEffect(() => {
    if (!appService || !track) return;
    const known = cache.get(track.id);
    if (known !== undefined) {
      setRead({ id: track.id, lyrics: known });
      return;
    }
    let wanted = true;
    const found = (text: string | null) => {
      const lyrics = text ? parseLyrics(text) : null;
      cache.set(track.id, lyrics);
      if (wanted) setRead({ id: track.id, lyrics });
    };
    // Not kept: the next time the song plays they are tried again.
    const failed = () => {
      if (wanted) setRead({ id: track.id, lyrics: null });
    };
    getAudioEngine(appService).readLyrics(track.uri).then(found, failed);
    return () => {
      wanted = false;
    };
  }, [appService, id]);

  const ready = !!id && read?.id === id;
  const lyrics = read?.lyrics ?? null;
  return { loading: !!id && !ready, lyrics: ready ? lyrics : null };
};
