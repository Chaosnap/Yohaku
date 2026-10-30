'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';

// Spike S1 (docs/yohaku/spikes/S1-android-audio.md): a bare test page for the
// Android playback service. It is a measuring tool, so its labels are not
// translated.

interface PickResult {
  uris: string[];
}

interface PlaybackState {
  playing: boolean;
  index: number;
  count: number;
  positionMs: number;
  durationMs: number;
}

const call = <T,>(command: string, args?: Record<string, unknown>) =>
  invoke<T>(`plugin:yohaku-audio|${command}`, args);

const HINT = '选择音乐与最多 3 个环境声后播放，然后锁屏、拔耳机、来电、切换应用。';

const name = (uri: string) => decodeURIComponent(uri.split('/').pop() ?? uri);

export default function AudioSpikePage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<string[]>([]);
  const [layers, setLayers] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
      setStatus(`${label}: OK`);
    } catch (error) {
      setStatus(`${label}: ${String(error)}`);
    }
  };

  const pickTracks = () =>
    run('选择音乐', async () => {
      const { uris } = await call<PickResult>('pick_audio');
      setTracks(uris);
      await call('set_queue', { uris, start: 0 });
    });

  const pickLayers = () =>
    run('选择环境声', async () => {
      const { uris } = await call<PickResult>('pick_audio');
      const chosen = uris.slice(0, 3);
      setLayers(chosen);
      await call('apply_ambient', { layers: chosen.map((uri) => ({ uri, volume: 0.6 })) });
    });

  const sleepIn = (minutes: number) =>
    run(`${minutes} 分钟后睡眠`, () =>
      call('set_sleep_timer', { afterMs: minutes * 60_000, fadeMs: 30_000 }),
    );

  const refresh = () =>
    run('状态', async () => {
      const state = await call<PlaybackState>('get_state');
      const position = Math.round(state.positionMs / 1000);
      const playing = state.playing ? '播放中' : '已暂停';
      setStatus(`${playing} · 第 ${state.index + 1}/${state.count} 首 · ${position} 秒`);
    });

  const button = 'btn btn-outline w-full';
  return (
    <div className='bg-base-100 text-base-content min-h-screen overflow-y-auto p-6 pt-12'>
      <h1 className='mb-1 text-xl font-bold'>Spike S1 · Android 后台音频</h1>
      <p className='text-base-content/70 mb-6 text-sm'>{HINT}</p>
      <div className='flex flex-col gap-3'>
        <button className={button} onClick={pickTracks}>
          选择音乐（可多选）
        </button>
        <button className={button} onClick={pickLayers}>
          选择环境声（最多 3 个，音量 0.6）
        </button>
        <div className='grid grid-cols-2 gap-3'>
          <button className='btn btn-primary' onClick={() => run('播放', () => call('play'))}>
            播放
          </button>
          <button className='btn' onClick={() => run('暂停', () => call('pause'))}>
            暂停
          </button>
        </div>
        <div className='grid grid-cols-3 gap-3'>
          <button className='btn btn-sm' onClick={() => sleepIn(1)}>
            1 分钟后睡眠
          </button>
          <button className='btn btn-sm' onClick={() => sleepIn(60)}>
            60 分钟后睡眠
          </button>
          <button className='btn btn-sm' onClick={() => sleepIn(0)}>
            取消睡眠
          </button>
        </div>
        <button className={button} onClick={refresh}>
          刷新状态
        </button>
        <p className='min-h-6 text-sm'>{status}</p>
        <div className='text-sm'>
          <p className='font-semibold'>音乐</p>
          {tracks.map((uri) => (
            <p key={uri} className='truncate'>
              {name(uri)}
            </p>
          ))}
          <p className='mt-2 font-semibold'>环境声</p>
          {layers.map((uri) => (
            <p key={uri} className='truncate'>
              {name(uri)}
            </p>
          ))}
        </div>
        <button className='btn btn-ghost' onClick={() => router.push('/library')}>
          返回书库
        </button>
      </div>
    </div>
  );
}
