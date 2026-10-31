import { IoPlay } from 'react-icons/io5';
import { MdOutlineDelete } from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatBytes, formatDate } from '@/utils/book';
import Dialog from '@/components/Dialog';
import { fileName } from '@/yohaku/audio/engine';
import Cover from './Cover';
import { formatDuration, type Album, type MusicTrack } from './library';
import { useMusicStore } from './store';

/** A path, or a content URI with its escapes undone. */
const readable = (uri: string) => {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
};

const formatOf = (uri: string) => /\.(\w+)$/.exec(fileName(uri))?.[1]?.toUpperCase() ?? '';
const folderOf = (uri: string) => {
  const path = readable(uri);
  return path.slice(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')));
};
const distinct = <T,>(values: (T | undefined)[]) => [
  ...new Set(values.filter((value): value is T => !!value)),
];

const formatBitrate = (kbps?: number) => (kbps ? `${kbps} kbps` : '');
const formatSampleRate = (hz?: number) =>
  hz ? `${(hz / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kHz` : '';

interface Field {
  label: string;
  value: string;
}

interface DetailsProps {
  title: string;
  cover?: string;
  heading: string;
  byline: string;
  actions: React.ReactNode;
  fields: Field[];
  location?: string;
  onClose: () => void;
}

/** A song's or an album's details, laid out as Readest's book details. */
const Details: React.FC<DetailsProps> = ({
  title,
  cover,
  heading,
  byline,
  actions,
  fields,
  location,
  onClose,
}) => {
  const _ = useTranslation();
  return (
    <Dialog
      isOpen
      title={title}
      onClose={onClose}
      boxClassName='sm:min-w-[480px] sm:max-w-[480px] sm:h-auto sm:max-h-[90%]'
      contentClassName='px-6! py-4!'
    >
      <div className='w-full select-text'>
        <div className='mb-6 flex items-start gap-6'>
          <Cover
            path={cover}
            title={heading}
            className='not-eink:shadow-lg eink-bordered w-32 shrink-0 rounded-lg'
          />
          <div className='flex min-h-32 min-w-0 flex-col justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-base-content mb-2 line-clamp-2 break-words text-lg font-bold'>
                {heading}
              </p>
              <p className='text-neutral-content line-clamp-1'>{byline}</p>
            </div>
            <div className='flex items-center gap-4'>{actions}</div>
          </div>
        </div>
        <h3 className='text-neutral-content/85 px-4 py-3 text-base font-semibold'>
          {_('Metadata')}
        </h3>
        <dl className='grid grid-cols-2 gap-4 px-4 py-1 sm:grid-cols-3'>
          {fields.map(({ label, value }) => (
            <div key={label} className='overflow-hidden'>
              <dt className='font-bold'>{label}</dt>
              <dd className='text-neutral-content break-words text-sm'>{value || _('Unknown')}</dd>
            </div>
          ))}
        </dl>
        {location && (
          <div className='px-4 pb-2 pt-4'>
            <p className='font-bold'>{_('Location')}</p>
            <p className='text-neutral-content break-all text-sm'>{location}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};

interface TrackDetailsProps {
  track: MusicTrack;
  onClose: () => void;
}

/** One song: its tags, what the file is, and where it is. */
export const TrackDetails: React.FC<TrackDetailsProps> = ({ track, onClose }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  // A song from a synced folder would come back with the next sync.
  const imported = useMusicStore((state) => state.library.files.includes(track.uri));

  const play = () => {
    if (appService) useMusicStore.getState().play(appService, [track], 0);
    onClose();
  };
  const remove = () => {
    if (appService) useMusicStore.getState().removeTrack(appService, track);
    onClose();
  };

  const fields = [
    { label: _('Album'), value: track.album },
    { label: _('Artist'), value: track.artist },
    { label: _('Track'), value: track.trackNo ? String(track.trackNo) : '' },
    { label: _('Disc'), value: track.discNo ? String(track.discNo) : '' },
    { label: _('Duration'), value: track.durationMs ? formatDuration(track.durationMs) : '' },
    { label: _('Year'), value: track.year ? String(track.year) : '' },
    { label: _('Genre'), value: track.genre ?? '' },
    { label: _('Format'), value: formatOf(track.uri) },
    { label: _('Bitrate'), value: formatBitrate(track.bitrate) },
    { label: _('Sample Rate'), value: formatSampleRate(track.sampleRate) },
    { label: _('File Size'), value: formatBytes(track.size) },
    { label: _('Added'), value: formatDate(track.addedAt) ?? '' },
  ];

  return (
    <Details
      title={_('Song Details')}
      cover={track.cover}
      heading={track.title}
      byline={track.artist || _('Unknown Artist')}
      fields={fields}
      location={readable(track.uri)}
      onClose={onClose}
      actions={
        <>
          <button title={_('Play')} aria-label={_('Play')} onClick={play}>
            <IoPlay className='size-5' />
          </button>
          {imported && (
            <button
              title={_('Remove from Library')}
              aria-label={_('Remove from Library')}
              onClick={remove}
            >
              <MdOutlineDelete className='size-5 fill-red-500' />
            </button>
          )}
        </>
      }
    />
  );
};

interface AlbumDetailsProps {
  album: Album;
  onClose: () => void;
}

/** One album: its songs taken together. */
export const AlbumDetails: React.FC<AlbumDetailsProps> = ({ album, onClose }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { tracks } = album;

  const play = () => {
    if (appService) useMusicStore.getState().play(appService, tracks, 0);
    onClose();
  };

  const duration = tracks.reduce((total, track) => total + track.durationMs, 0);
  const size = tracks.reduce((total, track) => total + (track.size ?? 0), 0);
  const years = distinct(tracks.map(({ year }) => year)).sort((a, b) => a - b);
  const yearRange = years.length > 1 ? `${years[0]}–${years.at(-1)}` : String(years[0] ?? '');
  const added = Math.min(...tracks.map(({ addedAt }) => addedAt));
  const folders = distinct(tracks.map(({ uri }) => folderOf(uri)));
  const fields = [
    { label: _('Artist'), value: album.artist },
    { label: _('Songs'), value: String(tracks.length) },
    { label: _('Duration'), value: duration ? formatDuration(duration) : '' },
    { label: _('Year'), value: yearRange },
    { label: _('Genre'), value: distinct(tracks.map(({ genre }) => genre)).join(', ') },
    { label: _('Format'), value: distinct(tracks.map(({ uri }) => formatOf(uri))).join(', ') },
    { label: _('File Size'), value: formatBytes(size) },
    { label: _('Added'), value: formatDate(added) ?? '' },
  ];

  return (
    <Details
      title={_('Album Details')}
      cover={album.cover}
      heading={album.title}
      byline={album.artist || _('Unknown Artist')}
      fields={fields}
      location={folders.length === 1 ? folders[0] : undefined}
      onClose={onClose}
      actions={
        <button title={_('Play')} aria-label={_('Play')} onClick={play}>
          <IoPlay className='size-5' />
        </button>
      }
    />
  );
};
