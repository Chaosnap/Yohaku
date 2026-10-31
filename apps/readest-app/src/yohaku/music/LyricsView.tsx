import clsx from 'clsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/store/themeStore';
import type { MusicTrack } from './library';
import { activeLine, estimateWords, type LyricLine, type LyricWord } from './lyrics';
import { useMusicStore } from './store';
import { useLyrics } from './useLyrics';

/** Where the line being sung sits: this share of the view's height from the top. */
const FOCUS = 0.38;
/** After scrolling by hand, how long until the lyrics follow the song again. */
const FOLLOW_AGAIN_MS = 2500;
/** Each line below starts moving this much after the one above: the lyrics flow. */
const STAGGER_MS = 40;

/** No movement when the system asks for less of it, and none on e-ink. */
const isStill = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.getAttribute('data-eink') === 'true';

/**
 * A soft halo around the words already sung, in a dark theme. Its size never
 * changes, which Folia found matters: Chromium (the Linux build) caches glyphs
 * by their shadow, and a halo growing frame by frame fills that cache forever.
 */
const GLOW = 'drop-shadow(0 0 0.18em color-mix(in srgb, currentColor 55%, transparent))';
/** How far a word's halo reaches past it, kept clear of the fill's clip. */
const REACH = '0.5em';

/** The lyrics breathe while the song plays: a slow rise and settle of a few pixels. */
const BREATH: Keyframe[] = [
  { transform: 'translateY(0) scale(1)' },
  { transform: 'translateY(-4px) scale(1.004)' },
  { transform: 'translateY(0) scale(1)' },
  { transform: 'translateY(2px) scale(0.998)' },
  { transform: 'translateY(0) scale(1)' },
];

/** Fills the words of the line being sung up to where the singing is. */
const fillWords = (element: HTMLElement | null | undefined, words: LyricWord[], ms: number) => {
  if (!element) return;
  const fills = element.querySelectorAll<HTMLElement>('[data-fill]');
  words.forEach((word, i) => {
    const fill = fills[i];
    if (!fill) return;
    const end = words[i + 1]?.time ?? word.time + 600;
    const sung = Math.min(1, Math.max(0, (ms - word.time) / Math.max(1, end - word.time)));
    if (sung <= 0) {
      fill.style.clipPath = 'inset(0 100% 0 0)';
      return;
    }
    const right = sung >= 1 ? `-${REACH}` : `${100 - sung * 100}%`;
    fill.style.clipPath = `inset(-${REACH} ${right} -${REACH} -${REACH})`;
  });
};

interface WordsProps {
  words: LyricWord[];
  glow: boolean;
}

/** The words of the line being sung, each filling in as it is sung. */
const Words: React.FC<WordsProps> = ({ words, glow }) => (
  <>
    {words.map((word, i) => (
      <span key={i} className='relative inline-block whitespace-pre'>
        <span className='opacity-35'>{word.text}</span>
        <span
          data-fill
          aria-hidden='true'
          className='absolute inset-0'
          style={{ clipPath: 'inset(0 100% 0 0)', filter: glow ? GLOW : undefined }}
        >
          {word.text}
        </span>
      </span>
    ))}
  </>
);

/** A pause in the singing: three dots while it lasts. */
const Pause: React.FC<{ current: boolean }> = ({ current }) => (
  <span
    className={clsx(
      'flex items-center gap-1.5 overflow-hidden transition-[height] duration-500',
      current ? 'h-8' : 'h-0',
    )}
  >
    {[0, 1, 2].map((dot) => (
      <span
        key={dot}
        className='bg-base-content size-2 animate-pulse rounded-full'
        style={{ animationDelay: `${dot * 250}ms` }}
      />
    ))}
  </span>
);

interface LyricsViewProps {
  track: MusicTrack | undefined;
  /** Larger type, for the full player. */
  large?: boolean;
  className?: string;
}

/**
 * The song's lyrics, the way Apple Music shows them: the line being sung
 * bright and full size, the others dimmed and blurred by their distance, the
 * whole flowing up line after line. The line being sung fills in as it is
 * sung, by its word times or else by estimated ones, with a soft glow in a dark
 * theme, and the lyrics breathe while the song plays; these two are ideas from
 * Folia (github.com/chthollyphile/folia-major), written anew here. A line
 * clicked plays from there, and the wheel or a finger scrolls back and forth
 * until the lyrics follow the song again. Lyrics without times are listed.
 */
const LyricsView: React.FC<LyricsViewProps> = ({ track, large, className }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { loading, lyrics } = useLyrics(track);
  const playback = useMusicStore((state) => state.playback);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const view = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const lineElements = useRef<(HTMLButtonElement | null)[]>([]);
  const anchor = useRef({ positionMs: 0, at: 0, playing: false });
  const followTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragY = useRef<number | null>(null);
  const [active, setActive] = useState(-1);
  const [offset, setOffset] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const [still] = useState(isStill);
  const lines = lyrics?.synced ? lyrics.lines : null;
  const playing = playback.playing;

  // The line being sung, word by word: by its own word times, or else by estimated ones.
  const words = useMemo(() => {
    const line = lines?.[active];
    if (!line?.text) return null;
    return line.words ?? estimateWords(line, lines?.[active + 1]?.time);
  }, [lines, active]);
  const filling = useRef({ index: active, words });
  filling.current = { index: active, words };

  // Where the song is between the engine's reports, which come once a second.
  useEffect(() => {
    const { positionMs, playing } = playback;
    anchor.current = { positionMs, at: performance.now(), playing };
  }, [playback]);

  useEffect(() => {
    if (!lines) return;
    let frame = 0;
    const tick = () => {
      const { positionMs, at, playing } = anchor.current;
      const ms = playing ? positionMs + performance.now() - at : positionMs;
      setActive(activeLine(lines, ms));
      // The line on screen, which may be a frame behind the singing.
      const { index, words } = filling.current;
      if (words) fillWords(lineElements.current[index], words, ms);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [lines]);

  useEffect(() => {
    const element = view.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(followTimer.current ?? undefined), []);

  useEffect(() => {
    const element = list.current;
    if (!element || still || !playing) return;
    const breath = element.animate(BREATH, {
      duration: 7000,
      iterations: Number.POSITIVE_INFINITY,
      easing: 'ease-in-out',
    });
    return () => breath.cancel();
  }, [still, playing, lines]);

  // The line being sung, or the first before the singing starts, at the focus.
  useLayoutEffect(() => {
    const line = lineElements.current[Math.max(active, 0)];
    const height = view.current?.clientHeight ?? 0;
    if (line) setOffset(line.offsetTop + line.offsetHeight / 2 - height * FOCUS);
  }, [active, lines, width]);

  const scrollBy = (delta: number) => {
    const first = lineElements.current[0];
    const last = lines ? lineElements.current[lines.length - 1] : null;
    const height = view.current?.clientHeight ?? 0;
    if (!first || !last) return;
    const top = first.offsetTop - height * FOCUS;
    const bottom = last.offsetTop + last.offsetHeight - height * FOCUS;
    setManual((current) => Math.min(bottom, Math.max(top, (current ?? offset) + delta)));
    if (followTimer.current) clearTimeout(followTimer.current);
    followTimer.current = setTimeout(() => setManual(null), FOLLOW_AGAIN_MS);
  };

  const playFrom = (line: LyricLine) => {
    if (!appService) return;
    setManual(null);
    anchor.current = { ...anchor.current, positionMs: line.time, at: performance.now() };
    useMusicStore.getState().seek(appService, line.time);
  };

  const shift = manual ?? offset;
  const size = large ? 'py-[40%] text-[1.6rem]' : 'py-[45%] text-xl';
  let message = '';
  if (!track) message = _('Not Playing');
  else if (!loading && !lyrics) message = _('No Lyrics');

  return (
    <div
      ref={view}
      className={clsx('relative touch-none select-none overflow-hidden', className)}
      onWheel={(event) => scrollBy(event.deltaY)}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') dragY.current = event.clientY;
      }}
      onPointerMove={(event) => {
        if (dragY.current === null) return;
        scrollBy(dragY.current - event.clientY);
        dragY.current = event.clientY;
      }}
      onPointerUp={() => {
        dragY.current = null;
      }}
      onPointerCancel={() => {
        dragY.current = null;
      }}
    >
      {loading && (
        <div className='flex h-full items-center justify-center'>
          <span className='loading loading-spinner loading-sm opacity-50' />
        </div>
      )}
      {message && (
        <div className='text-base-content/50 flex h-full flex-col items-center justify-center gap-2 px-6 text-center'>
          <p className='text-sm'>{message}</p>
          {track && !lyrics && (
            <p className='text-xs'>
              {_('Put a .lrc file with the same name beside the song, or add lyrics to its tags.')}
            </p>
          )}
        </div>
      )}
      {lyrics && !lines && (
        <div className='h-full touch-auto overflow-y-auto px-5 py-6'>
          {lyrics.lines.map((line, i) => (
            <p key={i} className='py-1 text-base font-semibold leading-relaxed'>
              {line.text}
            </p>
          ))}
        </div>
      )}
      {lines && (
        <div ref={list} className={clsx('relative px-5', size)}>
          {lines.map((line, i) => {
            const current = i === active;
            const distance = Math.abs(i - active);
            const delay = manual === null ? Math.max(0, Math.min(i - active + 1, 8)) : 0;
            const blur = still || current ? undefined : `blur(${Math.min(distance, 5) * 0.45}px)`;
            return (
              <button
                key={`${line.time}-${i}`}
                ref={(element) => {
                  lineElements.current[i] = element;
                }}
                type='button'
                tabIndex={-1}
                className={clsx(
                  'block w-full origin-left text-start font-bold leading-snug',
                  line.text ? 'py-2' : 'py-0',
                  !current && 'hover:opacity-70!',
                  !still && 'transition-[transform,opacity,filter] duration-700 ease-out',
                )}
                style={{
                  transform: `translateY(${-shift}px) scale(${current ? 1 : 0.95})`,
                  opacity: current ? 1 : 0.3,
                  filter: blur,
                  transitionDelay: `${delay * STAGGER_MS}ms`,
                }}
                onClick={() => playFrom(line)}
              >
                {!line.text && <Pause current={current} />}
                {line.text && current && words ? (
                  <Words words={words} glow={isDarkMode && !still} />
                ) : (
                  line.text
                )}
                {line.translation && (
                  <span className='mt-1 block text-[0.72em] font-semibold opacity-80'>
                    {line.translation}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LyricsView;
