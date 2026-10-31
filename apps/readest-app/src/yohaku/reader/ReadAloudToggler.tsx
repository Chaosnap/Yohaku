import clsx from 'clsx';
import { useState } from 'react';
import {
  MdAlarm,
  MdOpenInFull,
  MdOutlineHeadphones,
  MdPause,
  MdPlayArrow,
  MdSkipNext,
  MdSkipPrevious,
  MdStop,
} from 'react-icons/md';
import { RiForward30Line, RiReplay15Line } from 'react-icons/ri';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';
import { loadShortcuts } from '@/helpers/shortcuts';
import { useBookDataStore } from '@/store/bookDataStore';
import { useBookProgress } from '@/store/readerProgressStore';
import { useReaderStore } from '@/store/readerStore';
import { eventDispatcher } from '@/utils/event';
import { formatPlaybackTime } from '@/utils/time';
import Dropdown from '@/components/Dropdown';
import Menu from '@/components/Menu';
import BufferingRing from '@/app/reader/components/tts/BufferingRing';
import { useCountdownLabel } from '@/app/reader/components/tts/useCountdownLabel';
import { usePlaybackInfo } from '@/app/reader/components/tts/usePlaybackInfo';
import AmbientPanel from '@/yohaku/ambient/AmbientPanel';
import { useReadAloudStore, type ReadAloudControls } from './readAloud';

const useReadingAloud = (bookKey: string) =>
  useReaderStore((state) => !!state.viewStates[bookKey]?.ttsEnabled);

const ICON_BUTTON = clsx(
  'text-base-content/75 hover:text-base-content shrink-0 rounded-full p-1.5',
  'not-eink:hover:bg-base-content/10 not-eink:transition-colors',
);

interface ReadAloudPlayerProps {
  bookKey: string;
  controls: ReadAloudControls;
  onExpand: () => void;
}

/**
 * Readest's read-aloud controls, laid out like the music player and kept in
 * this panel: Yohaku shows no player floating over the page.
 */
const ReadAloudPlayer: React.FC<ReadAloudPlayerProps> = ({ bookKey, controls, onExpand }) => {
  const _ = useTranslation();
  const { getBookData } = useBookDataStore();
  const progress = useBookProgress(bookKey);
  const { isPlaying, buffering, isEink, hasTimeline, audioTransport } = controls;
  const { chapterRemainingSec, onGetPlaybackInfo } = controls;
  const playback = usePlaybackInfo({ bookKey, isEink, onGetPlaybackInfo });
  const timerLabel = useCountdownLabel(controls.timeoutTimestamp);
  const [coverFailed, setCoverFailed] = useState(false);
  const iconSize14 = useResponsiveSize(14);
  const iconSize20 = useResponsiveSize(20);
  const iconSize24 = useResponsiveSize(24);
  const iconSize28 = useResponsiveSize(28);

  const book = getBookData(bookKey)?.book;
  const { ready, position, total } = playback;
  const timed = hasTimeline && ready && total > 0;
  const played = timed ? Math.min((position / total) * 100, 100) : 0;
  let timeLabel = '';
  if (timed) {
    const remaining = Math.max(total - position, 0);
    timeLabel = `${formatPlaybackTime(position)} · -${formatPlaybackTime(remaining)}`;
  } else if (chapterRemainingSec !== null) {
    timeLabel = _('{{time}} left in chapter', { time: formatPlaybackTime(chapterRemainingSec) });
  }
  const details = [progress?.sectionLabel, timeLabel].filter(Boolean).join(' · ');
  const playLabel = isPlaying ? _('Pause') : _('Play');
  const backLabel = audioTransport ? _('Back 15 Seconds') : _('Previous Sentence');
  const forwardLabel = audioTransport ? _('Forward 30 Seconds') : _('Next Sentence');

  return (
    <div>
      <div className='flex items-center gap-3'>
        {book?.coverImageUrl && !coverFailed ? (
          <img
            src={book.coverImageUrl}
            alt=''
            className='not-eink:shadow-md size-12 shrink-0 rounded-lg object-cover'
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className='bg-base-300 flex size-12 shrink-0 items-center justify-center rounded-lg'>
            <MdOutlineHeadphones className='size-6' />
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{book?.title ?? _('Read Aloud')}</p>
          <p className='text-base-content/60 truncate text-xs tabular-nums'>{details}</p>
        </div>
      </div>
      {timed && (
        <div className='bg-base-content/10 mt-3 h-1 overflow-hidden rounded-full'>
          <div
            className='not-eink:bg-base-content/60 eink:bg-base-content h-full rounded-full'
            style={{ width: `${played}%` }}
          />
        </div>
      )}
      <div dir='ltr' className='mt-3 flex items-center justify-between'>
        <button
          type='button'
          className={ICON_BUTTON}
          aria-label={_('Stop reading aloud')}
          title={_('Stop reading aloud')}
          onClick={controls.onStop}
        >
          <MdStop size={iconSize20} />
        </button>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={backLabel}
            title={backLabel}
            onClick={() => controls.onBackward(true)}
          >
            {audioTransport ? (
              <RiReplay15Line size={iconSize24} />
            ) : (
              <MdSkipPrevious size={iconSize28} />
            )}
          </button>
          <button
            type='button'
            className={clsx(
              'bg-base-content text-base-100 relative flex size-11 shrink-0 items-center',
              'not-eink:shadow-md justify-center rounded-full active:scale-95',
            )}
            aria-label={playLabel}
            aria-busy={buffering}
            title={playLabel}
            onClick={controls.onTogglePlay}
          >
            {isPlaying ? <MdPause size={iconSize28} /> : <MdPlayArrow size={iconSize28} />}
            {buffering && <BufferingRing size={44} isEink={isEink} />}
          </button>
          <button
            type='button'
            className={ICON_BUTTON}
            aria-label={forwardLabel}
            title={forwardLabel}
            onClick={() => controls.onForward(true)}
          >
            {audioTransport ? (
              <RiForward30Line size={iconSize24} />
            ) : (
              <MdSkipNext size={iconSize28} />
            )}
          </button>
        </div>
        <button
          type='button'
          className={ICON_BUTTON}
          aria-label={_('Open Read Aloud player')}
          title={_('Open Read Aloud player')}
          onClick={onExpand}
        >
          <MdOpenInFull size={iconSize20} />
        </button>
      </div>
      {timerLabel && (
        <p className='text-base-content/60 mt-2 flex items-center justify-center gap-1 text-xs tabular-nums'>
          <MdAlarm size={iconSize14} aria-hidden='true' />
          {timerLabel}
        </p>
      )}
    </div>
  );
};

interface ReadAloudMenuProps {
  bookKey: string;
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

/** Reading aloud, with Yohaku's ambient sounds to listen to beside it or alone. */
const ReadAloudMenu: React.FC<ReadAloudMenuProps> = ({ bookKey, setIsDropdownOpen }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const reading = useReadingAloud(bookKey);
  const controls = useReadAloudStore((state) => state.controls[bookKey]);
  const key = loadShortcuts().onToggleTTS.keys[0]?.toUpperCase();
  const label = reading ? _('Stop reading aloud') : _('Read Aloud');

  // The controls take the place of this row once reading aloud starts.
  const toggle = () => eventDispatcher.dispatch(reading ? 'tts-stop' : 'tts-speak', { bookKey });
  const expand = () => {
    setIsDropdownOpen?.(false);
    controls?.onExpand();
  };

  return (
    <Menu
      className='dropdown-content no-triangle bgcolor-base-200 z-20 mt-1.5 w-72 border p-4 shadow-2xl'
      onCancel={() => setIsDropdownOpen?.(false)}
    >
      {controls ? (
        <ReadAloudPlayer bookKey={bookKey} controls={controls} onExpand={expand} />
      ) : (
        <div className='flex items-center gap-3'>
          <div className='bg-base-300 flex size-12 shrink-0 items-center justify-center rounded-lg'>
            <MdOutlineHeadphones className={clsx('size-6', reading && 'text-blue-500')} />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>{_('Read Aloud')}</p>
            <p className='text-base-content/60 truncate text-xs'>
              {reading ? _('Reading aloud') : _('From the current page')}
            </p>
          </div>
          <button
            className='btn btn-circle btn-sm'
            aria-label={label}
            title={label}
            onClick={toggle}
          >
            {reading ? <MdStop size={18} /> : <MdPlayArrow size={18} />}
          </button>
        </div>
      )}
      <div className='mt-4'>
        <AmbientPanel scenesOnly />
      </div>
      {!appService?.isMobile && key && (
        <div className='text-base-content/60 mt-4 flex items-center gap-1 text-xs'>
          <kbd className='kbd kbd-xs'>{key}</kbd>
          {_('Toggle Text to Speech')}
        </div>
      )}
    </Menu>
  );
};

interface ReadAloudTogglerProps {
  bookKey: string;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * The reader's read-aloud button, at the top right: reading aloud starts and
 * is controlled from its panel, which also holds the ambient sounds. Music is
 * at the foot of the page.
 */
const ReadAloudToggler: React.FC<ReadAloudTogglerProps> = ({ bookKey, onToggle }) => {
  const _ = useTranslation();
  const iconSize18 = useResponsiveSize(18);
  const reading = useReadingAloud(bookKey);
  return (
    <Dropdown
      label={_('Read Aloud')}
      containerClassName='h-8'
      className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
      buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0 mt-0'
      toggleButton={
        <MdOutlineHeadphones size={iconSize18} className={clsx(reading && 'text-blue-500')} />
      }
      onToggle={onToggle}
    >
      <ReadAloudMenu bookKey={bookKey} />
    </Dropdown>
  );
};

export default ReadAloudToggler;
