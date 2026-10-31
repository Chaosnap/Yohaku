import { IoClose, IoDocumentOutline, IoFolderOutline } from 'react-icons/io5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { fileName } from '@/yohaku/audio/engine';
import { isUnder } from './library';
import { useMusicStore } from './store';

const HEADING = 'text-base-content/60 text-xs font-semibold uppercase tracking-wider';

interface SourceRowProps {
  icon: React.ReactNode;
  name: string;
  details: string;
  onRemove: () => void;
}

const SourceRow: React.FC<SourceRowProps> = ({ icon, name, details, onRemove }) => {
  const _ = useTranslation();
  return (
    <li className='flex items-center gap-3 py-2'>
      {icon}
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm'>{name}</span>
        {details && <span className='text-base-content/50 block truncate text-xs'>{details}</span>}
      </span>
      <button
        className='btn btn-ghost btn-xs btn-square'
        aria-label={_('Remove')}
        title={_('Remove')}
        onClick={onRemove}
      >
        <IoClose size={16} />
      </button>
    </li>
  );
};

/** Where the library's songs come from: synced folders and files imported one by one. */
const Sources: React.FC = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const library = useMusicStore((state) => state.library);
  if (!appService) return null;

  const { addFolder, importFiles, removeFolder, removeTrack } = useMusicStore.getState();
  const imported = library.tracks.filter((track) => library.files.includes(track.uri));
  const folderDetails = (folder: string) => {
    const count = library.tracks.filter((track) => isUnder(track.uri, folder)).length;
    const songs = _('{{count}} Song(s)', { count });
    // A folder on Android is a content URI, which says nothing to the user.
    return folder.startsWith('content://') ? songs : `${songs} · ${folder}`;
  };

  return (
    <div className='flex max-w-2xl flex-col gap-8'>
      <section>
        <div className='flex items-center justify-between'>
          <h3 className={HEADING}>{_('Synced Folders')}</h3>
          <button className='btn btn-ghost btn-xs' onClick={() => addFolder(appService)}>
            {_('Add Folder')}
          </button>
        </div>
        <p className='text-base-content/60 mt-1 text-sm'>
          {_('Every song in these folders and their subfolders is in the library.')}
        </p>
        <ul className='mt-2'>
          {library.folders.map((folder) => (
            <SourceRow
              key={folder}
              icon={<IoFolderOutline className='text-base-content/60 h-5 w-5 shrink-0' />}
              name={fileName(folder)}
              details={folderDetails(folder)}
              onRemove={() => removeFolder(appService, folder)}
            />
          ))}
        </ul>
      </section>
      <section>
        <div className='flex items-center justify-between'>
          <h3 className={HEADING}>{_('Imported Files')}</h3>
          <button className='btn btn-ghost btn-xs' onClick={() => importFiles(appService)}>
            {_('Import Files')}
          </button>
        </div>
        <p className='text-base-content/60 mt-1 text-sm'>
          {_('Songs imported one by one. The files stay where they are.')}
        </p>
        <ul className='mt-2'>
          {imported.map((track) => (
            <SourceRow
              key={track.id}
              icon={<IoDocumentOutline className='text-base-content/60 h-5 w-5 shrink-0' />}
              name={track.title}
              details={fileName(track.uri)}
              onRemove={() => removeTrack(appService, track)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Sources;
