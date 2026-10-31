import { useEffect } from 'react';
import { create } from 'zustand';
import type { TTSPlaybackInfo } from '@/app/reader/components/tts/usePlaybackInfo';

/**
 * What Readest's read-aloud mini player would show and do. Yohaku never shows
 * that floating player: TTSControl hands all this to the read-aloud panel in
 * the reader's header (ReadAloudToggler.tsx), which shows it in its place.
 */
export interface ReadAloudControls {
  isPlaying: boolean;
  /** Playing, but nothing to hear yet. */
  buffering: boolean;
  isEink: boolean;
  hasTimeline: boolean;
  /** A paired audiobook: it skips by seconds, not by sentences. */
  audioTransport: boolean;
  timeoutTimestamp: number;
  chapterRemainingSec: number | null;
  onTogglePlay: () => void;
  onBackward: (byMark: boolean) => void;
  onForward: (byMark: boolean) => void;
  onStop: () => void;
  /** Opens Readest's full read-aloud player. */
  onExpand: () => void;
  onGetPlaybackInfo: () => TTSPlaybackInfo | null;
}

interface ReadAloudState {
  /** By book, while it reads aloud. */
  controls: Record<string, ReadAloudControls | undefined>;
  publish: (bookKey: string, controls: ReadAloudControls | null) => void;
}

export const useReadAloudStore = create<ReadAloudState>((set) => ({
  controls: {},
  publish: (bookKey, controls) =>
    set((state) => ({ controls: { ...state.controls, [bookKey]: controls ?? undefined } })),
}));

/** Hands the book's read-aloud controls to the header while it reads aloud. */
export const usePublishReadAloud = (bookKey: string, controls: ReadAloudControls | null) => {
  useEffect(() => {
    useReadAloudStore.getState().publish(bookKey, controls);
  });
  useEffect(() => () => useReadAloudStore.getState().publish(bookKey, null), [bookKey]);
};
