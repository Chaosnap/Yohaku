import { describe, expect, it } from 'vitest';
import type { SystemSettings } from '@/types/settings';
import { fileName } from '@/yohaku/audio/engine';
import { getYohakuSettings } from '@/yohaku/settings';

const ANDROID_URI =
  'content://com.android.externalstorage.documents/document/primary%3AMusic%2FRain.ogg';

describe('music file names', () => {
  it('are the last part of a path or a content URI', () => {
    expect(fileName('/Users/yuki/Music/Nocturne.flac')).toBe('Nocturne.flac');
    expect(fileName('C:\\Music\\Gymnopédie.mp3')).toBe('Gymnopédie.mp3');
    expect(fileName(ANDROID_URI)).toBe('Rain.ogg');
  });
});

describe('music settings', () => {
  it('start with no tracks and no ambient sounds', () => {
    const { musicTracks, ambientLayers } = getYohakuSettings({} as SystemSettings);
    expect(musicTracks).toEqual([]);
    expect(ambientLayers).toEqual([]);
  });
});
